"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to create page since homepage is no longer needed
        router.replace('/app/storage');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
    );
}