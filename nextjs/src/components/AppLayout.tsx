"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {
    ChevronDown,
    LogOut,
    Key,
    ImageIcon,
} from 'lucide-react';
import { useGlobal } from "@/lib/context/GlobalContext";
import { createSPASassClient } from "@/lib/supabase/client";
import NavigationLoadingIndicator from './NavigationLoadingIndicator';
// import PromoBanner from './PromoBanner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [isUserDropdownOpen, setUserDropdownOpen] = useState(false);
    const router = useRouter();
    const { user } = useGlobal();

    const handleLogout = async () => {
        try {
            const client = await createSPASassClient();
            await client.logout();
            // Small delay to prevent error flashes during cleanup
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };
    const handleChangePassword = async () => {
        router.push('/app/user-settings')
    };

    const getInitials = (email: string) => {
        const parts = email.split('@')[0].split(/[._-]/);
        return parts.length > 1
            ? (parts[0][0] + parts[1][0]).toUpperCase()
            : parts[0].slice(0, 2).toUpperCase();
    };


    return (
        <div className="min-h-screen bg-gray-100">
            <NavigationLoadingIndicator />


            <div className="">
                <div className="sticky top-0 z-10 flex items-center justify-between h-16 bg-white shadow-sm px-2 sm:px-4">
                    <div className="flex items-center space-x-3">
                        
                        {/* Logo - now visible on all screen sizes */}
                        <Link 
                            href="/app/storage" 
                            className="flex items-center space-x-2"
                            prefetch={false}
                        >
                            <div className="p-1.5 bg-orange-100 rounded-lg">
                                <ImageIcon className="h-5 w-5 text-orange-600" />
                            </div>
                            <span suppressHydrationWarning className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-orange-600 tracking-tight whitespace-nowrap">
                                Photo Restoration HD
                            </span>
                        </Link>
                    </div>


                    <div className="relative">
                        <button
                            onClick={() => setUserDropdownOpen(!isUserDropdownOpen)}
                            className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
                        >
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                <span className="text-orange-700 font-medium">
                                    {user ? getInitials(user.email) : '??'}
                                </span>
                            </div>
                            <span className="hidden sm:inline">{user?.email || 'Loading...'}</span>
                            <ChevronDown className="h-4 w-4"/>
                        </button>

                        {isUserDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 sm:w-64 bg-white rounded-md shadow-lg border">
                                <div className="p-2 border-b border-gray-100">
                                    <p className="text-xs text-gray-500">Signed in as</p>
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {user?.email}
                                    </p>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            setUserDropdownOpen(false);
                                            handleChangePassword()
                                        }}
                                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <Key className="mr-3 h-4 w-4 text-gray-400"/>
                                        Change Password
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setUserDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        <LogOut className="mr-3 h-4 w-4 text-red-400"/>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* <PromoBanner /> */}

                <main className="p-4">
                    {children}
                </main>
            </div>
        </div>
    );
}