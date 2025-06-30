import { Skeleton } from '@/components/ui/skeleton';

interface ImageGridSkeletonProps {
    count?: number;
    columns?: number;
}

export function ImageGridSkeleton({ count = 6, columns = 3 }: ImageGridSkeletonProps) {
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns} xl:grid-cols-${columns} gap-3 sm:gap-6`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <Skeleton className="aspect-square w-full" />
                    <div className="p-4 space-y-3">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <div className="flex gap-2">
                                <Skeleton className="h-10 flex-1" />
                                <Skeleton className="h-10 flex-1" />
                                <Skeleton className="h-10 flex-1" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}