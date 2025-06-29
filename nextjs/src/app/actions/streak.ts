/* eslint-disable */
// @ts-nocheck



'use server';

import { createSPASassClient } from '@/lib/supabase/client';
import { revalidatePath } from 'next/cache';

interface StreakData {
  currentStreakDays: number;
  checkpointLevel: number;
  lastActivityDate: string | null;
  milestones: {
    day7: { achieved: boolean; claimed: boolean; reward: number };
    day30: { achieved: boolean; claimed: boolean; reward: number };
    day60: { achieved: boolean; claimed: boolean; reward: number };
    day100: { achieved: boolean; claimed: boolean; reward: number };
    day365: { achieved: boolean; claimed: boolean; reward: number };
  };
}

export async function getStreakData(userId: string): Promise<StreakData | null> {
  try {
    const supabase = await createSPASassClient();
    
    // Get user's streak data
    const { data: userData, error } = await supabase.getSupabaseClient()
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !userData) {
      console.error('Error fetching user streak data:', error);
      return null;
    }

    // Calculate current streak based on saved_images activity
    const { data: lastImageData } = await supabase.getSupabaseClient()
      .from('saved_images')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    let actualStreakDays = userData.current_streak_days || 0;
    let checkpointLevel = userData.checkpoint_level || 0;

    // Check if streak should be broken
    if (lastImageData && lastImageData.length > 0) {
      const lastActivityDate = new Date(lastImageData[0].created_at);
      const lastActivityStr = lastActivityDate.toISOString().split('T')[0];
      const daysDiff = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff > 1) {
        // Streak is broken - reset to checkpoint level
        if (checkpointLevel === 0) {
          actualStreakDays = 0;
        } else {
          actualStreakDays = checkpointLevel;
        }

        // Update database with streak break
        await supabase.getSupabaseClient()
          .from('user_credits')
          .update({
            current_streak_days: actualStreakDays,
            last_activity_date: lastActivityStr
          })
          .eq('user_id', userId);
      } else if (daysDiff === 0 && lastActivityStr === todayStr) {
        // Activity today - calculate total streak days
        const { data: firstImageData } = await supabase.getSupabaseClient()
          .from('saved_images')
          .select('created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(1);

        if (firstImageData && firstImageData.length > 0) {
          const firstDate = new Date(firstImageData[0].created_at);
          actualStreakDays = Math.ceil((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Update streak in database
          await supabase.getSupabaseClient()
            .from('user_credits')
            .update({
              current_streak_days: actualStreakDays,
              last_activity_date: todayStr
            })
            .eq('user_id', userId);
        }
      }
    }

    return {
      currentStreakDays: actualStreakDays,
      checkpointLevel,
      lastActivityDate: userData.last_activity_date,
      milestones: {
        day7: {
          achieved: actualStreakDays >= 7,
          claimed: userData.milestone_7_claimed || false,
          reward: 3
        },
        day30: {
          achieved: actualStreakDays >= 30,
          claimed: userData.milestone_30_claimed || false,
          reward: 5
        },
        day60: {
          achieved: actualStreakDays >= 60,
          claimed: userData.milestone_60_claimed || false,
          reward: 10
        },
        day100: {
          achieved: actualStreakDays >= 100,
          claimed: userData.milestone_100_claimed || false,
          reward: 15
        }
      }
    };
  } catch (error) {
    console.error('Error in getStreakData:', error);
    return null;
  }
}

export async function claimMilestoneReward(userId: string, milestone: number): Promise<{ success: boolean; error?: string; newCredits?: number }> {
  try {
    const supabase = await createSPASassClient();
    
    // Get current user data
    const { data: userData, error: fetchError } = await supabase.getSupabaseClient()
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError || !userData) {
      return { success: false, error: 'User not found' };
    }

    // Check if milestone is achieved and not already claimed
    const milestoneField = `milestone_${milestone}_claimed` as keyof typeof userData;
    const currentStreakDays = userData.current_streak_days || 0;

    if (currentStreakDays < milestone) {
      return { success: false, error: 'Milestone not yet achieved' };
    }

    if (userData[milestoneField]) {
      return { success: false, error: 'Milestone already claimed' };
    }

    // Determine reward amount (365 milestone removed)
    const rewardAmounts: Record<number, number> = {
      7: 3,
      30: 5,
      60: 10,
      100: 15
    };

    const rewardCredits = rewardAmounts[milestone];
    if (!rewardCredits) {
      return { success: false, error: 'Invalid milestone' };
    }

    // Update credits and mark milestone as claimed
    const newCredits = userData.credits + rewardCredits;
    const updateData: any = {
      credits: newCredits,
      updated_at: new Date().toISOString()
    };
    updateData[milestoneField] = true;

    // Update checkpoint level if this is a new highest milestone
    if (milestone > userData.checkpoint_level) {
      updateData.checkpoint_level = milestone;
    }

    const { error: updateError } = await supabase.getSupabaseClient()
      .from('user_credits')
      .update(updateData)
      .eq('user_id', userId);

    if (updateError) {
      return { success: false, error: 'Failed to update user data' };
    }

    // Revalidate relevant paths
    revalidatePath('/app');
    revalidatePath('/app/storage');

    return { success: true, newCredits };
  } catch (error) {
    console.error('Error claiming milestone reward:', error);
    return { success: false, error: 'Internal server error' };
  }
}