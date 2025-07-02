// Simple loading component - reduced from complex skeleton
export default function HistoryPageLoading() {
    return (
        <div className="flex items-center justify-center min-h-[200px]">
            <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <p className="text-gray-600 text-sm">Loading gallery...</p>
            </div>
        </div>
    );
}

/* COMMENTED OUT - Complex skeleton that causes "big loading modal" effect
import { HistoryLoading } from './components/HistoryLoading';

export default function HistoryPageLoading() {
    return (
        <div className="container mx-auto px-4 py-6">
            <div className="mb-8">
                <div className="h-9 w-80 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="h-5 w-96 bg-gray-200 animate-pulse rounded"></div>
            </div>
            
            <HistoryLoading />
        </div>
    );
}
*/