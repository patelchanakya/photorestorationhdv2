"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useGlobal } from '@/lib/context/GlobalContext';
import { getPurchaseHistory } from '@/app/actions/credits';
import { Key, User, CheckCircle, CreditCard, History, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ProminentCreditsDisplay from '@/components/ProminentCreditsDisplay';
import dynamic from 'next/dynamic';

const PurchaseModal = dynamic(() => import('@/components/PurchaseModal'), {
    loading: () => <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
        <span>Loading...</span>
    </div>
});
import { useSearchParams } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { CreditPurchase } from '../../../../../types';
import { useCallback } from 'react';
import { createSPASassClient } from '@/lib/supabase/client';

function UserSettingsContent() {
    const { user } = useGlobal();
    const searchParams = useSearchParams();
    const posthog = usePostHog();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [purchaseHistory, setPurchaseHistory] = useState<CreditPurchase[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Handle Stripe redirect parameters
    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        const successParam = searchParams.get('success');
        const cancelledParam = searchParams.get('cancelled');

        if (sessionId && successParam === 'true') {
            setSuccess('Payment successful! Your credits have been added to your account.');
            
            // Track successful purchase completion
            if (posthog) {
                posthog.capture('credit_purchase_completed', {
                    session_id: sessionId,
                    payment_method: 'stripe'
                });
            }
            
            // Clear URL parameters
            window.history.replaceState({}, '', '/app/user-settings');
        } else if (cancelledParam === 'true') {
            setError('Payment was cancelled. No charges were made.');
            
            // Track purchase cancellation
            if (posthog) {
                posthog.capture('credit_purchase_cancelled', {
                    stage: 'stripe_checkout'
                });
            }
            
            // Clear URL parameters
            window.history.replaceState({}, '', '/app/user-settings');
        }
    }, [searchParams, posthog]);

    // Load purchase history
    const loadPurchaseHistory = useCallback(async () => {
        if (!user) return;
        
        setLoadingHistory(true);
        try {
            const result = await getPurchaseHistory(user.id);
            if (result.success) {
                setPurchaseHistory(result.data || []);
            } else {
                console.error('Error loading purchase history:', result.error);
            }
        } catch (err) {
            console.error('Error loading purchase history:', err);
        } finally {
            setLoadingHistory(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            loadPurchaseHistory();
        }
    }, [user, loadPurchaseHistory]);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("New passwords don't match");
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const supabase = await createSPASassClient();
            const client = supabase.getSupabaseClient();

            const { error } = await client.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setSuccess('Password updated successfully');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: Error | unknown) {
            if (err instanceof Error) {
                console.error('Error updating password:', err);
                setError(err.message);
            } else {
                console.error('Error updating password:', err);
                setError('Failed to update password');
            }
        } finally {
            setLoading(false);
        }
    };




    return (
        <div className="space-y-6 p-6">
            <div className="mb-6">
                <Link href="/app/storage" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Home
                </Link>
            </div>
            
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">User Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences
                </p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                User Details
                            </CardTitle>
                            <CardDescription>Your account information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Email</label>
                                <p className="mt-1 text-sm">{user?.email}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                Change Password
                            </CardTitle>
                            <CardDescription>Update your account password</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="new-password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="confirm-password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 text-sm"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </CardContent>
                    </Card>


                    {/* Credit Management Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Credit Management
                            </CardTitle>
                            <CardDescription>Manage your photo restoration credits</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ProminentCreditsDisplay onBuyMore={() => setShowPurchaseModal(true)} />
                            
                            <div className="flex gap-3">
                                <Button 
                                    variant="outline"
                                    onClick={loadPurchaseHistory}
                                    disabled={loadingHistory}
                                    className="flex items-center gap-2"
                                >
                                    <History className="h-4 w-4" />
                                    {loadingHistory ? 'Loading...' : 'Refresh History'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Purchase History Section */}
                    {purchaseHistory.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    Purchase History
                                </CardTitle>
                                <CardDescription>Your recent credit purchases</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {purchaseHistory.map((purchase) => (
                                        <div 
                                            key={purchase.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div>
                                                <p className="font-medium">{purchase.credits_purchased} credits</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(purchase.created_at).toLocaleDateString()} at{' '}
                                                    {new Date(purchase.created_at).toLocaleTimeString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">
                                                    ${(purchase.amount_paid / 100).toFixed(2)} {purchase.currency.toUpperCase()}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    ID: {purchase.stripe_session_id.slice(-8)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {purchaseHistory.length === 10 && (
                                    <p className="text-xs text-gray-500 mt-3 text-center">
                                        Showing last 10 purchases
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Purchase Modal */}
            <PurchaseModal
                isOpen={showPurchaseModal}
                onClose={() => setShowPurchaseModal(false)}
                onPurchaseSuccess={() => {
                    setShowPurchaseModal(false);
                    setSuccess('Redirecting to payment...');
                }}
            />
        </div>
    );
}

export default function UserSettingsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <UserSettingsContent />
        </Suspense>
    );
}