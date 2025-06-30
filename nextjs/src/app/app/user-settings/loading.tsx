import { Skeleton } from '@/components/ui/skeleton';

export default function UserSettingsLoading() {
    return (
        <div className="space-y-6 p-6">
            <div className="space-y-2">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-5 w-80" />
            </div>

            <div className="grid gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* User Details Card */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="flex flex-col space-y-1.5 p-6">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <div className="p-6 pt-0 space-y-4">
                            <div>
                                <Skeleton className="h-4 w-16 mb-1" />
                                <Skeleton className="h-4 w-80" />
                            </div>
                            <div>
                                <Skeleton className="h-4 w-12 mb-1" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                        </div>
                    </div>

                    {/* Change Password Card */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="flex flex-col space-y-1.5 p-6">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-6 w-32" />
                            </div>
                            <Skeleton className="h-4 w-52" />
                        </div>
                        <div className="p-6 pt-0 space-y-4">
                            <div>
                                <Skeleton className="h-4 w-24 mb-1" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div>
                                <Skeleton className="h-4 w-40 mb-1" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>

                    {/* Credit Management Card */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="flex flex-col space-y-1.5 p-6">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-6 w-36" />
                            </div>
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <div className="p-6 pt-0 space-y-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </div>

                    {/* Purchase History Card */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="flex flex-col space-y-1.5 p-6">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-6 w-32" />
                            </div>
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <div className="p-6 pt-0 space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                    <div className="text-right space-y-1">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-3 w-12" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}