"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import PricingService from "@/lib/pricing";
import { useGlobal } from '@/lib/context/GlobalContext';
import dynamic from 'next/dynamic';

const PurchaseModal = dynamic(() => import('@/components/PurchaseModal'), {
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    </div>
});

const HomePricing = () => {
    const tiers = PricingService.getAllTiers();
    const commonFeatures = PricingService.getCommonFeatures();
    const { user } = useGlobal();
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);

    const handleCtaClick = () => {
        if (user) {
            setShowPurchaseModal(true);
        }
        // If not authenticated, the Link component will handle navigation to register
    };

    // Calculate price per credit and extract credit count
    const getPricePerCredit = (tier: { price: number; features: string[] }) => {
        const price = tier.price;
        const creditCount = getCreditCount(tier);
        return creditCount > 0 ? price / creditCount : 0;
    };

    const getCreditCount = (tier: { price: number; features: string[] }) => {
        // Try to extract credit count from features
        const creditFeature = tier.features.find((f: string) => f.includes('photo restoration credit'));
        if (creditFeature) {
            const match = creditFeature.match(/(\d+)\s+photo restoration credit/);
            if (match) return parseInt(match[1]);
        }
        
        // Fallback based on tier name/price mapping
        if (tier.price === 2.99) return 2; // Duo Pack (updated to 2 credits)
        if (tier.price === 5.99) return 5; // Memories Pack
        if (tier.price === 18.99) return 25; // Family Pack
        if (tier.price === 49.99) return 100; // Archive Album Pack
        
        return 1; // Default fallback
    };

    return (
        <section id="pricing" className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Simple Credit Packages</h2>
                    <p className="text-gray-600 text-lg">Buy credits as you need them - no subscription required</p>
                    
                    {/* Promotional Banner */}
                    <div className="mt-6 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 max-w-md mx-auto">
                        <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            <p className="text-orange-800 font-semibold text-sm">
                                Start for Free - Get 1 restoration when you sign up!
                            </p>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {tiers.map((tier) => {
                        const pricePerCredit = getPricePerCredit(tier);
                        const creditCount = getCreditCount(tier);
                        
                        return (
                            <div
                                key={tier.name}
                                className={`relative bg-white rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-xl flex flex-col h-full ${
                                    tier.popular 
                                        ? 'border-orange-500 shadow-lg scale-105' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                {/* Badge */}
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    {tier.popular ? (
                                        <span className="px-3 py-1 text-xs font-bold rounded-full text-white whitespace-nowrap bg-orange-500">
                                            Most Popular
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap opacity-0 bg-transparent">
                                            Most Popular
                                        </span>
                                    )}
                                </div>

                                {/* Plan Name */}
                                <div className="text-center mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        {tier.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 h-10 flex items-center justify-center">
                                        {tier.description}
                                    </p>
                                </div>

                                {/* Price */}
                                <div className="text-center mb-6">
                                    <div className="text-4xl font-bold text-gray-900 mb-1">
                                        {PricingService.formatPrice(tier.price)}
                                    </div>
                                    <div className="text-sm text-gray-500 mb-2">
                                        {creditCount} {creditCount === 1 ? 'restoration' : 'restorations'}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        ${pricePerCredit.toFixed(2)} per photo
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="space-y-3 mb-6 flex-grow">
                                    {tier.features.map((feature) => (
                                        <div key={feature} className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                                <Check className="h-3 w-3 text-green-600" />
                                            </div>
                                            <span className="text-sm text-gray-600">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA Button */}
                                <div className="mt-auto">
                                    {user ? (
                                        <button
                                            onClick={handleCtaClick}
                                            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 text-sm ${
                                                tier.popular
                                                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                            }`}
                                        >
                                            Get Started
                                        </button>
                                    ) : (
                                        <Link
                                            href="/auth/register"
                                            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 text-sm text-center block ${
                                                tier.popular
                                                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                            }`}
                                        >
                                            Get Started
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Common Features */}
                {commonFeatures.length > 0 && (
                    <div className="text-center">
                        <p className="text-gray-600">
                            {commonFeatures.join(', ').replace('AI-powered restoration', 'restoration in seconds')}
                        </p>
                    </div>
                )}
            </div>

            {/* Purchase Modal */}
            <PurchaseModal
                isOpen={showPurchaseModal}
                onClose={() => setShowPurchaseModal(false)}
                onPurchaseSuccess={() => {
                    setShowPurchaseModal(false);
                }}
            />
        </section>
    );
};

export default HomePricing;