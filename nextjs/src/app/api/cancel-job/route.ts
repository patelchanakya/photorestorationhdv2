import { NextRequest, NextResponse } from 'next/server';
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient';

export async function POST(request: NextRequest) {
    try {
        const { job_id, user_id } = await request.json();

        if (!job_id || !user_id) {
            return NextResponse.json(
                { error: 'Missing required fields: job_id, user_id' },
                { status: 400 }
            );
        }

        const adminClient = await createServerAdminClient();
        
        // Verify the job belongs to the user and is cancellable
        const { data: job, error: fetchError } = await adminClient
            .from('processing_jobs')
            .select('*')
            .eq('id', job_id)
            .eq('user_id', user_id)
            .single();

        if (fetchError || !job) {
            return NextResponse.json(
                { error: 'Job not found or access denied' },
                { status: 404 }
            );
        }

        if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
            return NextResponse.json(
                { error: 'Job cannot be cancelled' },
                { status: 400 }
            );
        }

        // Update job status to cancelled
        const { error: updateError } = await adminClient
            .from('processing_jobs')
            .update({
                status: 'cancelled',
                error_message: 'Cancelled by user',
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', job_id);

        if (updateError) {
            console.error('Error cancelling job:', updateError);
            return NextResponse.json(
                { error: 'Failed to cancel job' },
                { status: 500 }
            );
        }

        // Try to cancel the Replicate prediction if it exists
        if (job.prediction_id) {
            try {
                const replicateToken = process.env.REPLICATE_API_TOKEN;
                if (replicateToken) {
                    const cancelResponse = await fetch(`https://api.replicate.com/v1/predictions/${job.prediction_id}/cancel`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Token ${replicateToken}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    
                    if (cancelResponse.ok) {
                        console.log('Successfully cancelled Replicate prediction:', job.prediction_id);
                    } else {
                        console.warn('Failed to cancel Replicate prediction:', job.prediction_id);
                    }
                }
            } catch (error) {
                console.warn('Error cancelling Replicate prediction:', error);
                // Don't fail the whole operation if Replicate cancellation fails
            }
        }

        return NextResponse.json({ 
            success: true,
            message: 'Job cancelled successfully' 
        });

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}