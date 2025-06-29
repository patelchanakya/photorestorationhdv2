"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useGlobal } from '@/lib/context/GlobalContext';
import { getPurchaseHistory } from '@/app/actions/credits';
import { Key, User, CheckCircle, CreditCard, ShoppingCart, History } from 'lucide-react';
import { MFASetup } from '@/components/MFASetup';
import PurchaseModal from '@/components/PurchaseModal';
import ProminentCreditsDisplay from '@/components/ProminentCreditsDisplay';
import { useSearchParams } from 'next/navigation';

export default function UserSettingsPage() {
    const { user } = useGlobal();
    const searchParams = useSearchParams();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Handle Stripe redirect parameters
    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        const successParam = searchParams.get('success');
        const cancelledParam = searchParams.get('cancelled');

        if (sessionId && successParam === 'true') {
            setSuccess('Payment successful! Your credits have been added to your account.');
            // Clear URL parameters
            window.history.replaceState({}, '', '/app/user-settings');
        } else if (cancelledParam === 'true') {
            setError('Payment was cancelled. No charges were made.');
            // Clear URL parameters
            window.history.replaceState({}, '', '/app/user-settings');
        }
    }, [searchParams]);

    // Load purchase history
    const loadPurchaseHistory = async () => {
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
    };

    useEffect(() => {
        if (user) {
            loadPurchaseHistory();
        }
    }, [user]);

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
                                <label className="text-sm font-medium text-gray-500">User ID</label>
                                <p className="mt-1 text-sm">{user?.id}</p>
                            </div>
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

                    <MFASetup
                        onStatusChange={() => {
                            setSuccess('Two-factor authentication settings updated successfully');
                        }}
                    />

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
                            <ProminentCreditsDisplay />
                            
                            <div className="flex gap-3">
                                <Button 
                                    onClick={() => setShowPurchaseModal(true)}
                                    className="flex items-center gap-2"
                                >
                                    <ShoppingCart className="h-4 w-4" />
                                    Buy More Credits
                                </Button>
                                
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