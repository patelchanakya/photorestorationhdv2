"use client";

import React from 'react';
import { Flame, Calendar, Trophy, Zap, Camera } from 'lucide-react';
import { useStreakData } from '@/hooks/useStreakData';

interface StreakDisplayProps {
  userId: string;
}

export default function StreakDisplay({ userId }: StreakDisplayProps) {
  const { daysSinceFirstImage, totalPhotosRestored, loading } = useStreakData(userId);

  // Determine streak level and achievement
  const getStreakLevel = (days: number, photos: number) => {
    if (days >= 365 || photos >= 500) {
      return { 
        level: 'Archive Legend', 
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-700',
        icon: Trophy 
      };
    } else if (days >= 100 || photos >= 100) {
      return { 
        level: 'Memory Master', 
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        icon: Zap 
      };
    } else if (days >= 30 || photos >= 25) {
      return { 
        level: 'Photo Enthusiast', 
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        icon: Camera 
      };
    } else if (days >= 7 || photos >= 5) {
      return { 
        level: 'Memory Keeper', 
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-700',
        icon: Flame 
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

  const streakLevel = getStreakLevel(daysSinceFirstImage, totalPhotosRestored);
  const Icon = streakLevel.icon;

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

  if (daysSinceFirstImage === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-sm">
        <div className="text-center">
          <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-3">
            <Camera className="h-6 w-6 text-gray-500" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Start Your Journey!</h3>
          <p className="text-sm text-gray-600">Restore your first photo to begin tracking your streak</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-sm">
      <div className="space-y-4">
        {/* Header with Level Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${streakLevel.bgColor}`}>
              <Icon className={`h-6 w-6 ${streakLevel.textColor}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Streak Level</p>
              <p className={`text-sm font-bold ${streakLevel.textColor}`}>
                {streakLevel.level}
              </p>
            </div>
          </div>
          {daysSinceFirstImage >= 7 && (
            <div className="text-right">
              <Flame className="h-5 w-5 text-orange-500 mx-auto" />
              <span className="text-xs text-orange-600 font-medium">Hot!</span>
            </div>
          )}
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold bg-gradient-to-r ${streakLevel.color} bg-clip-text text-transparent`}>
              {daysSinceFirstImage}
            </div>
            <p className="text-xs text-gray-500 font-medium">
              {daysSinceFirstImage === 1 ? 'Day' : 'Days'} Active
            </p>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold bg-gradient-to-r ${streakLevel.color} bg-clip-text text-transparent`}>
              {totalPhotosRestored}
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Photos Restored
            </p>
          </div>
        </div>

        {/* Progress to Next Level */}
        {streakLevel.level !== 'Archive Legend' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progress to next level</span>
              <span>
                {streakLevel.level === 'Getting Started' && `${Math.min(daysSinceFirstImage, 7)}/7 days`}
                {streakLevel.level === 'Memory Keeper' && `${Math.min(daysSinceFirstImage, 30)}/30 days`}
                {streakLevel.level === 'Photo Enthusiast' && `${Math.min(daysSinceFirstImage, 100)}/100 days`}
                {streakLevel.level === 'Memory Master' && `${Math.min(daysSinceFirstImage, 365)}/365 days`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`bg-gradient-to-r ${streakLevel.color} h-2 rounded-full transition-all duration-500`}
                style={{
                  width: `${
                    streakLevel.level === 'Getting Started' ? Math.min((daysSinceFirstImage / 7) * 100, 100) :
                    streakLevel.level === 'Memory Keeper' ? Math.min((daysSinceFirstImage / 30) * 100, 100) :
                    streakLevel.level === 'Photo Enthusiast' ? Math.min((daysSinceFirstImage / 100) * 100, 100) :
                    streakLevel.level === 'Memory Master' ? Math.min((daysSinceFirstImage / 365) * 100, 100) : 100
                  }%`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}