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
}