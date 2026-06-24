'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, Star, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GetUserReviewsParams } from '@/lib/api/review';

interface ReviewFiltersProps {
  filters: GetUserReviewsParams;
  onFiltersChange: (filters: GetUserReviewsParams) => void;
}

const RATING_OPTIONS = [
  { label: '5 Stars', value: 5 },
  { label: '4+ Stars', value: 4 },
  { label: '3+ Stars', value: 3 },
  { label: '2+ Stars', value: 2 },
  { label: '1+ Stars', value: 1 },
];

const SORT_OPTIONS = [
  { label: 'Newest First', sort: 'createdAt' as const, order: 'desc' as const },
  { label: 'Oldest First', sort: 'createdAt' as const, order: 'asc' as const },
  { label: 'Highest Rated', sort: 'overallRating' as const, order: 'desc' as const },
  { label: 'Lowest Rated', sort: 'overallRating' as const, order: 'asc' as const },
];

export function ReviewFilters({ filters, onFiltersChange }: ReviewFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = !!(filters.minRating || filters.search || filters.sort !== 'createdAt');

  const handleSearch = () => {
    onFiltersChange({ ...filters, search: searchInput || undefined, page: 1 });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    onFiltersChange({ role: filters.role, page: 1, limit: filters.limit });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dt-text-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search reviews..."
            className="w-full rounded-lg border border-dt-border bg-dt-surface py-2 pl-9 pr-3 text-sm text-dt-text placeholder:text-dt-text-muted/50 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleSearch} className="border-dt-border">
          Search
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={`gap-1 border-dt-border ${hasActiveFilters ? 'border-emerald-300 text-emerald-600' : ''}`}
        >
          <SlidersHorizontal className="h-3 w-3" />
          Filters
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-1 text-dt-text-muted">
            <X className="h-3 w-3" /> Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-dt-border bg-dt-surface-alt p-3">
          {/* Rating Filter */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-dt-text-muted">Min Rating</span>
            <div className="flex gap-1">
              {RATING_OPTIONS.map(({ label, value }) => (
                <Badge
                  key={value}
                  variant={filters.minRating === value ? 'default' : 'secondary'}
                  className={`cursor-pointer transition-colors ${
                    filters.minRating === value
                      ? 'bg-emerald-500 text-white'
                      : 'bg-dt-surface text-dt-text-muted hover:bg-dt-surface-alt'
                  }`}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      minRating: filters.minRating === value ? undefined : value,
                      page: 1,
                    })
                  }
                >
                  <Star className="mr-0.5 h-3 w-3 fill-current" />{label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-dt-text-muted">Sort by</span>
            <div className="flex gap-1">
              {SORT_OPTIONS.map((opt) => {
                const active = filters.sort === opt.sort && filters.order === opt.order;
                return (
                  <Badge
                    key={`${opt.sort}-${opt.order}`}
                    variant={active ? 'default' : 'secondary'}
                    className={`cursor-pointer transition-colors ${
                      active
                        ? 'bg-emerald-500 text-white'
                        : 'bg-dt-surface text-dt-text-muted hover:bg-dt-surface-alt'
                    }`}
                    onClick={() =>
                      onFiltersChange({ ...filters, sort: opt.sort, order: opt.order, page: 1 })
                    }
                  >
                    {opt.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
