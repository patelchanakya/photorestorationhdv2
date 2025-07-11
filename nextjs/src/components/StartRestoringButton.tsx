"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useGlobal } from '@/lib/context/GlobalContext';

interface StartRestoringButtonProps {
  variant?: 'hero' | 'cta';
  className?: string;
}

const StartRestoringButton: React.FC<StartRestoringButtonProps> = ({ 
  variant = 'hero', 
  className = '' 
}) => {
  const { user, loading } = useGlobal();

  // Show loading state
  if (loading) {
    return (
      <div className={`inline-flex items-center px-6 py-3 rounded-lg bg-gray-300 text-gray-500 font-medium ${className}`}>
        Loading...
      </div>
    );
  }

  const baseClasses = "inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium transition-colors";
  
  if (user) {
    // Authenticated user - go to dashboard
    const buttonText = variant === 'hero' ? 'Upload Photo' : 'Start Restoring';
    const heroClasses = "bg-primary-600 text-white hover:bg-primary-700 text-sm sm:text-lg shadow";
    const ctaClasses = "bg-white text-primary-600 hover:bg-primary-50";
    
    return (
      <Link
        href="/app/storage"
        className={`${baseClasses} ${variant === 'hero' ? heroClasses : ctaClasses} ${className}`}
      >
        {buttonText}
        {variant === 'cta' && <ArrowRight className="ml-2 h-5 w-5" />}
      </Link>
    );
  } else {
    // Unauthenticated user - scroll to upload demo
    const buttonText = 'Try Now';
    const heroClasses = "bg-primary-600 text-white hover:bg-primary-700 text-sm sm:text-lg shadow";
    const ctaClasses = "bg-white text-primary-600 hover:bg-primary-50";
    
    return (
      <button
        onClick={() => {
          const uploadDemo = document.querySelector('#upload-demo');
          if (uploadDemo) {
            // Add a pulse animation to draw attention
            uploadDemo.classList.add('animate-pulse');
            setTimeout(() => {
              uploadDemo.classList.remove('animate-pulse');
            }, 2000);
            
            // Scroll to the upload demo
            uploadDemo.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Focus the upload area for better UX
            const uploadInput = uploadDemo.querySelector('input[type="file"]') as HTMLInputElement;
            if (uploadInput) {
              setTimeout(() => {
                uploadInput.click();
              }, 500);
            }
          }
        }}
        className={`${baseClasses} ${variant === 'hero' ? heroClasses : ctaClasses} ${className}`}
      >
        {buttonText}
        {variant === 'cta' && <ArrowRight className="ml-2 h-5 w-5" />}
      </button>
    );
  }
};

export default StartRestoringButton;