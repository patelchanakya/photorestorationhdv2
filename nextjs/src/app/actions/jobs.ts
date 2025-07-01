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
        
        // This will be cached with tags for precise invalidation
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
        
        // First verify ownership and get file paths
        const { data: image, error: fetchError } = await supabase
            .from('saved_images')
            .select('id, user_id, original_url, edited_url')
            .eq('id', imageId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !image) {
            throw new Error('Image not found or access denied');
        }

        // Extract file paths from URLs
        const originalFilePath = image.original_url ? extractFilePathFromUrl(image.original_url) : null;
        const editedFilePath = image.edited_url ? extractFilePathFromUrl(image.edited_url) : null;

        // Delete the image record first
        const { error: deleteError } = await supabase
            .from('saved_images')
            .delete()
            .eq('id', imageId)
            .eq('user_id', userId);

        if (deleteError) {
            console.error('Error deleting saved image:', deleteError);
            throw deleteError;
        }

        // Delete the actual image files from storage
        const deletionPromises = [];

        // Delete original file from 'files' bucket
        if (originalFilePath) {
            deletionPromises.push(
                supabase.storage
                    .from('files')
                    .remove([originalFilePath])
                    .then(({ error }) => {
                        if (error) {
                            console.error('Error deleting original file:', error);
                        }
                    })
            );
        }

        // Delete restored file from 'restored-images' bucket
        if (editedFilePath) {
            deletionPromises.push(
                supabase.storage
                    .from('restored-images')
                    .remove([editedFilePath])
                    .then(({ error }) => {
                        if (error) {
                            console.error('Error deleting restored file:', error);
                        }
                    })
            );
        }

        // Execute all deletions in parallel
        await Promise.all(deletionPromises);
        
    } catch (error) {
        console.error('Server action error:', error);
        throw new Error('Failed to delete saved image');
    }
}

// Helper function to extract file path from Supabase storage URL
function extractFilePathFromUrl(url: string): string | null {
    try {
        // Supabase storage URLs typically follow format:
        // https://[project].supabase.co/storage/v1/object/public/[bucket]/[filepath]
        // or signed URLs with additional parameters
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        
        // Find the bucket name and extract everything after it
        const publicIndex = pathParts.findIndex(part => part === 'public');
        if (publicIndex !== -1 && publicIndex < pathParts.length - 2) {
            // Skip 'public' and bucket name, join the rest
            return pathParts.slice(publicIndex + 2).join('/');
        }
        
        // Fallback: try to extract from object/public pattern
        const objectIndex = pathParts.findIndex(part => part === 'object');
        if (objectIndex !== -1 && objectIndex < pathParts.length - 3) {
            // Skip 'object', 'public', and bucket name
            return pathParts.slice(objectIndex + 3).join('/');
        }
        
        return null;
    } catch (error) {
        console.error('Error extracting file path from URL:', error);
        return null;
    }
}