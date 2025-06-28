'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { SavedImage } from '@/app/actions/jobs';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Download, 
    Share2, 
    Trash2, 
    Calendar,
    Maximize2,
    ExternalLink,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ImageModalProps {
    image: SavedImage;
    images: SavedImage[];
    currentIndex: number;
    isOpen: boolean;
    onClose: () => void;
    onDownload: () => void;
    onShare: () => void;
    onDelete: () => void;
    onNext: () => void;
    onPrevious: () => void;
}

export function ImageModal({
    image,
    images,
    currentIndex,
    isOpen,
    onClose,
    onDownload,
    onShare,
    onDelete,
    onNext,
    onPrevious
}: ImageModalProps) {
    const [showOriginal, setShowOriginal] = useState(false);
    const [originalExists, setOriginalExists] = useState<boolean | null>(null);
    const [restoredExists, setRestoredExists] = useState<boolean | null>(null);
    
    // Test if images actually exist and can be loaded
    useEffect(() => {
        // Test original image
        if (image.original_url && image.original_url.trim() !== '') {
            const img = new window.Image();
            img.onload = () => setOriginalExists(true);
            img.onerror = () => setOriginalExists(false);
            img.src = image.original_url;
        } else {
            setOriginalExists(false);
        }

        // Test restored image
        if (image.edited_url && image.edited_url.trim() !== '') {
            const img = new window.Image();
            img.onload = () => setRestoredExists(true);
            img.onerror = () => setRestoredExists(false);
            img.src = image.edited_url;
        } else {
            setRestoredExists(false);
        }
    }, [image.original_url, image.edited_url]);
    
    // Check if both original and restored images are actually available
    const hasOriginal = originalExists === true;
    const hasRestored = restoredExists === true;
    const canToggle = hasOriginal && hasRestored;
    
    // Determine which image to display
    const displayUrl = showOriginal && hasOriginal ? image.original_url : 
                      hasRestored ? image.edited_url : 
                      null; // No fallback to broken URLs
    
    // Reset showOriginal when image changes or when original is not available
    useEffect(() => {
        if (!hasOriginal) {
            setShowOriginal(false);
        }
    }, [hasOriginal, image.id]);
    
    // Show loading state while checking image existence
    const isLoading = originalExists === null || restoredExists === null;

    const openInNewTab = (url: string) => {
        window.open(url, '_blank');
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isOpen) return;
            
            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    if (currentIndex > 0) onPrevious();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    if (currentIndex < images.length - 1) onNext();
                    break;
                case 'Escape':
                    event.preventDefault();
                    onClose();
                    break;
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, currentIndex, images.length, onNext, onPrevious, onClose]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-sm sm:max-w-4xl w-full max-h-[90vh] p-0">
                <DialogTitle className="sr-only">
                    {(showOriginal && hasOriginal) ? 'Original Photo' : 'Restored Photo'}: {image.prompt}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    Photo restoration comparison view. Toggle between original and restored versions of your image.
                </DialogDescription>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-background">
                        <div className="flex items-center space-x-3">
                            <div className="space-y-1">
                                <h3 className="font-medium line-clamp-2 sm:line-clamp-3 break-words">{image.prompt}</h3>
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
                        </div>
                        
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            {canToggle && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowOriginal(!showOriginal)}
                                        className="hidden sm:flex"
                                    >
                                        {showOriginal ? 'Show Restored' : 'Show Original'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowOriginal(!showOriginal)}
                                        className="sm:hidden"
                                    >
                                        {showOriginal ? 'Restored' : 'Original'}
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => displayUrl && openInNewTab(displayUrl)}
                                disabled={!displayUrl}
                                title={displayUrl ? "Open in new tab" : "Image not available"}
                            >
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={onDownload} title="Download">
                                <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={onShare} title="Share" className="hidden sm:flex">
                                <Share2 className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={onDelete}
                                className="text-destructive hover:text-destructive"
                                title="Delete"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    
                    {/* Image Content */}
                    <div className="flex-1 relative bg-muted/30 flex items-center justify-center p-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center w-full h-[50vh] sm:h-[60vh]">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                    <p className="text-sm text-muted-foreground">Loading image...</p>
                                </div>
                            </div>
                        ) : displayUrl ? (
                            <div className="relative w-full h-[50vh] sm:h-[60vh] max-w-4xl">
                                <Image
                                    src={displayUrl}
                                    alt={image.prompt}
                                    fill
                                    className="object-contain"
                                    priority
                                    sizes="(max-width: 1024px) 100vw, 1024px"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-full h-[50vh] sm:h-[60vh]">
                                <div className="text-center">
                                    <div className="text-4xl mb-4">📸</div>
                                    <p className="text-lg font-medium text-muted-foreground mb-2">Image Not Available</p>
                                    <p className="text-sm text-muted-foreground">
                                        {!hasOriginal && !hasRestored 
                                            ? "Both original and restored images are unavailable"
                                            : "Image may be too large or temporarily unavailable"
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {/* Navigation buttons */}
                        {images.length > 1 && (
                            <>
                                {currentIndex > 0 && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
                                        onClick={onPrevious}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                )}
                                {currentIndex < images.length - 1 && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                                        onClick={onNext}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                )}
                            </>
                        )}
                        
                        {/* Image type indicator */}
                        {!isLoading && displayUrl && (
                            <div className="absolute top-4 left-4">
                                <Badge variant={(showOriginal && hasOriginal) ? "outline" : "default"}>
                                    {(showOriginal && hasOriginal) ? 'Original' : 'Restored'}
                                </Badge>
                            </div>
                        )}
                        
                        {/* Image counter */}
                        {images.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                                <Badge variant="secondary" className="text-xs">
                                    {currentIndex + 1} of {images.length}
                                </Badge>
                            </div>
                        )}
                    </div>
                    
                    {/* Footer */}
                    {image.tags && image.tags.length > 0 && (
                        <div className="p-4 border-t bg-background">
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Tags</p>
                                <div className="flex flex-wrap gap-2">
                                    {image.tags.map((tag, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}