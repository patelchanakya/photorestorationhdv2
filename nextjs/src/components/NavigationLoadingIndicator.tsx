"use client";

import { useLinkStatus } from 'next/link';

export default function NavigationLoadingIndicator() {
    const { pending } = useLinkStatus();
    
    if (!pending) return null;

    return (
        <div 
            role="status" 
            aria-label="Navigation loading" 
            className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-orange-200 to-orange-300"
        >
            <div 
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg"
                style={{
                    width: '30%',
                    animation: 'loadingBar 1.2s ease-in-out infinite'
                }}
            ></div>
        </div>
    );
}