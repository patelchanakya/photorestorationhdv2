// src/app/auth/login/page.tsx
'use client';

import { createSPASassClient } from '@/lib/supabase/client';
import {useEffect, useState} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SSOButtons from '@/components/SSOButtons';
import { usePostHog } from 'posthog-js/react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showMFAPrompt, setShowMFAPrompt] = useState(false);
    const router = useRouter();
    const posthog = usePostHog();

    // Track page view
    useEffect(() => {
        if (posthog) {
            posthog.capture('login_page_viewed');
        }
    }, [posthog]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Track login attempt
        if (posthog) {
            posthog.capture('login_attempted', { 
                email_domain: email.split('@')[1],
                method: 'email_password'
            });
        }

        try {
            const client = await createSPASassClient();
            const { error: signInError } = await client.loginEmail(email, password);

            if (signInError) throw signInError;

            // Check if MFA is required
            const supabase = client.getSupabaseClient();
            const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

            if (mfaError) throw mfaError;

            if (mfaData.nextLevel === 'aal2' && mfaData.nextLevel !== mfaData.currentLevel) {
                setShowMFAPrompt(true);
                // Track MFA required (though we're not focusing on MFA analytics)
                if (posthog) {
                    posthog.capture('login_mfa_required');
                }
            } else {
                // Track successful login
                if (posthog) {
                    posthog.capture('login_successful', { 
                        email_domain: email.split('@')[1],
                        method: 'email_password'
                    });
                }
                router.push('/app/storage');
                return;
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
                // Track login failure
                if (posthog) {
                    posthog.capture('login_failed', { 
                        email_domain: email.split('@')[1],
                        method: 'email_password',
                        error_message: err.message 
                    });
                }
            } else {
                setError('An unknown error occurred');
                if (posthog) {
                    posthog.capture('login_failed', { 
                        email_domain: email.split('@')[1],
                        method: 'email_password',
                        error_message: 'unknown_error'
                    });
                }
            }
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if(showMFAPrompt) {
            router.push('/auth/2fa');
        }
    }, [showMFAPrompt, router]);


    return (
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
                <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email address
                    </label>
                    <div className="mt-1">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <div className="mt-1">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-sm">
                        <Link href="/auth/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                            Forgot your password?
                        </Link>
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </div>
            </form>

            <SSOButtons onError={setError} />

            <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">Don&#39;t have an account?</span>
                {' '}
                <Link href="/auth/register" className="font-medium text-primary-600 hover:text-primary-500">
                    Sign up
                </Link>
            </div>
        </div>
    );
}