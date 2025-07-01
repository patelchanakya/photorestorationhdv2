import { useState, useEffect } from 'react';
import { SavedImage } from '@/app/actions/jobs';
import { generateCachedImageUrl, generateCachedThumbnailUrl } from '@/lib/utils/urlCache';

interface CachedImageUrls {
    [imageId: string]: {
        editedUrl?: string;
        thumbnailUrl?: string;
    };
}

/**
 * Hook to generate cached URLs for gallery images
 * Provides the same caching optimization as storage page
 */
export function useCachedImages(images: SavedImage[], userId: string | undefined) {
    const [cachedUrls, setCachedUrls] = useState<CachedImageUrls>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!userId || images.length === 0) return;

        const generateUrls = async () => {
            setIsLoading(true);
            const newCachedUrls: CachedImageUrls = {};

            // Process images in parallel for better performance
            await Promise.all(images.map(async (image) => {
                try {
                    // Generate cached URLs with same logic as storage page
                    const [cachedEditedUrl, cachedThumbnailUrl] = await Promise.all([
                        // Use original edited_url as filename for restored-images bucket
                        generateCachedImageUrl(userId, image.edited_url, 'restored-images'),
                        // Generate thumbnail URL if available
                        image.thumbnail_url ? 
                            generateCachedThumbnailUrl(userId, image.thumbnail_url, image.edited_url) : 
                            null
                    ]);

                    newCachedUrls[image.id] = {
                        editedUrl: cachedEditedUrl || image.edited_url,
                        thumbnailUrl: cachedThumbnailUrl || image.thumbnail_url || image.edited_url
                    };
                } catch (err) {
                    // Silent fallback - use original URLs
                    newCachedUrls[image.id] = {
                        editedUrl: image.edited_url,
                        thumbnailUrl: image.thumbnail_url || image.edited_url
                    };
                }
            }));

            setCachedUrls(newCachedUrls);
            setIsLoading(false);
        };

        generateUrls();
    }, [images, userId]);

    // Helper function to get cached URL for an image
    const getCachedUrl = (imageId: string, type: 'edited' | 'thumbnail' = 'edited'): string => {
        const cached = cachedUrls[imageId];
        if (!cached) {
            // Fallback to original image while loading
            const image = images.find(img => img.id === imageId);
            const fallbackUrl = type === 'thumbnail' ? 
                (image?.thumbnail_url || image?.edited_url || '') : 
                (image?.edited_url || '');
            return fallbackUrl;
        }
        
        const finalUrl = type === 'thumbnail' ? 
            (cached.thumbnailUrl || cached.editedUrl || '') : 
            (cached.editedUrl || '');
        return finalUrl;
    };

    return {
        getCachedUrl,
        isLoading,
        hasCache: Object.keys(cachedUrls).length > 0
    };
}