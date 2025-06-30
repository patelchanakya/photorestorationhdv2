import { Skeleton } from '@/components/ui/skeleton';

export function UploadAreaSkeleton() {
    return (
        <div className="border-0 shadow-xl bg-white rounded-xl p-8">
            <div className="flex items-center justify-center w-full">
                <div className="w-full max-w-2xl flex flex-col items-center px-8 py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                    <Skeleton className="h-20 w-20 rounded-full mb-6" />
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-36 mb-3" />
                    <Skeleton className="h-3 w-64" />
                </div>
            </div>
        </div>
    );
}