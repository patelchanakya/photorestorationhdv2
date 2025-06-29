"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronRight, HelpCircle } from 'lucide-react';

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
    const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
    const [modalPosition, setModalPosition] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });

    // Function to add highlighting to an element
    const highlightElement = (element: HTMLElement) => {
        // Remove any existing highlights first
        removeAllHighlights();
        
        // Add highlight classes
        element.classList.add('ring-4', 'ring-orange-300', 'ring-opacity-75', 'animate-pulse');
        element.style.position = 'relative';
        element.style.zIndex = '999'; // High z-index to appear above everything
        
        // Force the element to be above any backdrop or overlay
        const originalPosition = element.style.position;
        if (!originalPosition || originalPosition === 'static') {
            element.style.position = 'relative';
        }
    };

    // Function to remove highlighting from an element
    const removeHighlight = (element: HTMLElement) => {
        element.classList.remove('ring-4', 'ring-orange-300', 'ring-opacity-75', 'animate-pulse');
        element.style.zIndex = '';
        // Reset position if we changed it
        if (element.style.position === 'relative' && element.style.zIndex === '') {
            element.style.position = '';
        }
    };

    // Function to remove all highlights from any element
    const removeAllHighlights = () => {
        const highlightedElements = document.querySelectorAll('.ring-4.ring-orange-300');
        highlightedElements.forEach(el => {
            const element = el as HTMLElement;
            removeHighlight(element);
        });
    };

    const calculateResponsivePosition = (element: HTMLElement, position: string) => {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Dynamic modal width based on screen size
        const modalWidth = Math.min(screenWidth - 40, screenWidth < 480 ? screenWidth - 32 : 380);
        const margin = Math.max(16, screenWidth * 0.04);
        
        // Get element bounds
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + window.scrollY;
        const elementLeft = rect.left + window.scrollX;
        
        let top = '50%';
        let left = '50%';
        let transform = 'translate(-50%, -50%)';
        
        // For very small screens, always center
        if (screenWidth < 480) {
            return { top, left, transform };
        }
        
        // Calculate position based on preferred position and available space
        if (position === 'bottom') {
            const spaceBelow = screenHeight - rect.bottom;
            const spaceAbove = rect.top;
            
            if (spaceBelow >= 250 || spaceBelow > spaceAbove) {
                // Position below - ensure enough gap to see the highlighted element
                top = `${Math.min(elementTop + rect.height + 30, screenHeight - 280)}px`;
            } else {
                // Position above - ensure enough gap to see the highlighted element
                top = `${Math.max(elementTop - 250, 20)}px`;
            }
        } else if (position === 'left') {
            // Position to the left of the element
            top = `${Math.max(20, Math.min(elementTop - 50, screenHeight - 280))}px`;
            // Adjust horizontal positioning for left placement
            const spaceLeft = rect.left;
            if (spaceLeft >= modalWidth + 20) {
                // Position to the left with gap
                left = `${Math.max(margin, rect.left - modalWidth - 20)}px`;
            } else {
                // Not enough space on left, position to the right
                left = `${Math.min(rect.right + 20, screenWidth - modalWidth - margin)}px`;
            }
            transform = 'none';
            return { top, left, transform };
        } else {
            // Position above
            const spaceAbove = rect.top;
            const spaceBelow = screenHeight - rect.bottom;
            
            if (spaceAbove >= 250 || spaceAbove > spaceBelow) {
                // Position above - ensure enough gap to see the highlighted element
                top = `${Math.max(elementTop - 250, 20)}px`;
            } else {
                // Position below - ensure enough gap to see the highlighted element
                top = `${Math.min(elementTop + rect.height + 30, screenHeight - 280)}px`;
            }
        }
        
        // Horizontal positioning
        const idealLeft = elementLeft + (rect.width / 2) - (modalWidth / 2);
        left = `${Math.max(margin, Math.min(idealLeft, screenWidth - modalWidth - margin))}px`;
        transform = 'none';
        
        return { top, left, transform };
    };

    useEffect(() => {
        if (!isOpen) {
            setCurrentStep(0);
            setHighlightedElement(null);
            setModalPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
            // Clean up any remaining highlights
            removeAllHighlights();
            return;
        }

        const highlightTarget = () => {
            const step = tourSteps[currentStep];
            const element = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement;
            
            if (element) {
                setHighlightedElement(element);
                
                // Add visual highlighting
                highlightElement(element);
                
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Calculate responsive position
                const position = calculateResponsivePosition(element, step.position);
                setModalPosition(position);
            } else {
                // If element not found, center the modal
                setModalPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
            }
        };

        // Delay to ensure DOM is ready and scroll has completed
        const timer = setTimeout(highlightTarget, 100);
        return () => clearTimeout(timer);
    }, [isOpen, currentStep]);

    // Recalculate position on window resize
    useEffect(() => {
        const handleResize = () => {
            if (highlightedElement && isOpen) {
                const step = tourSteps[currentStep];
                const position = calculateResponsivePosition(highlightedElement, step.position);
                setModalPosition(position);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [highlightedElement, isOpen, currentStep]);

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
    }, []);

    const currentTourStep = tourSteps[currentStep];
    
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop Overlay - barely visible */}
            <div className="fixed inset-0 bg-black bg-opacity-5 z-30" />

            {/* Tour Tooltip */}
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent 
                    className="fixed z-[9999] p-0 border-0 shadow-2xl w-[calc(100vw-2rem)] max-w-xs sm:max-w-sm md:max-w-md lg:max-w-sm"
                    style={{
                        ...modalPosition,
                        // CSS isolation to prevent inheriting animations
                        animation: 'none',
                        willChange: 'auto',
                        isolation: 'isolate',
                        contain: 'layout style paint'
                    }}
                >
                    <VisuallyHidden>
                        <DialogTitle>How It Works Tour</DialogTitle>
                    </VisuallyHidden>
                    <div 
                        className="bg-white rounded-lg shadow-xl border"
                        style={{
                            // Additional isolation for the content
                            animation: 'none !important',
                            transform: 'none'
                        }}
                    >
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