"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Coins, Plus } from 'lucide-react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ErrorBoundary from '@/components/ErrorBoundary';

interface ProminentCreditsDisplayProps {
    onBuyMore?: () => void;
    showBuyButton?: boolean;
}

// Animated counter component for smooth number transitions
function AnimatedCounter({ value, className, isLowCredits }: { 
    value: number; 
    className?: string; 
    isLowCredits: boolean;
}) {
    const [displayValue, setDisplayValue] = useState(value);
    const [isAnimating, setIsAnimating] = useState(false);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        if (displayValue !== value) {
            setIsAnimating(true);
            const start = displayValue;
            const end = value;
            const startTime = Date.now();
            const duration = 300; // 300ms animation

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease-out animation
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const currentValue = Math.round(start + (end - start) * easeProgress);
                
                setDisplayValue(currentValue);

                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(animate);
                } else {
                    setIsAnimating(false);
                }
            };

            animationRef.current = requestAnimationFrame(animate);
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [value, displayValue]);

    return (
        <span 
            className={`${className} transition-all duration-200 ${
                isAnimating ? 'scale-110' : 'scale-100'
            }`}
            style={{
                color: isLowCredits ? '#dc2626' : '#111827'
            }}
        >
            {displayValue}
        </span>
    );
}

export default function ProminentCreditsDisplay({ 
    onBuyMore, 
    showBuyButton = true 
}: ProminentCreditsDisplayProps = {}) {
    const { credits, optimisticCredits, isPending } = useGlobal();
    
    // Improved display logic to prevent flicker
    const displayCredits = React.useMemo(() => {
        // During pending state, prefer optimistic credits for smooth UX
        if (isPending && optimisticCredits !== null) {
            return optimisticCredits;
        }
        // Otherwise use optimistic credits if available, falling back to actual credits
        return optimisticCredits ?? credits ?? 0;
    }, [optimisticCredits, credits, isPending]);
    
    const isLowCredits = displayCredits <= 5;
    
    return (
        <ErrorBoundary>
            <div className={`bg-white border rounded-lg p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md max-w-sm ${
                displayCredits === 0 
                    ? 'border-red-200' 
                    : isLowCredits 
                    ? 'border-amber-200'
                    : 'border-orange-200'
            }`}>
                <div className="space-y-4">
                    {/* Credit Display */}
                    <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            displayCredits === 0 
                                ? 'bg-red-50' 
                                : isLowCredits 
                                ? 'bg-amber-50' 
                                : 'bg-orange-50'
                        }`}>
                            <Coins className={`w-5 h-5 ${
                                displayCredits === 0 
                                    ? 'text-red-600' 
                                    : isLowCredits 
                                    ? 'text-amber-600' 
                                    : 'text-orange-600'
                            }`} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-baseline space-x-2">
                                <AnimatedCounter
                                    value={displayCredits}
                                    className={`text-2xl font-bold ${
                                        displayCredits === 0 
                                            ? 'text-red-700' 
                                            : isLowCredits 
                                            ? 'text-amber-700' 
                                            : 'text-orange-700'
                                    } ${isPending ? 'opacity-75' : 'opacity-100'}`}
                                    isLowCredits={isLowCredits}
                                />
                                <span className={`text-sm font-medium ${
                                    displayCredits === 0 
                                        ? 'text-red-600' 
                                        : isLowCredits 
                                        ? 'text-amber-600' 
                                        : 'text-orange-600'
                                }`}>
                                    credit{displayCredits !== 1 ? 's' : ''}
                                </span>
                                {isPending && (
                                    <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse ml-1"></div>
                                )}
                            </div>
                            <p className={`text-xs mt-1 ${
                                displayCredits === 0 
                                    ? 'text-red-500' 
                                    : isLowCredits 
                                    ? 'text-amber-500' 
                                    : 'text-orange-500'
                            }`}>
                                {displayCredits === 0 
                                    ? 'Get credits to start restoring' 
                                    : isLowCredits 
                                    ? 'Running low on credits' 
                                    : 'Ready to restore photos'
                                }
                            </p>
                        </div>
                    </div>
                    
                    {/* Action Button */}
                    {showBuyButton && (
                        <div className="pt-1">
                            {onBuyMore ? (
                                <Button
                                    onClick={onBuyMore}
                                    size="sm"
                                    className={`w-full ${
                                        displayCredits === 0
                                            ? 'bg-red-600 hover:bg-red-700 text-white'
                                            : isLowCredits
                                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                            : 'bg-orange-600 hover:bg-orange-700 text-white'
                                    }`}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    {displayCredits === 0 ? 'Get Credits' : 'Add More'}
                                </Button>
                            ) : (
                                <Link href="/app/user-settings" className="block">
                                    <Button 
                                        size="sm" 
                                        className={`w-full ${
                                            displayCredits === 0
                                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                                : isLowCredits
                                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                                : 'bg-orange-600 hover:bg-orange-700 text-white'
                                        }`}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        {displayCredits === 0 ? 'Get Credits' : 'Add More'}
                                    </Button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
}