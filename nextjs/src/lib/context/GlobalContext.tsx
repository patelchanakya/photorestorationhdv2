// src/lib/context/GlobalContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useOptimistic, useTransition, useCallback } from 'react';
import { createSPASassClient } from '@/lib/supabase/client';
import { getCredits, deductCredits, refundCredits } from '@/app/actions/credits';
import { usePostHog } from 'posthog-js/react';
import { apiCache, createCacheKey } from '@/lib/utils/cache';


type User = {
    email: string;
    id: string;
    registered_at: Date;
};

type CreditAction = 
  | { type: 'deduct'; amount: number }
  | { type: 'refund'; amount: number }
  | { type: 'set'; amount: number };

interface GlobalContextType {
    loading: boolean;
    user: User | null;
    credits: number | null;
    optimisticCredits: number | null;
    creditsLoading: boolean;
    refetchCredits: () => Promise<void>;
    deductCreditsOptimistic: (amount: number) => Promise<boolean>;
    refundCreditsOptimistic: (amount: number) => Promise<boolean>;
    triggerCreditUpdate: (newCredits: number) => void;
    isPending: boolean;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [credits, setCredits] = useState<number | null>(null);
    const [creditsLoading, setCreditsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const posthog = usePostHog();

    // Optimistic credits for instant UI updates
    const [optimisticCredits, updateOptimisticCredits] = useOptimistic(
        credits,
        (currentCredits: number | null, action: CreditAction): number | null => {
            if (currentCredits === null) return null;
            
            switch (action.type) {
                case 'deduct':
                    return Math.max(0, currentCredits - action.amount);
                case 'refund':
                    return currentCredits + action.amount;
                case 'set':
                    return action.amount;
                default:
                    return currentCredits;
            }
        }
    );

    const fetchCredits = useCallback(async (userId: string) => {
        try {
            setCreditsLoading(true);
            // Cache credits for 2 seconds to reduce redundant calls
            const cacheKey = createCacheKey('credits', userId);
            const result = await apiCache.get(cacheKey, () => getCredits(userId), 2000);
            
            if (result.success && result.credits !== undefined) {
                setCredits(result.credits);
                // Remove redundant optimistic update to prevent conflicts
                // The optimistic state will naturally sync with the real credits state
            } else {
                console.error('Error fetching credits:', result.error);
            }
        } catch (error) {
            console.error('Credits fetch error:', error);
        } finally {
            setCreditsLoading(false);
        }
    }, []);

    const deductCreditsOptimistic = async (amount: number): Promise<boolean> => {
        if (!user?.id) return false;
        
        return new Promise((resolve) => {
            startTransition(async () => {
                try {
                    // Optimistic update inside transition
                    updateOptimisticCredits({ type: 'deduct', amount });
                    
                    const result = await deductCredits(user.id, amount);
                    if (result.success && result.credits !== undefined) {
                        // Invalidate credits cache since we have fresh data
                        const cacheKey = createCacheKey('credits', user.id);
                        apiCache.invalidate(cacheKey);
                        
                        // Update real credits state - this will sync with optimistic
                        setCredits(result.credits);
                        // Force optimistic state to match real state to prevent conflicts
                        updateOptimisticCredits({ type: 'set', amount: result.credits });
                        resolve(true);
                    } else {
                        // Rollback optimistic update on failure
                        updateOptimisticCredits({ type: 'refund', amount });
                        // Only log non-insufficient credit errors to avoid console spam
                        if (!result.error?.includes('You need') && !result.error?.includes('Insufficient')) {
                            console.error('Error deducting credits:', result.error);
                        }
                        resolve(false);
                    }
                } catch (error) {
                    // Rollback optimistic update on error
                    updateOptimisticCredits({ type: 'refund', amount });
                    console.error('Credits deduction error:', error);
                    resolve(false);
                }
            });
        });
    };

    const refundCreditsOptimistic = async (amount: number): Promise<boolean> => {
        if (!user?.id) return false;
        
        return new Promise((resolve) => {
            startTransition(async () => {
                try {
                    // Optimistic update inside transition
                    updateOptimisticCredits({ type: 'refund', amount });
                    
                    const result = await refundCredits(user.id, amount);
                    if (result.success && result.credits !== undefined) {
                        // Invalidate credits cache since we have fresh data
                        const cacheKey = createCacheKey('credits', user.id);
                        apiCache.invalidate(cacheKey);
                        
                        // Update real credits state - this will sync with optimistic
                        setCredits(result.credits);
                        // Force optimistic state to match real state to prevent conflicts
                        updateOptimisticCredits({ type: 'set', amount: result.credits });
                        resolve(true);
                    } else {
                        // Rollback optimistic update on failure
                        updateOptimisticCredits({ type: 'deduct', amount });
                        console.error('Error refunding credits:', result.error);
                        resolve(false);
                    }
                } catch (error) {
                    // Rollback optimistic update on error
                    updateOptimisticCredits({ type: 'deduct', amount });
                    console.error('Credits refund error:', error);
                    resolve(false);
                }
            });
        });
    };

    const refetchCredits = async () => {
        if (user?.id) {
            await fetchCredits(user.id);
        }
    };

    const triggerCreditUpdate = (newCredits: number) => {
        startTransition(() => {
            setCredits(newCredits);
            updateOptimisticCredits({ type: 'set', amount: newCredits });
        });
    };

    useEffect(() => {
        async function loadData() {
            try {
                const supabase = await createSPASassClient();
                const client = supabase.getSupabaseClient();

                // Get user data
                const { data: { user } } = await client.auth.getUser();
                if (user) {
                    const userData = {
                        email: user.email!,
                        id: user.id,
                        registered_at: new Date(user.created_at)
                    };
                    setUser(userData);
                    
                    // Identify user in PostHog for analytics
                    if (posthog) {
                        posthog.identify(user.id, {
                            email: user.email,
                            registration_date: user.created_at,
                            user_id: user.id
                        });
                    }
                    
                    // Fetch credits for this user
                    await fetchCredits(user.id);
                }
                // If no user, that's fine - they're just not authenticated
                // Leave user as null and continue

            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [fetchCredits, posthog]);

    // Update PostHog user properties when credits change
    useEffect(() => {
        if (posthog && user && credits !== null) {
            posthog.setPersonProperties({
                credit_balance: credits,
                account_age_days: Math.floor((Date.now() - user.registered_at.getTime()) / (1000 * 60 * 60 * 24))
            });
        }
    }, [posthog, user, credits]);

    return (
        <GlobalContext.Provider value={{ 
            loading, 
            user, 
            credits, 
            optimisticCredits,
            creditsLoading, 
            refetchCredits,
            deductCreditsOptimistic,
            refundCreditsOptimistic,
            triggerCreditUpdate,
            isPending
        }}>
            {children}
        </GlobalContext.Provider>
    );
}

export const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (context === undefined) {
        throw new Error('useGlobal must be used within a GlobalProvider');
    }
    return context;
};