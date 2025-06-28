"use client";
import React, { useState, useEffect } from 'react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CalendarDays, Upload, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import CreditTestPanel from '@/components/CreditTestPanel';
import { createSPASassClient } from '@/lib/supabase/client';

export default function DashboardContent() {
    const { loading, user } = useGlobal();
    const [daysSinceFirstImage, setDaysSinceFirstImage] = useState<number>(0);
    const [loadingDays, setLoadingDays] = useState(true);

    const getDaysSinceFirstImage = async () => {
        if (!user?.id) return 0;
        
        try {
            const supabase = await createSPASassClient();
            const { data, error } = await supabase.getSupabaseClient()
                .from('saved_images')
                .select('created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true })
                .limit(1);
            
            if (error) {
                console.error('Error fetching first image date:', error);
                return 0;
            }
            
            if (!data || data.length === 0) {
                return 0; // No images saved yet
            }
            
            const firstImageDate = new Date(data[0].created_at);
            const today = new Date();
            const diffTime = Math.abs(today.getTime() - firstImageDate.getTime());
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (error) {
            console.error('Error calculating days since first image:', error);
            return 0;
        }
    };

    useEffect(() => {
        if (user?.id) {
            getDaysSinceFirstImage().then(days => {
                setDaysSinceFirstImage(days);
                setLoadingDays(false);
            });
        }
    }, [user?.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }


    return (
        <div className="space-y-6 p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Welcome, {user?.email?.split('@')[0]}! 👋</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {loadingDays ? (
                            <span className="animate-pulse">Loading...</span>
                        ) : daysSinceFirstImage > 0 ? (
                            `You have been restoring photos for ${daysSinceFirstImage} days!`
                        ) : (
                            "Start restoring photos to track your journey!"
                        )}
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Credit Test Panel */}
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