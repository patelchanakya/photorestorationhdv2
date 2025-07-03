"use client";
import React, { useState, useEffect } from 'react';
import { X, Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PromoBannerProps {
  onCtaClick?: () => void;
  className?: string;
}

export default function PromoBanner({ onCtaClick, className = "" }: PromoBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const STORAGE_KEY = 'family50-banner-dismissed';

  useEffect(() => {
    // Check if banner was previously dismissed
    const isDismissed = localStorage.getItem(STORAGE_KEY);
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleCtaClick = () => {
    if (onCtaClick) {
      onCtaClick();
    } else {
      // Default behavior - scroll to pricing or start restoring
      const element = document.getElementById('pricing');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const copyPromoCode = () => {
    navigator.clipboard.writeText('FAMILY50');
    // Could add toast notification here
  };

  if (!isVisible) return null;

  return (
    <div className={`relative bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white ${className}`}>
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 animate-pulse"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/*
          Use a column layout on mobile to prevent horizontal overflow.
          Switch back to a row layout from the small breakpoint (640 px) upwards.
        */}
        <div className="flex flex-row items-center justify-between gap-2 md:gap-4 py-1 md:py-3">
          {/* Left side - Main message */}
          <div className="flex items-center gap-2 md:gap-3 flex-1 flex-wrap break-words">
            <div className="flex-shrink-0 hidden sm:block">
              <Gift className="h-3 w-3 md:h-6 md:w-6 text-yellow-300" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-row items-center gap-1 md:gap-2">
                <div className="flex items-center space-x-1 md:space-x-2">
                  <Sparkles className="hidden md:block h-4 w-4 text-yellow-300 animate-pulse" />
                  <span className="text-sm md:text-lg font-bold">50% OFF!</span>
                  <Sparkles className="hidden md:block h-4 w-4 text-yellow-300 animate-pulse" />
                </div>
                
                <div className="flex flex-wrap items-center gap-1 md:gap-2">
                  <span className="text-xs md:text-sm text-green-100">Code</span>
                  <button 
                    onClick={copyPromoCode}
                    className="bg-white/20 backdrop-blur-sm px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-mono font-bold tracking-wider hover:bg-white/30 transition-colors border border-white/30"
                  >
                    FAMILY50
                  </button>
                  <span className="hidden sm:inline text-xs md:text-sm text-green-100">at checkout</span>
                  <span className="hidden sm:inline text-xs md:text-sm text-green-100">Valid till July 8</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - CTA and Close */}
          <div className="flex items-center space-x-2 md:space-x-4 md:ml-4 flex-shrink-0">
            <Button
              onClick={handleCtaClick}
              /* Full-width button on very small screens for better tap-target & to prevent overflow */
              className="bg-white text-green-600 hover:bg-green-50 font-semibold px-3 py-1 md:px-6 md:py-2 text-xs md:text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 whitespace-nowrap"
            >
              Claim Discount
            </Button>
            
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white transition-colors p-1"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom glow effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
    </div>
  );
}