/// <reference types="https://deno.land/x/deno_types/lib.deno.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Running job cleanup...');

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

    // Find jobs that have timed out (older than timeout_at or stuck in processing for more than 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data: timedOutJobs, error: fetchError } = await supabaseClient
      .from('processing_jobs')
      .select('*')
      .in('status', ['pending', 'processing'])
      .or(`timeout_at.lt.${new Date().toISOString()},and(timeout_at.is.null,started_at.lt.${fifteenMinutesAgo})`);

    if (fetchError) {
      console.error('Error fetching timed out jobs:', fetchError);
      return new Response('Error fetching jobs', { status: 500, headers: corsHeaders });
    }

    if (!timedOutJobs || timedOutJobs.length === 0) {
      console.log('No timed out jobs found');
      return new Response(JSON.stringify({ 
        message: 'Cleanup completed', 
        cleaned: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${timedOutJobs.length} timed out jobs`);

    // Update all timed out jobs to failed status
    const jobIds = timedOutJobs.map(job => job.id);
    
    const { error: updateError } = await supabaseClient
      .from('processing_jobs')
      .update({
        status: 'failed',
        error_message: 'Job timed out - processing took too long',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', jobIds);

    if (updateError) {
      console.error('Error updating timed out jobs:', updateError);
      return new Response('Error updating jobs', { status: 500, headers: corsHeaders });
    }

    // Try to cancel any associated Replicate predictions
    const replicateToken = Deno.env.get('REPLICATE_API_TOKEN');
    if (replicateToken) {
      for (const job of timedOutJobs) {
        if (job.prediction_id) {
          try {
            const cancelResponse = await fetch(`https://api.replicate.com/v1/predictions/${job.prediction_id}/cancel`, {
              method: 'POST',
              headers: {
                'Authorization': `Token ${replicateToken}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (cancelResponse.ok) {
              console.log('Cancelled Replicate prediction:', job.prediction_id);
            } else {
              console.warn('Failed to cancel Replicate prediction:', job.prediction_id);
            }
          } catch (error) {
            console.warn('Error cancelling Replicate prediction:', job.prediction_id, error);
          }
        }
      }
    }

    console.log(`Successfully cleaned up ${timedOutJobs.length} timed out jobs`);

    return new Response(JSON.stringify({ 
      message: 'Cleanup completed', 
      cleaned: timedOutJobs.length,
      jobs: timedOutJobs.map(job => ({ id: job.id, image_path: job.image_path }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Cleanup function error:', error);
    return new Response('Internal server error', { status: 500, headers: corsHeaders });
  }
});