"use client";
import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { createSPASassClient } from '@/lib/supabase/client';

interface UserStatsDisplayProps {
    userId: string;
}

export default function UserStatsDisplay({ userId }: UserStatsDisplayProps) {
    const [daysSinceFirst, setDaysSinceFirst] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFirstCreditDate = async () => {
            if (!userId) return;

            try {
                const supabase = await createSPASassClient();
                
                // Query the user_credits table for when the user first got credits
                const { data, error } = await supabase
                    .getSupabaseClient()
                    .from('user_credits')
                    .select('created_at')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: true })
                    .limit(1);

                if (error) {
                    console.error('Error fetching first credit date:', error);
                    setLoading(false);
                    return;
                }

                if (data && data.length > 0) {
                    const createdAt = data[0].created_at;
                    if (!createdAt) {
                        setDaysSinceFirst(null);
                    } else {
                        const firstDate = new Date(createdAt);
                        const today = new Date();
                        const timeDifference = today.getTime() - firstDate.getTime();
                        const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));
                        setDaysSinceFirst(Math.max(1, daysDifference));
                    }
                } else {
                    // No credits yet - user hasn't started using the service
                    setDaysSinceFirst(null);
                }
            } catch (err) {
                console.error('Error calculating days since first credit:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchFirstCreditDate();
    }, [userId]);

    if (loading) {
        return null; // Don't show loading state to prevent layout shifts
    }

    if (daysSinceFirst === null) {
        return null; // Don't show anything if no restorations yet
    }

    return (
        <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
                Restoring memories for <span className="font-medium text-gray-900">{daysSinceFirst}</span> {daysSinceFirst === 1 ? 'day' : 'days'}
            </span>
        </div>
    );
}