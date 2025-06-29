"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Zap, Camera, Check } from 'lucide-react';
import { useStreakData } from '@/hooks/useStreakData';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EnhancedStreakDisplayProps {
  userId: string;
}

export default function EnhancedStreakDisplay({ userId }: EnhancedStreakDisplayProps) {
  // Check if streak feature is enabled via environment variable
  const isStreakEnabled = process.env.NEXT_PUBLIC_STREAK_ENABLED === 'true';
  
  // Don't render anything if streak feature is disabled
  if (!isStreakEnabled) {
    return null;
  }

  const { currentStreakDays, totalPhotosRestored, milestones, loading, claimMilestone } = useStreakData(userId);
  const [rewardDialog, setRewardDialog] = useState<{ open: boolean; milestone: number; reward: number } | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  // Fixed milestone system - always show same 4 milestones
  const milestonePoints = [7, 30, 60, 100];

  // Simple confetti animation
  const triggerConfetti = () => {
    // Create confetti elements
    const confettiCount = 50;
    const colors = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * window.innerWidth + 'px';
      confetti.style.top = '-10px';
      confetti.style.borderRadius = '50%';
      confetti.style.pointerEvents = 'none';
      confetti.style.zIndex = '9999';
      confetti.style.transition = 'transform 3s ease-out, opacity 3s ease-out';
      
      document.body.appendChild(confetti);
      
      // Animate confetti falling
      setTimeout(() => {
        confetti.style.transform = `translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 360}deg)`;
        confetti.style.opacity = '0';
      }, 100);
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(confetti);
      }, 3000);
    }
  };

  // Determine current level based on streak (capped at 100 days)
  const getStreakLevel = (days: number) => {
    if (days >= 100) {
      return { 
        level: 'Memory Master', 
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        icon: Trophy 
      };
    } else if (days >= 60) {
      return { 
        level: 'Photo Enthusiast', 
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        icon: Camera 
      };
    } else if (days >= 30) {
      return { 
        level: 'Memory Keeper', 
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-700',
        icon: Zap 
      };
    } else if (days >= 7) {
      return { 
        level: 'Getting Consistent', 
        color: 'from-yellow-500 to-yellow-600',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        icon: Calendar 
      };
    } else {
      return { 
        level: 'Getting Started', 
        color: 'from-gray-400 to-gray-500',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
        icon: Calendar 
      };
    }
  };

  const handleClaimReward = async (milestone?: number) => {
    const milestoneToUse = milestone || rewardDialog?.milestone;
    if (!milestoneToUse) return;
    
    setClaiming(true);
    const result = await claimMilestone(milestoneToUse);
    setClaiming(false);
    
    if (result.success) {
      triggerConfetti();
      setRewardDialog(null);
    } else {
      alert(result.error || 'Failed to claim reward');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-sm">
        <div className="animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStreakDays === 0 && totalPhotosRestored === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-sm">
        <div className="text-center">
          <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-3">
            <Camera className="h-6 w-6 text-gray-500" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Start Your Journey!</h3>
          <p className="text-sm text-gray-600">Restore your first photo to begin your streak</p>
        </div>
      </div>
    );
  }

  const streakLevel = getStreakLevel(currentStreakDays);
  const Icon = streakLevel.icon;

  // Always use 100 as max for consistent progress calculation and visual alignment
  const nextMilestone = milestonePoints.find(m => m > currentStreakDays) || 100;
  const progressPercent = Math.min((currentStreakDays / 100) * 100, 100);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5 max-w-sm">
        <div className="space-y-4">
          {/* Header - simplified */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className={`p-2.5 rounded-lg ${streakLevel.bgColor}`}>
                <Icon className={`h-5 w-5 ${streakLevel.textColor}`} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Streak</p>
                <p className={`text-sm font-semibold ${streakLevel.textColor}`}>
                  {streakLevel.level}
                </p>
              </div>
            </div>
          </div>

          {/* Main Stats - cleaner layout */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold bg-gradient-to-r ${streakLevel.color} bg-clip-text text-transparent`}>
                {currentStreakDays}
              </div>
              <p className="text-xs text-gray-400 font-medium mt-1">
                {currentStreakDays === 1 ? 'Day' : 'Days'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {totalPhotosRestored}
              </div>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Photos
              </p>
            </div>
          </div>

          {/* Integrated Progress Bar with Milestone Markers */}
          <div className="space-y-2 sm:space-y-3 pb-4 sm:pb-6">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">
                {currentStreakDays >= 100 ? 'All milestones achieved' : `Progress to ${nextMilestone} days`}
              </span>
              <span className="text-xs font-semibold text-gray-700">
                {currentStreakDays}/{currentStreakDays >= 100 ? '100+' : nextMilestone}
              </span>
            </div>
            
            {/* Responsive progress bar with evenly spaced milestones */}
            <div className="relative">
              {/* Main progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </div>
              
              {/* Milestone markers with responsive spacing */}
              <div className="absolute inset-0 flex items-center justify-between px-0">
                {milestonePoints.map((milestone, index) => {
                  const milestoneKey = `day${milestone}` as keyof typeof milestones;
                  const milestoneData = milestones[milestoneKey];
                  
                  return (
                    <button
                      key={milestone}
                      onClick={() => milestoneData?.achieved && !milestoneData?.claimed 
                        ? handleClaimReward(milestone)
                        : undefined
                      }
                      className={`w-6 h-6 rounded-full transition-all duration-200 flex items-center justify-center flex-shrink-0 ${
                        milestoneData?.claimed 
                          ? 'bg-green-500 text-white shadow-md border-2 border-white' 
                          : milestoneData?.achieved 
                            ? 'bg-green-500 text-white cursor-pointer hover:scale-125 shadow-lg border-2 border-white animate-pulse' 
                            : currentStreakDays >= milestone
                              ? 'bg-green-500 text-white shadow-sm border-2 border-white'
                              : 'bg-gray-300 text-gray-500 border-2 border-white'
                      }`}
                      disabled={!milestoneData?.achieved || milestoneData?.claimed}
                    >
                      {milestoneData?.claimed ? (
                        <Check className="w-3 h-3" />
                      ) : milestoneData?.achieved && !milestoneData?.claimed ? (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      ) : (
                        <div className="w-1.5 h-1.5 bg-current rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Milestone labels with responsive spacing */}
              <div className="absolute -bottom-6 left-0 right-0 flex justify-between items-center px-0">
                {milestonePoints.map((milestone) => (
                  <span
                    key={milestone}
                    className="text-xs text-gray-500 font-medium text-center flex-shrink-0"
                  >
                    {milestone}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Reward Dialog */}
      <Dialog open={rewardDialog?.open || false} onOpenChange={() => setRewardDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-orange-500" />
              <span>Milestone Reached!</span>
            </DialogTitle>
            <DialogDescription>
              Congratulations on {rewardDialog?.milestone} days of consistent photo restoration.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                +{rewardDialog?.reward} Credits
              </div>
              <p className="text-gray-700 font-medium">
                {rewardDialog?.milestone} Day Milestone Reward
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setRewardDialog(null)}
                className="flex-1"
              >
                Later
              </Button>
              <Button 
                onClick={handleClaimReward}
                disabled={claiming}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {claiming ? 'Claiming...' : 'Claim Credits'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}