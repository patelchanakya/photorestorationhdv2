'use client';

import React, { useState } from 'react';
import { Check, Loader2, Shield, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { stripeProducts, type StripeProduct, getPricePerCredit, getPopularProduct } from '@/lib/stripe-config';
import { useGlobal } from '@/lib/context/GlobalContext';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional callback for future use when purchase completes successfully */
  onPurchaseSuccess?: () => void;
  /** Optional redirect path after successful purchase. Defaults to /app/user-settings */
  redirectPath?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, onPurchaseSuccess: _onPurchaseSuccess, redirectPath = '/app/user-settings' }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const { user, credits } = useGlobal();
  const posthog = usePostHog();

  // Track modal open
  useEffect(() => {
    if (isOpen && posthog) {
      posthog.capture('purchase_modal_opened', {
        current_credits: credits || 0
      });
    }
  }, [isOpen, posthog, credits]);

  const handlePurchase = async (product: StripeProduct) => {
    if (!user) {
      setError('Please sign in to make a purchase');
      return;
    }

    // Track purchase attempt
    if (posthog) {
      posthog.capture('credit_purchase_attempted', {
        product_name: product.name,
        credits: product.credits,
        price: product.price,
        price_per_credit: getPricePerCredit(product),
        current_credits: credits || 0
      });
    }

    setLoading(product.priceId);
    setError('');

    try {
      const response = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          price_id: product.priceId,
          mode: product.mode,
          success_url: `${window.location.origin}${redirectPath}?session_id={CHECKOUT_SESSION_ID}&success=true`,
          cancel_url: `${window.location.origin}${redirectPath}?cancelled=true`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Stripe checkout error:', errorData);
        
        // Enhanced error handling
        let userMessage = errorData.error || 'Failed to start checkout process. Please try again.';
        
        if (userMessage.includes('Missing required parameter')) {
          userMessage = 'Configuration error: Missing required parameters';
        } else if (userMessage.includes('Authentication required')) {
          userMessage = 'Authentication failed. Please try signing out and back in.';
        } else if (userMessage.includes('STRIPE_SECRET_KEY')) {
          userMessage = 'Payment system configuration error. Please contact support.';
        } else if (userMessage.includes('Invalid price configuration')) {
          userMessage = 'Invalid price configuration. Please contact support.';
        } else if (userMessage.includes('Customer setup failed')) {
          userMessage = 'Customer setup failed. Please try again.';
        }
        
        // Track API failure
        if (posthog) {
          posthog.capture('credit_purchase_failed', {
            product_name: product.name,
            credits: product.credits,
            price: product.price,
            reason: 'api_error',
            stage: 'checkout_api',
            error_message: userMessage
          });
        }
        
        setError(userMessage);
        setLoading(null);
        return;
      }

      const data = await response.json();
      console.log('Checkout response:', data);

      if (data?.url) {
        // Track successful checkout redirect
        if (posthog) {
          posthog.capture('credit_purchase_checkout_redirect', {
            product_name: product.name,
            credits: product.credits,
            price: product.price,
            checkout_session_id: data.sessionId
          });
        }
        
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        console.error('No checkout URL in response:', data);
        setError('No checkout URL received from payment system');
        setLoading(null);
        
        // Track failure
        if (posthog) {
          posthog.capture('credit_purchase_failed', {
            product_name: product.name,
            credits: product.credits,
            price: product.price,
            reason: 'no_checkout_url',
            stage: 'checkout_setup'
          });
        }
      }
    } catch (err: unknown) {
      console.error('Purchase error details:', err);
      
      let userMessage = 'Failed to start checkout process. Please try again.';
      
      if (err instanceof Error) {
        if (err.message?.includes('fetch')) {
          userMessage = 'Network error. Please check your connection and try again.';
        } else if (err.message?.includes('timeout')) {
          userMessage = 'Request timed out. Please try again.';
        }
      }
      
      // Track exception
      if (posthog) {
        posthog.capture('credit_purchase_failed', {
          product_name: product.name,
          credits: product.credits,
          price: product.price,
          reason: 'exception',
          stage: 'checkout_request',
          error_message: err instanceof Error ? err.message : 'unknown_exception'
        });
      }
      
      setError(userMessage);
      setLoading(null);
    }
  };

  const popularProduct = getPopularProduct();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto mt-0 sm:mt-0 pt-16 sm:pt-0">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-gray-900 mb-2">
            One-Time Purchase
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base">
            Buy credits as you need them - no subscription required
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              {error}
              <p className="text-xs mt-1 opacity-75">
                If this problem persists, please contact support.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Value Comparison Section - Hidden on mobile */}
        <div className="mb-8 hidden md:block">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Why Choose Digital Restoration?</h3>
          <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Traditional Restoration Card */}
            <div className="relative bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-6 transform transition-all duration-300 hover:scale-105 shadow-lg">
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center mr-4 shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-bold text-red-800 text-lg">Traditional Restoration</h4>
              </div>
              <ul className="text-red-700 space-y-3">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3 flex-shrink-0"></div>
                  <span className="font-semibold">$30-200 per photo</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3 flex-shrink-0"></div>
                  <span>2-4 weeks wait time</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3 flex-shrink-0"></div>
                  <span>Risk of damage</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3 flex-shrink-0"></div>
                  <span>Limited availability</span>
                </li>
              </ul>
            </div>

            {/* Digital Service Card */}
            <div className="relative bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 transform transition-all duration-300 hover:scale-105 shadow-lg">
              <div className="absolute -top-3 -right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mr-4 shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="font-bold text-green-800 text-lg">Our Digital Service</h4>
              </div>
              <ul className="text-green-700 space-y-3">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                  <span className="font-semibold">Up to 100x cheaper</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                  <span>Results in seconds</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                  <span>Private & secure</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                  <span>Available 24/7</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stripeProducts.map((product) => {
            const isPopular = product.id === popularProduct.id;
            const pricePerCredit = getPricePerCredit(product);
            
            return (
              <div key={product.id} className="relative">
                {/* Badge - Positioned at top of card */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="px-3 py-1 text-xs font-bold rounded-full text-white whitespace-nowrap bg-orange-500 shadow-sm">
                      POPULAR
                    </span>
                  </div>
                )}
                
                <div
                  className={`relative bg-white rounded-lg border p-4 transition-all duration-200 hover:shadow-md flex flex-col h-full ${
                    isPopular 
                      ? 'border-orange-300 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >

                {/* Plan Name */}
                <div className="text-center mb-3">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-600 h-8 flex items-center justify-center">
                    {product.description}
                  </p>
                </div>

                {/* Price */}
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {product.price}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {product.credits} photo {product.credits === 1 ? 'restoration' : 'restorations'}
                  </div>
                  <div className="text-xs text-gray-400">
                    ${pricePerCredit.toFixed(2)} per photo
                  </div>
                </div>

                {/* Features - Simplified for mobile */}
                <div className="space-y-2 mb-4 flex-grow">
                  {[
                    'HD quality',
                    'Instant results', 
                    'Keep forever'
                  ].map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center text-xs text-gray-700">
                      <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                        <Check size={10} className="text-green-600" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Button */}
                <div className="mt-auto">
                  <Button
                    onClick={() => handlePurchase(product)}
                    disabled={loading === product.priceId}
                    className={`w-full py-2 px-3 text-sm font-medium transition-colors ${
                      isPopular 
                        ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                        : 'bg-gray-800 hover:bg-gray-900 text-white'
                    } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                  >
                    {loading === product.priceId ? (
                      <>
                        <Loader2 size={14} className="animate-spin mr-1" />
                        Processing...
                      </>
                    ) : (
                      'Get Started'
                    )}
                  </Button>
                </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Support & Trust Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-gray-600 mb-4">Get priority support for any restoration issues</p>
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                <Button 
                  asChild
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <a 
                    href="https://facebook.com/photorestorationhd" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Message Us on Facebook
                  </a>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText('support@photorestorationhd.com');
                    setEmailCopied(true);
                    setTimeout(() => setEmailCopied(false), 2000);
                  }}
                  className="text-gray-600 hover:text-gray-800"
                >
                  {emailCopied ? (
                    <>
                      <Check size={16} className="mr-2 text-green-600" />
                      Email Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} className="mr-2" />
                      Copy Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500 mb-6">
            <div className="flex items-center">
              <Shield size={16} className="mr-2 text-green-500" />
              <span>Secure Stripe Payment</span>
            </div>
            <div className="flex items-center">
              <Check size={16} className="mr-2 text-green-500" />
              <span>Instant Download</span>
            </div>
            {/* <div className="flex items-center">
              <Award size={16} className="mr-2 text-green-500" />
              <span>Money-back Guarantee</span>
            </div> */}
          </div>

          <div className="text-center text-xs text-gray-400">
            <p>
              By purchasing, you agree to our{' '}
              <a 
                href="/legal/terms-of-service" 
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
              >
                Terms of Service
              </a>
              {' '}and{' '}
              <a 
                href="/legal/privacy-notice" 
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseModal;