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