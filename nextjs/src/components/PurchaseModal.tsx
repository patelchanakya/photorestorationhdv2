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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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

        {/* Value Comparison Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Why Choose Digital Restoration?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Traditional Restoration Card */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-5">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-red-700">Traditional Restoration</h4>
              </div>
              <ul className="text-sm text-red-600 space-y-2">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-3 flex-shrink-0"></span>
                  $30-200 per photo
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-3 flex-shrink-0"></span>
                  2-4 weeks wait time
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-3 flex-shrink-0"></span>
                  Risk of damage
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-3 flex-shrink-0"></span>
                  Limited availability
                </li>
              </ul>
            </div>

            {/* Digital Service Card */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-5">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="font-semibold text-green-700">Our Digital Service</h4>
              </div>
              <ul className="text-sm text-green-600 space-y-2">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-3 flex-shrink-0"></span>
                  Up to 100x cheaper
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-3 flex-shrink-0"></span>
                  Results in seconds
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-3 flex-shrink-0"></span>
                  Private & secure
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-3 flex-shrink-0"></span>
                  Available 24/7
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
                  className={`relative bg-white rounded-lg border p-6 transition-all duration-200 hover:shadow-md flex flex-col h-full ${
                    isPopular 
                      ? 'border-orange-300 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >

                {/* Plan Name */}
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 h-10 flex items-center justify-center">
                    {product.description}
                  </p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {product.price}
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    {product.credits} {product.credits === 1 ? 'restoration' : 'restorations'}
                  </div>
                  <div className="text-xs text-gray-400">
                    ${pricePerCredit.toFixed(2)} per photo
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6 flex-grow">
                  {[
                    'Priority support',
                    'HD quality restoration', 
                    'Instant processing',
                    'Download & keep forever'
                  ].map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center text-sm text-gray-700">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check size={12} className="text-green-600" />
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
                    className={`w-full py-2.5 px-4 font-medium transition-colors ${
                      isPopular 
                        ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                        : 'bg-gray-800 hover:bg-gray-900 text-white'
                    } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                  >
                    {loading === product.priceId ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2" />
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