"use client";
import React, { useState, useEffect, useRef } from 'react';
import { X, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DiscountModal from '@/components/DiscountModal';

interface PromoBannerProps {
  onCtaClick?: () => void;
  className?: string;
}

export default function PromoBanner({ onCtaClick, className = "" }: PromoBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isPoofing, setIsPoofing] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, color: string, delay: number}>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
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

  const createParticleBurst = () => {
    if (!buttonRef.current) return;
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const centerX = buttonRect.left + buttonRect.width / 2;
    const centerY = buttonRect.top + buttonRect.height / 2;
    
    const colors = ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e'];
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: centerX + (Math.random() - 0.5) * 100,
      y: centerY + (Math.random() - 0.5) * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: i * 50
    }));
    
    setParticles(newParticles);
    
    // Clear particles after animation
    setTimeout(() => setParticles([]), 1200);
  };

  const handleCtaClick = () => {
    if (onCtaClick) {
      onCtaClick();
    } else {
      // Trigger poof animation
      setIsPoofing(true);
      createParticleBurst();
      
      // Show modal after poof animation
      setTimeout(() => {
        setShowModal(true);
      }, 400);
    }
  };

  const copyPromoCode = () => {
    navigator.clipboard.writeText('FAMILY50');
    // Could add toast notification here
  };

  if (!isVisible) return null;

  return (
    <div className={`relative bg-orange-500 text-white shadow-sm ${className}`}>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/*
          Use a column layout on mobile to prevent horizontal overflow.
          Switch back to a row layout from the small breakpoint (640 px) upwards.
        */}
        <div className="flex flex-row items-center justify-between gap-1 md:gap-2 py-1 md:py-2">
          {/* Left side - Main message */}
          <div className="flex items-center gap-1 md:gap-2 flex-1 flex-wrap break-words">
            <div className="flex-shrink-0 hidden sm:block">
              <Gift className="h-3 w-3 md:h-4 md:w-4 text-orange-200" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-row items-center gap-1 md:gap-2">
                <div className="flex items-center space-x-1 md:space-x-1">
                  <span className="text-sm md:text-base font-bold">50% OFF!</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-1 md:gap-1">
                  <span className="text-xs md:text-xs text-orange-100">Code</span>
                  <button 
                    onClick={copyPromoCode}
                    className="bg-white text-orange-600 px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full text-xs md:text-xs font-mono font-bold tracking-wider hover:bg-orange-50 transition-colors shadow-sm"
                  >
                    FAMILY50
                  </button>
                  <span className="hidden sm:inline text-xs md:text-xs text-orange-100">at checkout</span>
                  <span className="hidden sm:inline text-xs md:text-xs text-orange-100">Valid till July 8</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - CTA and Close */}
          <div className="flex items-center space-x-1 md:space-x-2 md:ml-2 flex-shrink-0">
            <Button
              ref={buttonRef}
              onClick={handleCtaClick}
              className={`bg-white text-orange-600 hover:bg-orange-50 font-semibold px-2 py-0.5 md:px-3 md:py-1 text-xs md:text-sm shadow-sm hover:shadow-md transition-all duration-200 whitespace-nowrap ${
                isPoofing ? 'poof-animation' : ''
              }`}
              disabled={isPoofing}
            >
              Claim Discount
            </Button>
            
            <button
              onClick={handleDismiss}
              className="text-orange-200 hover:text-white transition-colors p-0.5"
              aria-label="Dismiss banner"
            >
              <X className="h-3 w-3 md:h-4 md:w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Particle Burst Effect */}
      {particles.length > 0 && (
        <div className="particle-burst">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="particle"
              style={{
                left: particle.x,
                top: particle.y,
                backgroundColor: particle.color,
                animationDelay: `${particle.delay}ms`,
              }}
            />
          ))}
        </div>
      )}

      {/* Discount Modal */}
      <DiscountModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}