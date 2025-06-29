<<<<<<< Updated upstream
'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { createSPASassClient } from '@/lib/supabase/client';

interface UserStatsDisplayProps {
  userId: string;
}

export default function UserStatsDisplay({ userId }: UserStatsDisplayProps) {
  const [stats, setStats] = useState({
    daysUsing: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) return;

      try {
        const supabase = await createSPASassClient();
        
        // Get the oldest restoration date from saved_images
        const { data: oldestImage } = await supabase.getSupabaseClient()
          .from('saved_images')
          .select('created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        let daysUsing = 0;
        if (oldestImage?.created_at) {
          const daysSinceFirstRestoration = Math.floor(
            (new Date().getTime() - new Date(oldestImage.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          daysUsing = Math.max(daysSinceFirstRestoration, 0);
        }

        setStats({
          daysUsing,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setStats({ daysUsing: 0, loading: false });
      }
    };

    fetchStats();
  }, [userId]);

  if (stats.loading) {
    return (
      <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
    );
  }

  if (stats.daysUsing === 0) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Calendar className="h-4 w-4" />
        <span>Start your restoration journey today!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <Calendar className="h-4 w-4" />
      <span>
        Restoring memories for <span className="font-semibold text-gray-900">{stats.daysUsing}</span> {stats.daysUsing === 1 ? 'day' : 'days'}
      </span>
    </div>
  );
=======
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
>>>>>>> Stashed changes
}