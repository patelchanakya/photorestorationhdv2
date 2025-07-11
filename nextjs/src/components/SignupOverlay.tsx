"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { X, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { createSPASassClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface SignupOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupSuccess: () => void;
  demoFileName?: string;
}

const SignupOverlay: React.FC<SignupOverlayProps> = ({
  isOpen,
  onClose,
  onSignupSuccess,
  demoFileName
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const supabaseClient = await createSPASassClient();
      const { error } = await supabaseClient.registerEmail(email, password);

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      // Mark that user signed up from demo
      localStorage.setItem('signed_up_from_demo', 'true');
      
      // Success - redirect to email verification (following existing signup flow)
      onSignupSuccess();
      router.push('/auth/verify-email');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="relative p-6 text-center border-b">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Your Photo is Ready! 🎉
            </h2>
            <p className="text-gray-600 mt-2">
              Create your free account to view and download your restored image
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">What you get:</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
                Your restored {demoFileName || 'photo'} in HD quality
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2 mt-1.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">
                  Sign up now and get <span className="font-bold">1 free restoration credit</span> (worth <s>$2.99</s>)!
                </span>
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
                Secure cloud storage for your photos
              </li>
            </ul>
          </div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Create a password (6+ characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>View My Restored Photo</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              By signing up, you agree to our{' '}
              <Link href="/legal/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/legal/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  // Store demo info for login flow too
                  localStorage.setItem('signed_up_from_demo', 'true');
                  router.push('/auth/login');
                }}
                className="text-blue-600 hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupOverlay;