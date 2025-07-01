'use client';

import { useEffect } from 'react';
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
    imageUrl?: string; // Optional cached URL override
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
    onPrevious,
    imageUrl
}: ImageModalProps) {
    
    // Use cached URL if provided, otherwise fallback to original
    const displayUrl = imageUrl || (image.edited_url && image.edited_url.trim() !== '' ? image.edited_url : null);

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
            <DialogContent className="w-[95vw] sm:w-full max-w-sm sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] p-0">
                <DialogTitle className="sr-only">
                    Restored Photo: {image.prompt}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    Photo restoration comparison view. Toggle between original and restored versions of your image.
                </DialogDescription>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex flex-col gap-3 p-3 sm:p-4 border-b bg-background">
                        {/* Title and meta info */}
                        <div className="flex items-start space-x-3 min-w-0 pr-8">
                            <div className="space-y-1 min-w-0 flex-1">
                                <h3 className="font-medium line-clamp-2 break-words text-sm sm:text-base">{image.prompt}</h3>
                                <div className="flex items-center text-xs sm:text-sm text-muted-foreground flex-wrap gap-1">
                                    <Calendar className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">
                                        {image.created_at && formatDistanceToNow(new Date(image.created_at), { addSuffix: true })}
                                    </span>
                                    {image.is_hd && (
                                        <>
                                            <span className="flex-shrink-0">•</span>
                                            <Badge variant="secondary" className="text-xs flex-shrink-0">HD</Badge>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center justify-between gap-2">
                            {/* Left side - Delete button */}
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={onDelete}
                                className="text-destructive hover:text-destructive flex items-center gap-1"
                                title="Delete"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Delete</span>
                            </Button>
                            
                            {/* Right side - Action buttons group */}
                            <div className="flex items-center gap-1 sm:gap-2">
                                {/* Download button */}
                                <Button variant="outline" size="sm" onClick={onDownload} title="Download">
                                    <Download className="h-4 w-4" />
                                </Button>
                                
                                {/* Open in new tab button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => displayUrl && openInNewTab(displayUrl)}
                                    disabled={!displayUrl}
                                    title={displayUrl ? "Open in new tab" : "Image not available"}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                                
                                {/* Share button */}
                                <Button variant="outline" size="sm" onClick={onShare} title="Share">
                                    <Share2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Image Content */}
                    <div className="flex-1 relative bg-muted/30 flex items-center justify-center p-2 sm:p-4">
                        {displayUrl ? (
                            <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] max-w-4xl">
                                <Image
                                    src={displayUrl}
                                    alt={image.prompt}
                                    fill
                                    className="object-contain"
                                    priority
                                    sizes="(max-width: 640px) 95vw, (max-width: 1024px) 90vw, 1024px"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-full h-[40vh] sm:h-[50vh] md:h-[60vh]">
                                <div className="text-center px-4">
                                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📸</div>
                                    <p className="text-base sm:text-lg font-medium text-muted-foreground mb-2">Image Not Available</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                        Image may be too large or temporarily unavailable
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
                                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 h-8 w-8 sm:h-9 sm:w-9"
                                        onClick={onPrevious}
                                    >
                                        <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                )}
                                {currentIndex < images.length - 1 && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 h-8 w-8 sm:h-9 sm:w-9"
                                        onClick={onNext}
                                    >
                                        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                )}
                            </>
                        )}
                        
                        {/* Image type indicator */}
                        {displayUrl && (
                            <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
                                <Badge variant="default" className="text-xs">
                                    Restored
                                </Badge>
                            </div>
                        )}
                        
                        {/* Image counter */}
                        {images.length > 1 && (
                            <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2">
                                <Badge variant="secondary" className="text-xs">
                                    {currentIndex + 1} of {images.length}
                                </Badge>
                            </div>
                        )}
                    </div>
                    
                    {/* Footer */}
                    {image.tags && image.tags.length > 0 && (
                        <div className="p-3 sm:p-4 border-t bg-background">
                            <div className="space-y-2">
                                <p className="text-xs sm:text-sm font-medium">Tags</p>
                                <div className="flex flex-wrap gap-1 sm:gap-2">
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