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
        const fetchFirstRestorationDate = async () => {
            if (!userId) return;

            try {
                const supabase = await createSPASassClient();
                
                // Query the saved_images table for the user's oldest image
                const { data, error } = await supabase
                    .getSupabaseClient()
                    .from('saved_images')
                    .select('created_at')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: true })
                    .limit(1);

                if (error) {
                    console.error('Error fetching first restoration date:', error);
                    setLoading(false);
                    return;
                }

                if (data && data.length > 0) {
                    const firstDate = new Date(data[0].created_at);
                    const today = new Date();
                    
                    // Calculate the difference in days
                    const timeDifference = today.getTime() - firstDate.getTime();
                    const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));
                    
                    setDaysSinceFirst(Math.max(1, daysDifference)); // Show at least 1 day
                } else {
                    // No saved images yet
                    setDaysSinceFirst(null);
                }
            } catch (err) {
                console.error('Error calculating days since first restoration:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchFirstRestorationDate();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex items-center space-x-2 text-gray-500">
                <Calendar className="h-4 w-4 animate-pulse" />
                <span className="text-sm animate-pulse">Loading...</span>
            </div>
        );
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