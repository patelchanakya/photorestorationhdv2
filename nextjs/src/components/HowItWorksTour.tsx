"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronRight, HelpCircle } from 'lucide-react';
import {
    useFloating,
    autoUpdate,
    offset,
    flip,
    shift
} from '@floating-ui/react';

// VisuallyHidden component for accessibility
const VisuallyHidden = ({ children }: { children: React.ReactNode }) => (
    <span className="sr-only">{children}</span>
);

interface TourStep {
    target: string;
    title: string;
    content: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
    {
        target: 'upload-area',
        title: '1. Upload Your Photos',
        content: 'Start by uploading your old photos here. You can drag & drop files or click to browse. Upload multiple photos at once!',
        position: 'bottom'
    },
    {
        target: 'photos-section',
        title: '2. Your Photos Appear Here',
        content: 'Once uploaded, your photos will appear in this section. Each photo can be restored individually.',
        position: 'top'
    },
    {
        target: 'first-restore-button',
        title: '3. Click Restore',
        content: 'Click the "Restore" button on any photo to start enhancement. Each restoration costs 1 credit.',
        position: 'left'
    },
    {
        target: 'gallery-link',
        title: '4. View Your Gallery',
        content: 'Once restoration is complete, view all your enhanced photos in the Gallery. Results appear automatically!',
        position: 'bottom'
    }
];

interface HowItWorksTourProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function HowItWorksTour({ isOpen, onClose }: HowItWorksTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    
    const currentTourStep = tourSteps[currentStep];
    
    // Configure Floating UI with step-specific settings
    const getPlacementForStep = (step: TourStep) => {
        // Convert our position strings to Floating UI placements
        switch (step.position) {
            case 'top': return 'top';
            case 'bottom': return 'bottom';
            case 'left': return 'left';
            case 'right': return 'right';
            default: return 'bottom';
        }
    };

    const getOffsetForStep = (step: TourStep) => {
        // Special positioning for specific steps
        if (step.target === 'gallery-link') return 2; // Very close to gallery button
        if (step.target === 'upload-area') return 5; // Close to upload area
        return 10; // Default spacing
    };

    const { refs, floatingStyles } = useFloating({
        placement: getPlacementForStep(currentTourStep),
        open: isOpen,
        middleware: [
            offset(getOffsetForStep(currentTourStep)),
            flip(), // This will automatically flip left to right if no space
            shift({ 
                padding: 12, // Increase padding to keep modal within viewport
                crossAxis: true // Allow shifting on cross axis for better positioning
            })
        ],
        whileElementsMounted: autoUpdate,
    });

    // Function to remove highlighting from an element
    const removeHighlight = useCallback((element: HTMLElement) => {
        element.classList.remove('ring-4', 'ring-orange-300', 'ring-opacity-75', 'animate-pulse');
        element.style.zIndex = '';
        // Reset position if we changed it
        if (element.style.position === 'relative' && element.style.zIndex === '') {
            element.style.position = '';
        }
    }, []);

    // Function to remove all highlights from any element
    const removeAllHighlights = useCallback(() => {
        const highlightedElements = document.querySelectorAll('.ring-4.ring-orange-300');
        highlightedElements.forEach(el => {
            const element = el as HTMLElement;
            removeHighlight(element);
        });
    }, [removeHighlight]);

    // Function to add highlighting to an element
    const highlightElement = useCallback((element: HTMLElement) => {
        // Remove any existing highlights first
        removeAllHighlights();
        
        // Add highlight classes
        element.classList.add('ring-4', 'ring-orange-300', 'ring-opacity-75', 'animate-pulse');
        element.style.position = 'relative';
        element.style.zIndex = '9997'; // Below the dialog backdrop but above everything else
        
        // Force the element to be above any backdrop or overlay
        const originalPosition = element.style.position;
        if (!originalPosition || originalPosition === 'static') {
            element.style.position = 'relative';
        }
    }, [removeAllHighlights]);

    // Simple function to update the reference element for Floating UI
    const updateFloatingReference = useCallback((element: HTMLElement) => {
        refs.setReference(element);
    }, [refs]);

    useEffect(() => {
        if (!isOpen) {
            setCurrentStep(0);
            // Clean up any remaining highlights
            removeAllHighlights();
            return;
        }

        const highlightTarget = () => {
            const step = tourSteps[currentStep];
            const element = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement;
            
            if (element) {
                // Scroll element into view smoothly
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Update Floating UI reference and highlight element
                updateFloatingReference(element);
                highlightElement(element);
            }
        };

        // Small delay to ensure DOM is ready
        const timer = setTimeout(highlightTarget, 100);
        return () => clearTimeout(timer);
    }, [isOpen, currentStep, highlightElement, removeAllHighlights, updateFloatingReference]);

    // Floating UI handles resize and scroll automatically via autoUpdate

    const nextStep = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const skipTour = () => {
        removeAllHighlights();
        onClose();
    };

    // Cleanup effect for when component unmounts
    useEffect(() => {
        return () => {
            removeAllHighlights();
        };
    }, [removeAllHighlights]);

    if (!isOpen) return null;

    return (
        <>
            {/* Tour Tooltip - no backdrop to allow scrolling */}
            <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
                <DialogContent 
                    ref={refs.setFloating}
                    className="z-[9999] p-0 border-0 shadow-2xl w-max max-w-[280px] sm:max-w-[350px] md:max-w-[380px]"
                    style={{
                        ...floatingStyles,
                        // Ensure stable positioning and no animations
                        animation: 'none',
                        transition: 'none',
                        maxHeight: '200px'
                    }}
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <VisuallyHidden>
                        <DialogTitle>How It Works Tour</DialogTitle>
                    </VisuallyHidden>
                    <div className="bg-white rounded-lg shadow-xl border">
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 sm:p-4 border-b">
                            <div className="flex items-center space-x-2">
                                <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight">
                                    {currentTourStep.title}
                                </h3>
                            </div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-3 sm:p-4">
                            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                                {currentTourStep.content}
                            </p>
                        </div>
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between p-3 sm:p-4 border-t bg-gray-50 rounded-b-lg">
                            <div className="flex space-x-1">
                                {tourSteps.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                                            index === currentStep ? 'bg-orange-600' : 'bg-gray-300'
                                        }`}
                                    />
                                ))}
                            </div>
                            
                            <div className="flex space-x-2">
                                <button
                                    onClick={skipTour}
                                    className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    Skip Tour
                                </button>
                                <button
                                    onClick={nextStep}
                                    className="px-3 sm:px-4 py-1 sm:py-1.5 bg-orange-600 text-white text-xs sm:text-sm rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-1"
                                >
                                    <span>{currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}</span>
                                    {currentStep < tourSteps.length - 1 && <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}