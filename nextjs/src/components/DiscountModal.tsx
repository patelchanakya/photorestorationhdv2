"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, Sparkles } from 'lucide-react';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DiscountModal({ isOpen, onClose }: DiscountModalProps) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText('FAMILY50');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Reset copied state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  const handleGetStarted = () => {
    onClose(); // Close modal first
    router.push('/auth/register'); // Redirect to signup
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto animate-in zoom-in-95 duration-300 ease-out">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <Sparkles className="h-8 w-8 text-orange-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            🎉 Discount Activated!
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Here&apos;s how to claim your 50% off:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-sm font-bold">1</span>
              </div>
              <p className="text-sm text-gray-700">Sign up for your free account</p>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-sm font-bold">2</span>
              </div>
              <p className="text-sm text-gray-700">Click &quot;Get Started&quot; on any credit package</p>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-sm font-bold">3</span>
              </div>
              <p className="text-sm text-gray-700">Add code <code className="bg-gray-100 px-1 rounded text-orange-600 font-mono">FAMILY50</code> at Stripe checkout</p>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-sm font-bold">4</span>
              </div>
              <p className="text-sm text-gray-700">Enjoy 50% off your first purchase!</p>
            </div>
          </div>

          {/* Code Copy Section */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Discount Code:</p>
                <p className="text-lg font-mono font-bold text-orange-900">FAMILY50</p>
              </div>
              <Button
                onClick={copyCode}
                variant="outline"
                size="sm"
                className={`${
                  copied 
                    ? 'bg-green-100 text-green-700 border-green-300' 
                    : 'bg-white text-orange-600 border-orange-300 hover:bg-orange-50'
                } transition-all duration-200`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button 
            onClick={handleGetStarted}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2"
          >
            Got it! Let&apos;s Start
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}