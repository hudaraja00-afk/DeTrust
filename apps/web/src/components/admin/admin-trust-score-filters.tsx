'use client';

import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminTrustScoreListParams } from '@/lib/api/admin';

interface AdminTrustScoreFiltersProps {
  filters: AdminTrustScoreListParams;
  onFiltersChange: (filters: AdminTrustScoreListParams) => void;
}

export function AdminTrustScoreFilters({ filters, onFiltersChange }: AdminTrustScoreFiltersProps) {
  const update = (patch: Partial<AdminTrustScoreListParams>) =>
    onFiltersChange({ ...filters, ...patch, page: 1 });

  const hasActiveFilters = filters.search || filters.role !== 'all' || filters.eligible ||
    filters.minScore !== undefined || filters.maxScore !== undefined;

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Search */}
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dt-text-muted" />
        <Input
          placeholder="Search by name or email…"
          value={filters.search ?? ''}
          onChange={(e) => update({ search: e.target.value || undefined })}
          className="pl-9"
        />
      </div>

      {/* Role */}
      <select
        className="h-10 rounded-md border border-dt-border bg-dt-surface px-3 text-sm text-dt-text"
        value={filters.role ?? 'all'}
        onChange={(e) => update({ role: e.target.value as AdminTrustScoreListParams['role'] })}
      >
        <option value="all">All Roles</option>
        <option value="FREELANCER">Freelancer</option>
        <option value="CLIENT">Client</option>
      </select>

      {/* Eligibility */}
      <select
        className="h-10 rounded-md border border-dt-border bg-dt-surface px-3 text-sm text-dt-text"
        value={filters.eligible ?? ''}
        onChange={(e) => update({ eligible: e.target.value as 'true' | 'false' | undefined || undefined })}
      >
        <option value="">All Users</option>
        <option value="true">Eligible Only</option>
        <option value="false">Ineligible Only</option>
      </select>

      {/* Min Score */}
      <Input
        type="number"
        placeholder="Min Score"
        min={0}
        max={100}
        value={filters.minScore ?? ''}
        onChange={(e) => update({ minScore: e.target.value ? Number(e.target.value) : undefined })}
        className="w-24"
      />

      {/* Max Score */}
      <Input
        type="number"
        placeholder="Max Score"
        min={0}
        max={100}
        value={filters.maxScore ?? ''}
        onChange={(e) => update({ maxScore: e.target.value ? Number(e.target.value) : undefined })}
        className="w-24"
      />

      {/* Sort */}
      <select
        className="h-10 rounded-md border border-dt-border bg-dt-surface px-3 text-sm text-dt-text"
        value={`${filters.sort ?? 'trustScore'}-${filters.order ?? 'desc'}`}
        onChange={(e) => {
          const [sort, order] = e.target.value.split('-') as [AdminTrustScoreListParams['sort'], AdminTrustScoreListParams['order']];
          update({ sort, order });
        }}
      >
        <option value="trustScore-desc">Score: High → Low</option>
        <option value="trustScore-asc">Score: Low → High</option>
        <option value="name-asc">Name: A → Z</option>
        <option value="name-desc">Name: Z → A</option>
        <option value="createdAt-desc">Newest First</option>
        <option value="completedContracts-desc">Most Contracts</option>
      </select>

      {/* Clear */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFiltersChange({ page: 1, limit: 20, sort: 'trustScore', order: 'desc', role: 'all' })}
        >
          <X className="mr-1 h-4 w-4" /> Clear
        </Button>
      )}
    </div>
  );
}
