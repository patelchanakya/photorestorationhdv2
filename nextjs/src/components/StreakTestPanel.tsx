'use client'

import React, { useState } from 'react';
import { Calendar, Plus, RotateCcw, Target, Database, Zap } from 'lucide-react';
import { createSPASassClient } from '@/lib/supabase/client';
import { useGlobal } from '@/lib/context/GlobalContext';
import { useStreakData } from '@/hooks/useStreakData';

export default function StreakTestPanel() {
    // Only show if streak testing is enabled in environment
    const isStreakTestingEnabled = process.env.NEXT_PUBLIC_STREAK_TESTING === 'true';
    const { user } = useGlobal();
    const { refreshStreak } = useStreakData(user?.id);
    const [isWorking, setIsWorking] = useState(false);
    const [status, setStatus] = useState<string>('');

    // Don't render anything if testing is not enabled
    if (!isStreakTestingEnabled || !user?.id) {
        return null;
    }

    const showStatus = (message: string, isError = false) => {
        setStatus(message);
        setTimeout(() => setStatus(''), 3000);
    };

    const addTestPhoto = async (daysAgo: number) => {
        try {
            setIsWorking(true);
            const supabase = await createSPASassClient();
            
            // Calculate date X days ago
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            
            // Add a test saved image entry
            const { error } = await supabase.getSupabaseClient()
                .from('saved_images')
                .insert({
                    user_id: user.id,
                    original_url: `test-original-${daysAgo}-days-ago.jpg`,
                    edited_url: `test-restored-${daysAgo}-days-ago.jpg`,
                    prompt: `TEST_STREAK_${daysAgo}_DAYS_AGO`,
                    created_at: date.toISOString()
                });

            if (error) throw error;
            showStatus(`✅ Added test photo from ${daysAgo} days ago`);
            
            // Refresh streak display
            await refreshStreak();
        } catch (error) {
            console.error('Error adding test photo:', error);
            showStatus(`❌ Failed to add test photo: ${error}`, true);
        } finally {
            setIsWorking(false);
        }
    };

    const addBulkPhotos = async (count: number) => {
        try {
            setIsWorking(true);
            const supabase = await createSPASassClient();
            
            // Create array of test photos spread over recent days
            const photos = [];
            for (let i = 0; i < count; i++) {
                const daysAgo = Math.floor(i / 3); // Spread photos over days
                const date = new Date();
                date.setDate(date.getDate() - daysAgo);
                date.setHours(date.getHours() - (i % 3) * 2); // Different times same day
                
                photos.push({
                    user_id: user.id,
                    original_url: `test-bulk-${i}.jpg`,
                    edited_url: `test-bulk-restored-${i}.jpg`,
                    prompt: `TEST_STREAK_BULK_${i}`,
                    created_at: date.toISOString()
                });
            }
            
            const { error } = await supabase.getSupabaseClient()
                .from('saved_images')
                .insert(photos);

            if (error) throw error;
            showStatus(`✅ Added ${count} test photos`);
            
            // Refresh streak display
            await refreshStreak();
        } catch (error) {
            console.error('Error adding bulk photos:', error);
            showStatus(`❌ Failed to add bulk photos: ${error}`, true);
        } finally {
            setIsWorking(false);
        }
    };

    const resetStreak = async () => {
        try {
            setIsWorking(true);
            const supabase = await createSPASassClient();
            
            // Delete all test entries for this user (entries with TEST_STREAK in prompt)
            const { error } = await supabase.getSupabaseClient()
                .from('saved_images')
                .delete()
                .eq('user_id', user.id)
                .like('prompt', 'TEST_STREAK%'); // Only delete test entries

            if (error) throw error;
            showStatus('✅ Reset all test streak data');
            
            // Refresh streak display
            await refreshStreak();
        } catch (error) {
            console.error('Error resetting streak:', error);
            showStatus(`❌ Failed to reset: ${error}`, true);
        } finally {
            setIsWorking(false);
        }
    };

    const setCustomStreak = async (days: number) => {
        try {
            setIsWorking(true);
            const supabase = await createSPASassClient();
            
            // First clear existing test data
            await supabase.getSupabaseClient()
                .from('saved_images')
                .delete()
                .eq('user_id', user.id)
                .like('prompt', 'TEST_STREAK%');
            
            // Add one photo from X days ago to set the streak
            const date = new Date();
            date.setDate(date.getDate() - days);
            
            const { error } = await supabase.getSupabaseClient()
                .from('saved_images')
                .insert({
                    user_id: user.id,
                    original_url: `test-streak-${days}.jpg`,
                    edited_url: `test-streak-restored-${days}.jpg`,
                    prompt: `TEST_STREAK_CUSTOM_${days}_DAYS`,
                    created_at: date.toISOString()
                });

            if (error) throw error;
            showStatus(`✅ Set custom streak to ${days} days`);
            
            // Refresh streak display
            await refreshStreak();
        } catch (error) {
            console.error('Error setting custom streak:', error);
            showStatus(`❌ Failed to set custom streak: ${error}`, true);
        } finally {
            setIsWorking(false);
        }
    };

    return (
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Streak Test Panel</h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    🧪 TESTING MODE
                </span>
            </div>
            
            {status && (
                <div className={`text-sm p-2 rounded mb-3 ${
                    status.includes('❌') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                    {status}
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {/* Add Individual Photos */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Add Photos</h4>
                    <button
                        onClick={() => addTestPhoto(0)}
                        disabled={isWorking}
                        className="w-full flex items-center justify-center px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 text-xs"
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Today
                    </button>
                    <button
                        onClick={() => addTestPhoto(7)}
                        disabled={isWorking}
                        className="w-full flex items-center justify-center px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 text-xs"
                    >
                        <Calendar className="h-3 w-3 mr-1" />
                        7 Days Ago
                    </button>
                    <button
                        onClick={() => addTestPhoto(30)}
                        disabled={isWorking}
                        className="w-full flex items-center justify-center px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 text-xs"
                    >
                        <Calendar className="h-3 w-3 mr-1" />
                        30 Days Ago
                    </button>
                </div>

                {/* Bulk Operations */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Bulk Add</h4>
                    <button
                        onClick={() => addBulkPhotos(5)}
                        disabled={isWorking}
                        className="w-full flex items-center justify-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-xs"
                    >
                        <Database className="h-3 w-3 mr-1" />
                        5 Photos
                    </button>
                    <button
                        onClick={() => addBulkPhotos(25)}
                        disabled={isWorking}
                        className="w-full flex items-center justify-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-xs"
                    >
                        <Database className="h-3 w-3 mr-1" />
                        25 Photos
                    </button>
                    <button
                        onClick={() => addBulkPhotos(100)}
                        disabled={isWorking}
                        className="w-full flex items-center justify-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-xs"
                    >
                        <Zap className="h-3 w-3 mr-1" />
                        100 Photos
                    </button>
                </div>

                {/* Custom Streaks */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Set Streak</h4>
                    <button
                        onClick={() => setCustomStreak(10)}
                        disabled={isWorking}
                        className="w-full flex items-center justify-center px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 text-xs"
                    >
                        <Target className="h-3 w-3 mr-1" />
                        10 Days
                    </button>
                    <button
                        onClick={() => setCustomStreak(50)}
                        disabled={isWorking}
                        className="w-full flex items-center justify-center px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 text-xs"
                    >
                        <Target className="h-3 w-3 mr-1" />
                        50 Days
                    </button>
                    <button
                        onClick={() => setCustomStreak(200)}
                        disabled={isWorking}
                        className="w-full flex items-center justify-center px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 text-xs"
                    >
                        <Target className="h-3 w-3 mr-1" />
                        200 Days
                    </button>
                </div>

                {/* Reset */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Reset</h4>
                    <button
                        onClick={resetStreak}
                        disabled={isWorking}
                        className="w-full flex items-center justify-center px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 text-xs"
                    >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Clear All Test Data
                    </button>
                </div>
            </div>
            
            <p className="text-xs text-gray-500">
                Test different streak scenarios and achievement levels. Only deletes entries with TEST_STREAK in prompt (test entries).
                <br />
                <strong>To disable:</strong> Remove <code>NEXT_PUBLIC_STREAK_TESTING=true</code> from your .env.local
            </p>
        </div>
    );
}