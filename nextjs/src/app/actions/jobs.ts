'use server'

import { createSSRClient } from '@/lib/supabase/server';

export interface ProcessingJob {
    id: string;
    image_path?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    result_url?: string;
    error_message?: string;
    created_at: string;
    completed_at?: string;
}

export async function getProcessingJobs(userId: string): Promise<ProcessingJob[]> {
    try {
        if (!userId) {
            throw new Error('User ID is required');
        }

        const supabase = await createSSRClient();
        
        const { data, error } = await supabase
            .from('processing_jobs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching processing jobs:', error);
            throw error;
        }

        return (data ?? []) as ProcessingJob[];
    } catch (error) {
        console.error('Server action error:', error);
        throw new Error('Failed to fetch processing jobs');
    }
}

export interface SavedImage {
    id: string;
    gallery_id?: string;
    user_id: string;
    original_url: string;
    edited_url: string;
    prompt: string;
    tags?: string[];
    is_hd?: boolean;
    created_at?: string;
    thumbnail_url?: string;
    prediction_id?: string;
}

export async function getSavedImages(userId: string): Promise<SavedImage[]> {
    try {
        if (!userId) {
            throw new Error('User ID is required');
        }

        const supabase = await createSSRClient();
        
        const { data, error } = await supabase
            .from('saved_images')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching saved images:', error);
            throw error;
        }

        return (data ?? []) as SavedImage[];
    } catch (error) {
        console.error('Server action error:', error);
        throw new Error('Failed to fetch saved images');
    }
}

export async function deleteSavedImage(imageId: string, userId: string): Promise<void> {
    try {
        if (!imageId || !userId) {
            throw new Error('Image ID and User ID are required');
        }

        const supabase = await createSSRClient();
        
        // First verify ownership
        const { data: image, error: fetchError } = await supabase
            .from('saved_images')
            .select('id, user_id')
            .eq('id', imageId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !image) {
            throw new Error('Image not found or access denied');
        }

        // Delete the image record
        const { error: deleteError } = await supabase
            .from('saved_images')
            .delete()
            .eq('id', imageId)
            .eq('user_id', userId);

        if (deleteError) {
            console.error('Error deleting saved image:', deleteError);
            throw deleteError;
        }

        // TODO: Also delete the actual image files from storage if needed
        
    } catch (error) {
        console.error('Server action error:', error);
        throw new Error('Failed to delete saved image');
    }
}