"use client";

import React from 'react';
import { Coins, Plus } from 'lucide-react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// KEEP BOTH imports here, at the top:
import UserStatsDisplay from '@/components/UserStatsDisplay';
import HowItWorksTour from '@/components/HowItWorksTour';

export default function ProminentCreditsDisplay() {
  const { credits, optimisticCredits, isPending } = useGlobal();
  const displayCredits = optimisticCredits ?? credits ?? 0;
  const isLowCredits = displayCredits <= 5;

  return (
                <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-full ${
                        isLowCredits ? 'bg-red-100' : 'bg-orange-100'
                    }`}>
                        <Coins className={`h-6 w-6 ${
                            isLowCredits ? 'text-red-600' : 'text-orange-600'
                        }`} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Credits</p>
                        <div className="flex items-center space-x-2">
                            {isPending ? (
                                <span className="text-2xl font-bold text-gray-400 animate-pulse">
                                    {displayCredits}
                                </span>
                            ) : (
                                <span className={`text-2xl font-bold ${
                                    isLowCredits ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                    {displayCredits}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                
                <Link href="/app/user-settings" className="w-full sm:w-auto">
                    <Button 
                        size="sm" 
                        className={`w-full sm:w-auto ${
                            isLowCredits 
                                ? 'bg-red-600 hover:bg-red-700' 
                                : 'bg-orange-600 hover:bg-orange-700'
                        } text-white shadow-md`}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        <span>Buy More</span>
                    </Button>
                </Link>
            </div>
            
            {isPending && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-blue-600 flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-2"></div>
                        Updating credits...
                    </div>
                </div>
            )}
        </div>
    );
}