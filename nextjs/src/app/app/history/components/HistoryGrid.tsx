'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { SavedImage, deleteSavedImage } from '@/app/actions/jobs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { HistoryHeader } from './HistoryHeader';
import { ImageModal } from './ImageModal';
import { 
    Download, 
    Share2, 
    Trash2, 
    MoreVertical, 
    Calendar,
    Sparkles,
    Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useGlobal } from '@/lib/context/GlobalContext';
import { useCachedImages } from '@/hooks/useCachedImages';

interface HistoryGridProps {
    images: SavedImage[];
}

export function HistoryGrid({ images }: HistoryGridProps) {
    const { user } = useGlobal();
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedImage, setSelectedImage] = useState<SavedImage | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
    const [imageToDelete, setImageToDelete] = useState<SavedImage | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentImages, setCurrentImages] = useState(images);
    
    // Use cached images hook for optimized loading
    const { getCachedUrl, isLoading: urlsLoading } = useCachedImages(currentImages, user?.id);

    // Update local images when prop changes
    useEffect(() => {
        setCurrentImages(images);
    }, [images]);

    // Helper function to check if URL is valid for Next.js Image
    const isValidImageUrl = (url: string): boolean => {
        // Skip test URLs that don't have proper protocol
        if (url.startsWith('test-') || url.includes('test-bulk')) {
            return false;
        }
        // Must be absolute URL or start with /
        return url.startsWith('http') || url.startsWith('/');
    };

    // Sort and filter images
    const sortedImages = useMemo(() => {
        // Filter out test images with invalid URLs that would break Next.js Image
        const validImages = currentImages.filter(image => 
            isValidImageUrl(image.edited_url) && 
            (!image.thumbnail_url || isValidImageUrl(image.thumbnail_url))
        );

        const sorted = [...validImages].sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                case 'oldest':
                    return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
                default:
                    return 0;
            }
        });

        return sorted;
    }, [currentImages, sortBy]);

    const handleImageSelect = (image: SavedImage) => {
        const index = sortedImages.findIndex(img => img.id === image.id);
        setSelectedImage(image);
        setSelectedImageIndex(index);
    };

    const handleNext = () => {
        if (selectedImageIndex < sortedImages.length - 1) {
            const nextIndex = selectedImageIndex + 1;
            setSelectedImageIndex(nextIndex);
            setSelectedImage(sortedImages[nextIndex]);
        }
    };

    const handlePrevious = () => {
        if (selectedImageIndex > 0) {
            const prevIndex = selectedImageIndex - 1;
            setSelectedImageIndex(prevIndex);
            setSelectedImage(sortedImages[prevIndex]);
        }
    };

    const handleDownload = async (image: SavedImage) => {
        try {
            const response = await fetch(image.edited_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `restored-${image.id}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const handleShare = async (image: SavedImage) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Restored Photo',
                    text: image.prompt,
                    url: image.edited_url,
                });
            } catch (error) {
                // Don't log error if user simply canceled the share dialog
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Share failed:', error);
                }
            }
        } else {
            // Fallback to copying URL
            await navigator.clipboard.writeText(image.edited_url);
        }
    };

    const handleDelete = (image: SavedImage) => {
        setImageToDelete(image);
    };

    const confirmDelete = async () => {
        if (!imageToDelete || !user?.id) return;
        
        setIsDeleting(true);
        try {
            await deleteSavedImage(imageToDelete.id, user.id);
            // Remove from local state
            setCurrentImages(prev => prev.filter(img => img.id !== imageToDelete.id));
            setImageToDelete(null);
            setSelectedImage(null);
        } catch (error) {
            console.error('Failed to delete image:', error);
            // TODO: Show error toast
        } finally {
            setIsDeleting(false);
        }
    };

    if (sortedImages.length === 0) {
        return (
            <div className="space-y-6">
                <HistoryHeader
                    totalImages={currentImages.length}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">No restored photos yet</h3>
                            <p className="text-muted-foreground">
                                Upload and restore your first photo to get started
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <HistoryHeader
                totalImages={currentImages.length}
                sortBy={sortBy}
                onSortChange={setSortBy}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />
            
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sortedImages.map((image, index) => (
                        <Card key={image.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                            <CardContent className="p-0">
                                <div className="relative aspect-square">
                                    <Image
                                        src={getCachedUrl(image.id, 'thumbnail')}
                                        alt={image.prompt}
                                        fill
                                        priority={index < 4} // Priority for first 4 images (first row)
                                        className="object-cover cursor-pointer transition-transform group-hover:scale-105"
                                        onClick={() => handleImageSelect(image)}
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                    />
                                    
                                    {/* Overlay with actions */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none">
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="sm" variant="secondary">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleDownload(image)}>
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Download
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleShare(image)}>
                                                        <Share2 className="h-4 w-4 mr-2" />
                                                        Share
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleDelete(image)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                    
                                    {/* HD Badge */}
                                    {image.is_hd && (
                                        <div className="absolute top-2 left-2">
                                            <Badge variant="secondary" className="text-xs">
                                                HD
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="p-4 space-y-2">
                                    <p className="text-sm font-medium line-clamp-2">{image.prompt}</p>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {image.created_at && formatDistanceToNow(new Date(image.created_at), { addSuffix: true })}
                                    </div>
                                    {image.tags && image.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {image.tags.slice(0, 2).map((tag, index) => (
                                                <Badge key={index} variant="outline" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                            {image.tags.length > 2 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{image.tags.length - 2}
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                // List view implementation
                <div className="space-y-2">
                    {sortedImages.map((image) => (
                        <Card key={image.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-4">
                                    <div className="relative w-16 h-16 flex-shrink-0">
                                        <Image
                                            src={getCachedUrl(image.id, 'thumbnail')}
                                            alt={image.prompt}
                                            fill
                                            className="object-cover rounded cursor-pointer"
                                            onClick={() => handleImageSelect(image)}
                                            sizes="64px"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{image.prompt}</p>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {image.created_at && formatDistanceToNow(new Date(image.created_at), { addSuffix: true })}
                                            {image.is_hd && (
                                                <>
                                                    <span className="mx-2">•</span>
                                                    <Badge variant="secondary" className="text-xs">HD</Badge>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => handleDownload(image)}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => handleShare(image)}
                                        >
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="sm" variant="outline">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem 
                                                    onClick={() => handleDelete(image)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            
            {selectedImage && (
                <ImageModal
                    image={selectedImage}
                    images={sortedImages}
                    currentIndex={selectedImageIndex}
                    isOpen={true}
                    onClose={() => setSelectedImage(null)}
                    onDownload={() => handleDownload(selectedImage)}
                    onShare={() => handleShare(selectedImage)}
                    onDelete={() => handleDelete(selectedImage)}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    imageUrl={getCachedUrl(selectedImage.id, 'edited')}
                />
            )}
            
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!imageToDelete} onOpenChange={(open) => !open && setImageToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Photo</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this restored photo? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}