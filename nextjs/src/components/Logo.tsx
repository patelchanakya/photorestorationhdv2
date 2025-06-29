import React from 'react';
import Link from 'next/link';

interface LogoProps {
  variant?: 'nav' | 'large';
}

const Logo: React.FC<LogoProps> = ({ variant = 'nav' }) => {
  const size = variant === 'large' ? 'w-12 h-12' : 'w-8 h-8';
  const textSize = variant === 'large' ? 'text-3xl' : 'text-xl';
  
  return (
    <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-300">
      {/* Photo/Camera icon */}
      <div className={`${size} bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md`}>
        <svg className={`${variant === 'large' ? 'w-7 h-7' : 'w-5 h-5'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      
      {/* Text */}
      <span className={`${textSize} font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent`}>
        Photo Restoration HD
      </span>
    </Link>
  );
};

export default Logo;