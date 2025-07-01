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
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-sm">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-full ${
                            isLowCredits ? 'bg-red-100' : 'bg-orange-100'
                        }`}>
                            <Coins className={`h-6 w-6 ${
                                isLowCredits ? 'text-red-600' : 'text-orange-600'
                            }`} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Credits</p>
                            <div className="flex items-center space-x-2">
                                <AnimatedCounter
                                    value={displayCredits}
                                    className={`text-2xl font-bold ${
                                        isPending ? 'opacity-75' : 'opacity-100'
                                    }`}
                                    isLowCredits={isLowCredits}
                                />
                                {isPending && (
                                    <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse ml-1"></div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {showBuyButton && (
                        onBuyMore ? (
                            <Button 
                                onClick={onBuyMore}
                                size="sm" 
                                className={`${
                                    isLowCredits 
                                        ? 'bg-red-600 hover:bg-red-700' 
                                        : 'bg-orange-600 hover:bg-orange-700'
                                } text-white shadow-md`}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Buy More</span>
                                <span className="sm:hidden">Buy</span>
                            </Button>
                        ) : (
                            <Link href="/app/user-settings">
                                <Button 
                                    size="sm" 
                                    className={`${
                                        isLowCredits 
                                            ? 'bg-red-600 hover:bg-red-700' 
                                            : 'bg-orange-600 hover:bg-orange-700'
                                    } text-white shadow-md`}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">Buy More</span>
                                    <span className="sm:hidden">Buy</span>
                                </Button>
                            </Link>
                        )
                    )}
                </div>
                
            </div>
        </ErrorBoundary>
    );
}