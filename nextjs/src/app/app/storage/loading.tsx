import { Skeleton } from '@/components/ui/skeleton';

export default function StorageLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section Skeleton */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-8 xl:gap-12">
                        <div className="flex-1 min-w-0">
                            <Skeleton className="h-8 w-80 mb-3" />
                            <Skeleton className="h-6 w-96 mb-4" />
                            <div className="mb-4 space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-10 w-32" />
                        </div>
                        <div className="flex-shrink-0">
                            <Skeleton className="h-24 w-48" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
                <div className="space-y-8">
                    {/* Upload Section Skeleton */}
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

                    {/* Photos Section Skeleton */}
                    <div className="border-0 shadow-lg bg-white rounded-xl">
                        <div className="p-6 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Skeleton className="h-6 w-32 mb-2" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Skeleton className="h-10 w-28" />
                            </div>
                        </div>
                        <div className="p-6 pt-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-6">
                                {Array.from({ length: 6 }).map((_, i) => (
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}