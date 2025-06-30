import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Model configuration for easy swapping
const MODELS = {
  test: "flux-kontext-apps/restore-image",
  production: "tencentarc/gfpgan:xxx" // Future swap if needed
};
const CURRENT_MODEL = MODELS.test;

// Production Supabase configuration
const SUPABASE_PROJECT_URL = 'https://hhwugsiztorplhxztuei.supabase.co';

// Legacy local development configuration (commented out for production)
// const URL_CONFIG = {
//   development: {
//     internal: 'kong:8000',
//     external: 'localhost:54321'
//   },
//   production: {
//     internal: 'kong:8000', 
//     external: 'hhwugsiztorplhxztuei.supabase.co'
//   }
// };
// const CURRENT_ENV = 'development';
// const currentUrlConfig = URL_CONFIG[CURRENT_ENV];

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
        
        // Download restored image from Replicate and store in our bucket
        try {
          console.log('Downloading restored image from:', webhook.output);
          const imageResponse = await fetch(webhook.output);
          if (!imageResponse.ok) {
            throw new Error(`Failed to download image: ${imageResponse.status}`);
          }
          
          // Get the original filename without extension and add unique timestamp + _restored.png
          const originalPath = job.image_path; // e.g., "user_id/filename.jpg"
          const pathParts = originalPath.split('/');
          const filename = pathParts[pathParts.length - 1];
          const nameWithoutExt = filename.split('.')[0];
          
          // Add timestamp to make each restoration unique
          const restorationTimestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
          const restoredFilename = `${nameWithoutExt}_restored_${restorationTimestamp}.png`;
          const restoredPath = `${job.user_id}/${restoredFilename}`;
          
          console.log('Generating unique restored filename:', restoredFilename);
          
          // Upload to restored-images bucket
          const imageBlob = await imageResponse.blob();
          const { error: uploadError } = await supabaseClient.storage
            .from('restored-images')
            .upload(restoredPath, imageBlob, {
              contentType: 'image/png',
              upsert: true
            });
            
          if (uploadError) {
            console.error('Error uploading restored image:', uploadError);
            throw uploadError;
          }
          
          console.log('Restored image uploaded to:', restoredPath);
          
          // Get the public URL for the uploaded image
          const { data: publicUrlData } = supabaseClient.storage
            .from('restored-images')
            .getPublicUrl(restoredPath);
          
          // Use public URL directly - Supabase production URLs are already correct
          let publicUrl = publicUrlData.publicUrl;
          console.log('📸 Restored image public URL:', publicUrl);
          
          // Legacy URL fixing for local development (commented out for production)
          // if (publicUrl.includes(currentUrlConfig.internal)) {
          //   publicUrl = publicUrl.replace(currentUrlConfig.internal, currentUrlConfig.external);
          //   console.log('Fixed public URL for environment access:', publicUrl);
          // }
          
          updateData.result_url = publicUrl; // Store complete public URL with correct hostname
        } catch (error) {
          console.error('Error processing restored image:', error);
          // Fallback to external URL if our upload fails
          updateData.result_url = webhook.output;
        }
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

      // Save completed jobs to saved_images table
      if (webhook.status === 'succeeded' && updateData.result_url) {
        console.log('Saving completed job to saved_images table');
        
        // Get the original file URL from storage
        const { data: originalUrlData } = supabaseClient.storage
          .from('files')
          .getPublicUrl(job.image_path);
        
        // Use original URL directly - Supabase production URLs are already correct
        let originalUrl = originalUrlData.publicUrl;
        console.log('📷 Original image public URL:', originalUrl);
        
        // Legacy URL fixing for local development (commented out for production)
        // if (originalUrl.includes(currentUrlConfig.internal)) {
        //   originalUrl = originalUrl.replace(currentUrlConfig.internal, currentUrlConfig.external);
        //   console.log('Fixed original URL for environment access:', originalUrl);
        // }
        
        // Create basic prompt from filename
        const filename = job.image_path.split('/').pop() || '';
        const basicPrompt = `Restored photo: ${filename}`;
        
        const savedImageData = {
          user_id: job.user_id,
          original_url: originalUrl,
          edited_url: updateData.result_url,
          prompt: basicPrompt,
          is_hd: true, // Currently all restorations are HD
          prediction_id: job.prediction_id,
          tags: [], // Empty tags array for now
          thumbnail_url: null // Will be generated later if needed
        };
        
        const { error: saveError } = await supabaseClient
          .from('saved_images')
          .insert(savedImageData);
        
        if (saveError) {
          console.error('Error saving to saved_images:', saveError);
          // Don't fail the webhook if saving to saved_images fails
        } else {
          console.log('Successfully saved completed job to saved_images table');
        }
      }

      console.log(`Job ${job.id} updated to status: ${updateData.status}`);
      return new Response('Webhook processed', { headers: corsHeaders });

    } else if (req.method === 'POST') {
      // Start restoration job
      console.log('🚀 Edge Function: Starting restoration job');
      const { user_id, image_path }: StartJobRequest = await req.json();
      console.log('📝 Edge Function: Request data:', { user_id, image_path });

      if (!user_id || !image_path) {
        console.log('❌ Edge Function: Missing user_id or image_path');
        return new Response('Missing user_id or image_path', { status: 400, headers: corsHeaders });
      }

      // Get signed URL for the private file
      console.log('🔗 Edge Function: Creating signed URL for:', image_path);
      const { data: signedUrlData, error: urlError } = await supabaseClient
        .storage
        .from('files')
        .createSignedUrl(image_path, 3600); // 1 hour expiry

      console.log('🔗 Edge Function: Signed URL result:', { signedUrlData, urlError });

      if (urlError || !signedUrlData) {
        console.error('❌ Edge Function: Error creating signed URL:', urlError);
        return new Response('Error accessing image', { status: 400, headers: corsHeaders });
      }

      // Use the signed URL directly - Supabase production URLs are already externally accessible
      let publicUrl = signedUrlData.signedUrl;
      console.log('🔗 Edge Function: Using signed URL for Replicate:', publicUrl);
      
      // Legacy local development URL fixing (commented out for production)
      // const ngrokHost = Deno.env.get('WEBHOOK_BASE_URL')?.replace('https://', '') || currentUrlConfig.external;
      // if (publicUrl.includes(currentUrlConfig.internal)) {
      //   publicUrl = publicUrl.replace(currentUrlConfig.internal, ngrokHost);
      //   console.log('Fixed signed URL for external access (internal -> ngrok):', publicUrl);
      // } else if (publicUrl.includes(currentUrlConfig.external)) {
      //   publicUrl = publicUrl.replace(currentUrlConfig.external, ngrokHost);
      //   console.log('Fixed signed URL for external access (external -> ngrok):', publicUrl);
      // } else if (publicUrl.includes('127.0.0.1:54321')) {
      //   publicUrl = publicUrl.replace('127.0.0.1:54321', ngrokHost);
      //   console.log('Fixed signed URL for external access (127.0.0.1 -> ngrok):', publicUrl);
      // }

      // Create processing job record with timeout
      const timeoutMinutes = 10; // 10 minute timeout
      const timeoutAt = new Date(Date.now() + timeoutMinutes * 60 * 1000).toISOString();
      
      const { data: job, error: jobError } = await supabaseClient
        .from('processing_jobs')
        .insert({
          user_id,
          image_path,
          status: 'processing',
          prediction_id: '', // Will be updated after Replicate call
          started_at: new Date().toISOString(),
          timeout_at: timeoutAt,
        })
        .select()
        .single();

      if (jobError || !job) {
        console.error('Error creating job:', jobError);
        return new Response('Error creating job', { status: 500, headers: corsHeaders });
      }

      // Prepare webhook URL - use production Supabase URL
      const webhookUrl = `${SUPABASE_PROJECT_URL}/functions/v1/restore-photo/webhook`;
      
      // Legacy local development webhook configuration (commented out)
      // const webhookBaseUrl = Deno.env.get('WEBHOOK_BASE_URL') || 'http://localhost:54321';
      // const webhookUrl = `${webhookBaseUrl}/functions/v1/restore-photo/webhook`;

      // Call Replicate API
      const replicateToken = Deno.env.get('REPLICATE_API_TOKEN');
      console.log('🔑 Edge Function: Replicate token available:', !!replicateToken);
      if (!replicateToken) {
        console.error('❌ Edge Function: Replicate API token not configured');
        return new Response('Replicate API token not configured', { status: 500, headers: corsHeaders });
      }

      console.log('🎯 Edge Function: Webhook URL:', webhookUrl);
      console.log('🤖 Edge Function: Calling Replicate API with model:', CURRENT_MODEL);
      console.log('🖼️ Edge Function: Image URL for Replicate:', publicUrl);

      const replicatePayload = {
        input: {
          input_image: publicUrl,
          output_format: "png",
          safety_tolerance: 2
        },
        webhook: webhookUrl,
        webhook_events_filter: ["completed"]
      };
      console.log('📦 Edge Function: Replicate payload:', JSON.stringify(replicatePayload, null, 2));

      const replicateResponse = await fetch(`https://api.replicate.com/v1/models/${CURRENT_MODEL}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${replicateToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(replicatePayload),
      });

      console.log('📡 Edge Function: Replicate API response status:', replicateResponse.status);

      if (!replicateResponse.ok) {
        const errorText = await replicateResponse.text();
        const responseHeaders = Object.fromEntries(replicateResponse.headers.entries());
        
        console.error('❌ Edge Function: Replicate API error:', errorText);
        console.error('❌ Edge Function: Replicate response status:', replicateResponse.status);
        console.error('❌ Edge Function: Replicate response headers:', responseHeaders);
        console.error('❌ Edge Function: Replicate payload sent:', JSON.stringify(replicatePayload, null, 2));
        
        // Create detailed error message for database storage
        const detailedError = {
          status: replicateResponse.status,
          error: errorText,
          headers: responseHeaders,
          payload_sent: replicatePayload,
          timestamp: new Date().toISOString(),
          execution_id: Deno.env.get('DENO_EXECUTION_ID') || 'unknown'
        };
        
        // Update job status to failed with detailed error information
        await supabaseClient
          .from('processing_jobs')
          .update({ 
            status: 'failed', 
            error_message: `Replicate API Error: ${errorText}`,
            metadata: detailedError
          })
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