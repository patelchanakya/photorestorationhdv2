import { Suspense } from 'react';
import { getSavedImages } from '@/app/actions/jobs';
import { createSSRClient } from '@/lib/supabase/server';
import { HistoryGrid } from './components/HistoryGrid';
import { HistoryLoading } from './components/HistoryLoading';

async function getCurrentUser() {
    const supabase = await createSSRClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

async function HistoryContent() {
    const user = await getCurrentUser();
    
    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Please sign in to view your history.</p>
            </div>
        );
    }

    const savedImages = await getSavedImages(user.id);

    return (
        <div className="space-y-6">
            <HistoryGrid images={savedImages} />
        </div>
    );
}

export default function HistoryPage() {
    return (
        <div className="container mx-auto px-4 py-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Photo Restoration History</h1>
                <p className="text-muted-foreground mt-2">
                    View and manage all your restored photos
                </p>
            </div>
            
            <Suspense fallback={<HistoryLoading />}>
                <HistoryContent />
            </Suspense>
        </div>
    );
}