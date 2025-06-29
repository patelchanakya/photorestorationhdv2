"use client";
import React from 'react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Upload, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import CreditTestPanel from '@/components/CreditTestPanel';
import EnhancedStreakDisplay from '@/components/EnhancedStreakDisplay';

export default function DashboardContent() {
    const { loading, user } = useGlobal();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }


    return (
        <div className="space-y-6 p-3 sm:p-6">
            {/* Welcome Section with Integrated Streak */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6">
                        <div className="flex-1">
                            <CardTitle className="text-2xl mb-2">Welcome back, {user?.email?.split('@')[0]}! 👋</CardTitle>
                            <CardDescription>
                                Ready to restore more memories? Your journey continues below.
                            </CardDescription>
                        </div>
                        
                        {user?.id && (
                            <div className="flex-shrink-0">
                                <EnhancedStreakDisplay userId={user.id} />
                            </div>
                        )}
                    </div>
                </CardHeader>
            </Card>

            {/* Test Panels */}
            <CreditTestPanel />

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Frequently used features</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Link
                            href="/app/storage"
                            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="p-2 bg-primary-50 rounded-full">
                                <Upload className="h-4 w-4 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="font-medium">Create</h3>
                            </div>
                        </Link>

                        <Link
                            href="/app/history"
                            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="p-2 bg-primary-50 rounded-full">
                                <ImageIcon className="h-4 w-4 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="font-medium">Gallery</h3>
                                <p className="text-sm text-gray-500">View your restored images</p>
                            </div>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}