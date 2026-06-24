'use client';

import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminReviewListParams } from '@/lib/api/admin';

interface AdminReviewFiltersProps {
  filters: AdminReviewListParams;
  onFiltersChange: (filters: AdminReviewListParams) => void;
}

export function AdminReviewFilters({ filters, onFiltersChange }: AdminReviewFiltersProps) {
  const update = (partial: Partial<AdminReviewListParams>) =>
    onFiltersChange({ ...filters, ...partial, page: 1 });

  const hasActiveFilters = !!(
    filters.search || filters.minRating || filters.maxRating || filters.dateFrom ||
    filters.dateTo || filters.hasBlockchain || filters.sort !== 'createdAt'
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Search */}
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dt-text-muted" />
        <Input
          placeholder="Search comments..."
          value={filters.search ?? ''}
          onChange={(e) => update({ search: e.target.value || undefined })}
          className="pl-10"
        />
      </div>

      {/* Min Rating */}
      <div className="w-28">
        <label className="mb-1 block text-xs font-medium text-dt-text-muted">Min Rating</label>
        <select
          value={filters.minRating ?? ''}
          onChange={(e) => update({ minRating: e.target.value ? Number(e.target.value) : undefined })}
          className="w-full rounded-md border border-dt-border bg-dt-surface px-3 py-2 text-sm text-dt-text"
        >
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>{r}+ ★</option>
          ))}
        </select>
      </div>

      {/* Max Rating */}
      <div className="w-28">
        <label className="mb-1 block text-xs font-medium text-dt-text-muted">Max Rating</label>
        <select
          value={filters.maxRating ?? ''}
          onChange={(e) => update({ maxRating: e.target.value ? Number(e.target.value) : undefined })}
          className="w-full rounded-md border border-dt-border bg-dt-surface px-3 py-2 text-sm text-dt-text"
        >
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>≤ {r} ★</option>
          ))}
        </select>
      </div>

      {/* Blockchain Status */}
      <div className="w-36">
        <label className="mb-1 block text-xs font-medium text-dt-text-muted">On-Chain</label>
        <select
          value={filters.hasBlockchain ?? ''}
          onChange={(e) => update({ hasBlockchain: (e.target.value || undefined) as 'true' | 'false' | undefined })}
          className="w-full rounded-md border border-dt-border bg-dt-surface px-3 py-2 text-sm text-dt-text"
        >
          <option value="">All</option>
          <option value="true">On-chain ✅</option>
          <option value="false">Pending ⏳</option>
        </select>
      </div>

      {/* Sort */}
      <div className="w-36">
        <label className="mb-1 block text-xs font-medium text-dt-text-muted">Sort</label>
        <select
          value={`${filters.sort ?? 'createdAt'}-${filters.order ?? 'desc'}`}
          onChange={(e) => {
            const [sort, order] = e.target.value.split('-');
            update({ sort, order });
          }}
          className="w-full rounded-md border border-dt-border bg-dt-surface px-3 py-2 text-sm text-dt-text"
        >
          <option value="createdAt-desc">Newest</option>
          <option value="createdAt-asc">Oldest</option>
          <option value="overallRating-desc">Highest Rated</option>
          <option value="overallRating-asc">Lowest Rated</option>
        </select>
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFiltersChange({ page: 1, limit: 20, sort: 'createdAt', order: 'desc' })}
          className="text-dt-text-muted"
        >
          <X className="mr-1 h-3 w-3" /> Clear
        </Button>
      )}
    </div>
  );
}
