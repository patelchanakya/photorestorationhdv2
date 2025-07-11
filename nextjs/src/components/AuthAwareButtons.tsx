"use client";
import { useState, useEffect } from 'react';
import { createSPASassClient } from '@/lib/supabase/client';
import { ArrowRight, ChevronRight } from 'lucide-react';
import Link from "next/link";

export default function AuthAwareButtons({ variant = 'primary' }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const supabase = await createSPASassClient();
                const { data: { user } } = await supabase.getSupabaseClient().auth.getUser();
                setIsAuthenticated(!!user);
            } catch (error) {
                console.error('Error checking auth status:', error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (loading) {
        return null;
    }

    // Navigation buttons for the header
    if (variant === 'nav') {
        return isAuthenticated ? (
            <Link
                href="/app/storage"
                className="bg-primary-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
            >
                <span className="hidden sm:inline">Go to App</span>
                <span className="sm:hidden">App</span>
            </Link>
        ) : (
            <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 text-sm sm:text-base px-2 py-1">
                Login
            </Link>
        );
    }

    // Primary buttons for the hero section
    return isAuthenticated ? (
        <Link
            href="/app/storage"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
        >
            Go to App
            <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
    ) : (
        <>
            <Link
                href="/auth/register"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
            >
                Start for Free
                <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
                href="#features"
                className="inline-flex items-center px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
                Learn More
                <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
        </>
    );
}