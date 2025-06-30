"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import PricingService from "@/lib/pricing";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

    return (
        <section id="pricing" className="py-24 bg-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Simple Credit Packages</h2>
                    <p className="text-gray-600 text-lg">Buy credits as you need them - no subscription required</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {tiers.map((tier) => (
                        <Card
                            key={tier.name}
                            className={`relative flex flex-col ${
                                tier.popular ? 'border-primary-500 shadow-lg' : ''
                            }`}
                        >
                            {tier.popular && (
                                <div className="absolute top-0 right-0 -translate-y-1/2 px-3 py-1 bg-primary-500 text-white text-sm rounded-full">
                                    Most Popular
                                </div>
                            )}

                            <CardHeader>
                                <CardTitle>{tier.name}</CardTitle>
                                <CardDescription>{tier.description}</CardDescription>
                            </CardHeader>

                            <CardContent className="flex-grow flex flex-col">
                                <div className="mb-6">
                                    <span className="text-4xl font-bold">{PricingService.formatPrice(tier.price)}</span>
                                    <span className="text-gray-600 ml-2">credits</span>
                                </div>

                                <ul className="space-y-3 mb-8 flex-grow">
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-2">
                                            <Check className="h-5 w-5 text-green-500" />
                                            <span className="text-gray-600">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {user ? (
                                    <Button
                                        onClick={handleCtaClick}
                                        className={`w-full ${
                                            tier.popular
                                                ? 'bg-primary-600 text-white hover:bg-primary-700'
                                                : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                                        }`}
                                        variant={tier.popular ? "default" : "secondary"}
                                    >
                                        Buy Credits
                                    </Button>
                                ) : (
                                    <Link
                                        href="/auth/register"
                                        className={`w-full text-center px-6 py-3 rounded-lg font-medium transition-colors ${
                                            tier.popular
                                                ? 'bg-primary-600 text-white hover:bg-primary-700'
                                                : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                                        }`}
                                    >
                                        Get Started
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {commonFeatures.length > 0 && (
                  <div className="text-center mt-4">
                    <p className="text-gray-600">
                      {commonFeatures.join(', ')}
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
