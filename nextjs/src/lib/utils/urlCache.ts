// Shared URL caching utility for image URLs across the app
import { createSPASassClient } from '@/lib/supabase/client';
import { apiCache, createCacheKey } from '@/lib/utils/cache';

/**
 * Generate cached signed URL for image with fallback
 * @param userId - User ID for path construction
 * @param imageUrl - Full image URL or filename
 * @param bucket - Supabase storage bucket name
 * @param expiresIn - URL expiration time in seconds (default: 6 hours)
 * @returns Cached signed URL or null if failed
 */
export async function generateCachedImageUrl(
    userId: string, 
    imageUrl: string, 
    bucket: string = 'restored-images',
    expiresIn: number = 21600 // 6 hours
): Promise<string | null> {
    if (!userId || !imageUrl) return null;
    
    try {
        // Cache URLs for 15 minutes to reduce API calls
        const cacheKey = createCacheKey('image-url', bucket, userId, imageUrl);
        return await apiCache.get(cacheKey, async () => {
            const supabase = await createSPASassClient();
            
            
            if (bucket === 'restored-images') {
                // For restored images, extract just the file path from full URL if needed
                let filePath = imageUrl;
                if (imageUrl.startsWith('http')) {
                    // Extract path portion from full URL
                    // e.g., "https://domain.supabase.co/storage/v1/object/public/restored-images/user123/file.png"
                    // becomes "user123/file.png"
                    const urlParts = imageUrl.split('/restored-images/');
                    filePath = urlParts.length > 1 ? urlParts[1] : imageUrl;
                }
                const { data, error } = await supabase.shareRestoredImage(filePath, expiresIn);
                if (error) {
                    throw error;
                }
                return data.signedUrl;
            } else {
                // For other buckets, extract filename from imageUrl if needed
                const filename = imageUrl.includes('/') ? imageUrl.split('/').pop() || imageUrl : imageUrl;
                const { data, error } = await supabase.shareFile(userId, filename, expiresIn, false, bucket);
                if (error) {
                    throw error;
                }
                return data.signedUrl;
            }
        }, 900000); // 15 minute cache
    } catch (err) {
        return null;
    }
}

/**
 * Generate cached thumbnail URL with fallback to main image
 * @param userId - User ID for path construction  
 * @param filename - Image filename
 * @param mainImageUrl - Main image URL as fallback
 * @returns Cached thumbnail URL or fallback
 */
export async function generateCachedThumbnailUrl(
    userId: string,
    filename: string, 
    mainImageUrl: string
): Promise<string> {
    const thumbnailUrl = await generateCachedImageUrl(userId, filename, 'thumbnails');
    return thumbnailUrl || mainImageUrl;
}