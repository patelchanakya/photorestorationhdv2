'use client'

import React from 'react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Minus, Plus, RefreshCw } from 'lucide-react';

export default function CreditTestPanel() {
    // Only show if credits testing is enabled in environment
    const isCreditsTestingEnabled = process.env.NEXT_PUBLIC_CREDITS_TESTING === 'true';
    
    const { 
        optimisticCredits, 
        credits, 
        deductCreditsOptimistic, 
        refundCreditsOptimistic, 
        refetchCredits,
        isPending 
    } = useGlobal();

    // Don't render anything if testing is not enabled
    if (!isCreditsTestingEnabled) {
        return null;
    }

    const handleDeduct = async () => {
        const success = await deductCreditsOptimistic(1);
        if (!success) {
            alert('Failed to deduct credits!');
        }
    };

    const handleRefund = async () => {
        const success = await refundCreditsOptimistic(1);
        if (!success) {
            alert('Failed to refund credits!');
        }
    };

    return (
        <div className="bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Credit Test Panel</h3>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    🧪 TESTING MODE
                </span>
            </div>
            
            <div className="flex items-center space-x-4 mb-3">
                <div className="text-sm text-gray-600">
                    Actual: <span className="font-medium">{credits ?? 0}</span>
                </div>
                <div className="text-sm text-gray-600">
                    Optimistic: <span className="font-medium">{optimisticCredits ?? 0}</span>
                </div>
                {isPending && (
                    <div className="text-sm text-blue-600 flex items-center">
                        <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                        Processing...
                    </div>
                )}
            </div>
            
            <div className="flex space-x-2">
                <button
                    onClick={handleDeduct}
                    disabled={isPending || (optimisticCredits ?? 0) <= 0}
                    className="flex items-center px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Minus className="h-4 w-4 mr-1" />
                    Deduct 1
                </button>
                
                <button
                    onClick={handleRefund}
                    disabled={isPending}
                    className="flex items-center px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Refund 1
                </button>
                
                <button
                    onClick={refetchCredits}
                    disabled={isPending}
                    className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
                Use these buttons to test optimistic credit updates. Credits will update instantly in the header.
                <br />
                <strong>To disable:</strong> Remove <code>NEXT_PUBLIC_CREDITS_TESTING=true</code> from your .env.local
            </p>
        </div>
    );
}