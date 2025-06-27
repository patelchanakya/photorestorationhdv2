'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grid3X3, List, SlidersHorizontal } from 'lucide-react';

interface HistoryHeaderProps {
    totalImages: number;
    sortBy?: string;
    onSortChange?: (sort: string) => void;
    viewMode?: 'grid' | 'list';
    onViewModeChange?: (mode: 'grid' | 'list') => void;
}

export function HistoryHeader({
    totalImages,
    sortBy = 'newest',
    onSortChange,
    viewMode = 'grid',
    onViewModeChange
}: HistoryHeaderProps) {

    return (
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold">
                    {totalImages} {totalImages === 1 ? 'Photo' : 'Photos'}
                </h2>
            </div>
            
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                
                {/* Sort */}
                <Select value={sortBy} onValueChange={onSortChange}>
                    <SelectTrigger className="w-[140px]">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                </Select>
                
                {/* View Mode */}
                <div className="flex rounded-md border">
                    <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => onViewModeChange?.('grid')}
                        className="rounded-r-none"
                    >
                        <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => onViewModeChange?.('list')}
                        className="rounded-l-none border-l"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}