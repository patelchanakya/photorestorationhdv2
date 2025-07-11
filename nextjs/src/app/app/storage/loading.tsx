// Simple loading component - reduced from complex skeleton
export default function StorageLoading() {
    return (
        <div className="flex items-center justify-center min-h-[200px]">
            <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <p className="text-gray-600 text-sm">Loading...</p>
            </div>
        </div>
    );
}

/* COMMENTED OUT - Complex skeleton that causes "big loading modal" effect
import { Skeleton } from '@/components/ui/skeleton';

export default function StorageLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            // ... 77 lines of complex skeleton layout
        </div>
    );
}
*/