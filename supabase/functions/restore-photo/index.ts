import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Model configuration for easy swapping
const MODELS = {
  test: "flux-kontext-apps/restore-image",
  production: "tencentarc/gfpgan:xxx" // Future swap if needed
};
const CURRENT_MODEL = MODELS.test;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StartJobRequest {
  user_id: string;
  image_path: string;
}

interface ReplicateWebhook {
  id: string;
  status: string;
  output?: any;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    console.log(`${req.method} ${path}`);

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    if (path.endsWith('/webhook') && req.method === 'POST') {
      console.log('Processing webhook from Replicate');
      // Handle Replicate webhook
      const webhook: ReplicateWebhook = await req.json();
      console.log('Received webhook:', webhook);

      // Find the processing job by prediction_id
      const { data: job, error: findError } = await supabaseClient
        .from('processing_jobs')
        .select('*')
        .eq('prediction_id', webhook.id)
        .single();

      if (findError || !job) {
        console.error('Job not found for prediction:', webhook.id);
        return new Response('Job not found', { status: 404, headers: corsHeaders });
      }

      // Update job based on webhook status
      let updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (webhook.status === 'succeeded') {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
        // According to schema, output is a single string URI
        updateData.result_url = webhook.output;
      } else if (webhook.status === 'failed') {
        updateData.status = 'failed';
        updateData.error_message = webhook.error || 'Processing failed';
        updateData.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabaseClient
        .from('processing_jobs')
        .update(updateData)
        .eq('id', job.id);

      if (updateError) {
        console.error('Error updating job:', updateError);
        return new Response('Error updating job', { status: 500, headers: corsHeaders });
      }

      console.log(`Job ${job.id} updated to status: ${updateData.status}`);
      return new Response('Webhook processed', { headers: corsHeaders });

    } else if (req.method === 'POST') {
      // Start restoration job
      const { user_id, image_path }: StartJobRequest = await req.json();

      if (!user_id || !image_path) {
        return new Response('Missing user_id or image_path', { status: 400, headers: corsHeaders });
      }

      // Get signed URL for the private file
      const { data: signedUrlData, error: urlError } = await supabaseClient
        .storage
        .from('files')
        .createSignedUrl(image_path, 3600); // 1 hour expiry

      if (urlError || !signedUrlData) {
        console.error('Error creating signed URL:', urlError);
        return new Response('Error accessing image', { status: 400, headers: corsHeaders });
      }

      // Fix signed URL for local development - replace internal hostnames with ngrok URL
      let publicUrl = signedUrlData.signedUrl;
      const ngrokHost = Deno.env.get('WEBHOOK_BASE_URL')?.replace('https://', '') || 'localhost:54321';
      
      if (publicUrl.includes('kong:8000')) {
        publicUrl = publicUrl.replace('kong:8000', ngrokHost);
        console.log('Fixed signed URL for external access (kong):', publicUrl);
      } else if (publicUrl.includes('localhost:54321')) {
        publicUrl = publicUrl.replace('localhost:54321', ngrokHost);
        console.log('Fixed signed URL for external access (localhost):', publicUrl);
      }

      // Create processing job record
      const { data: job, error: jobError } = await supabaseClient
        .from('processing_jobs')
        .insert({
          user_id,
          image_path,
          status: 'processing',
          prediction_id: '', // Will be updated after Replicate call
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (jobError || !job) {
        console.error('Error creating job:', jobError);
        return new Response('Error creating job', { status: 500, headers: corsHeaders });
      }

      // Prepare webhook URL
      const webhookBaseUrl = Deno.env.get('WEBHOOK_BASE_URL') || 'http://localhost:54321';
      const webhookUrl = `${webhookBaseUrl}/functions/v1/restore-photo/webhook`;

      // Call Replicate API
      const replicateToken = Deno.env.get('REPLICATE_API_TOKEN');
      if (!replicateToken) {
        return new Response('Replicate API token not configured', { status: 500, headers: corsHeaders });
      }

      console.log('Webhook URL:', webhookUrl);
      console.log('Calling Replicate API with model:', CURRENT_MODEL);

      const replicateResponse = await fetch(`https://api.replicate.com/v1/models/${CURRENT_MODEL}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${replicateToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            input_image: publicUrl,
            output_format: "png",
            safety_tolerance: 2
          },
          webhook: webhookUrl,
          webhook_events_filter: ["completed"]
        }),
      });

      if (!replicateResponse.ok) {
        const errorText = await replicateResponse.text();
        console.error('Replicate API error:', errorText);
        
        // Update job status to failed
        await supabaseClient
          .from('processing_jobs')
          .update({ status: 'failed', error_message: 'Failed to start processing' })
          .eq('id', job.id);

        return new Response('Error calling Replicate API', { status: 500, headers: corsHeaders });
      }

      const prediction = await replicateResponse.json();
      console.log('Replicate prediction created:', prediction.id);

      // Update job with prediction ID
      const { error: updateError } = await supabaseClient
        .from('processing_jobs')
        .update({ prediction_id: prediction.id })
        .eq('id', job.id);

      if (updateError) {
        console.error('Error updating job with prediction ID:', updateError);
      }

      return new Response(JSON.stringify({ 
        job_id: job.id, 
        prediction_id: prediction.id,
        status: 'processing'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

  } catch (error) {
    console.error('Function error:', error);
    return new Response('Internal server error', { status: 500, headers: corsHeaders });
  }
});