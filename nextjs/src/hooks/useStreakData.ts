import { useState, useEffect, useCallback } from 'react';
import { getStreakData, claimMilestoneReward } from '@/app/actions/streak';
import { useGlobal } from '@/lib/context/GlobalContext';

interface MilestoneData {
  achieved: boolean;
  claimed: boolean;
  reward: number;
}

interface StreakData {
  currentStreakDays: number;
  totalPhotosRestored: number;
  checkpointLevel: number;
  lastActivityDate: string | null;
  milestones: {
    day7: MilestoneData;
    day30: MilestoneData;
    day60: MilestoneData;
    day100: MilestoneData;
  };
  loading: boolean;
  error: string | null;
}

export function useStreakData(userId: string | undefined) {
  const { triggerCreditUpdate } = useGlobal();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreakDays: 0,
    totalPhotosRestored: 0,
    checkpointLevel: 0,
    lastActivityDate: null,
    milestones: {
      day7: { achieved: false, claimed: false, reward: 3 },
      day30: { achieved: false, claimed: false, reward: 5 },
      day60: { achieved: false, claimed: false, reward: 10 },
      day100: { achieved: false, claimed: false, reward: 15 }
    },
    loading: true,
    error: null
  });

  const fetchStreakData = useCallback(async () => {
    if (!userId) {
      setStreakData(prev => ({ ...prev, loading: false }));
      return;
    }
    
    try {
      setStreakData(prev => ({ ...prev, loading: true, error: null }));
      
      // Get streak data from server action
      const streakResult = await getStreakData(userId);
      
      if (!streakResult) {
        throw new Error('Failed to fetch streak data');
      }
      
      // Get total photos count for display
      const { createSPASassClient } = await import('@/lib/supabase/client');
      const supabase = await createSPASassClient();
      const { count } = await supabase.getSupabaseClient()
        .from('saved_images')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      setStreakData({
        currentStreakDays: streakResult.currentStreakDays,
        totalPhotosRestored: count || 0,
        checkpointLevel: streakResult.checkpointLevel,
        lastActivityDate: streakResult.lastActivityDate,
        milestones: streakResult.milestones,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching streak data:', error);
      setStreakData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch streak data'
      }));
    }
  }, [userId]);

  // Refresh function that can be called by other components
  const refreshStreak = useCallback(async () => {
    await fetchStreakData();
  }, [fetchStreakData]);

  // Initial fetch on mount and when userId changes
  useEffect(() => {
    if (userId) {
      fetchStreakData();
    }
  }, [userId, fetchStreakData]);

  // Claim milestone reward function
  const claimMilestone = useCallback(async (milestone: number) => {
    if (!userId) return { success: false, error: 'No user ID' };
    
    const result = await claimMilestoneReward(userId, milestone);
    if (result.success) {
      // Trigger instant credit update
      if (result.newCredits !== undefined) {
        triggerCreditUpdate(result.newCredits);
      }
      // Refresh streak data after claiming
      await fetchStreakData();
    }
    return result;
  }, [userId, fetchStreakData, triggerCreditUpdate]);

  return {
    ...streakData,
    refreshStreak,
    claimMilestone
  };
}