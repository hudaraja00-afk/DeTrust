'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Shield,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Wallet,
  Star,
  AlertTriangle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useAdminUsers, useUpdateUserStatus } from '@/hooks/queries/use-admin';
import { cn } from '@/lib/utils';
import type { AdminUser, AdminUserListParams } from '@/lib/api/admin';

const ROLE_OPTIONS = ['', 'FREELANCER', 'CLIENT', 'ADMIN'] as const;
const STATUS_OPTIONS = ['', 'ACTIVE', 'SUSPENDED'] as const;
type RoleOption = (typeof ROLE_OPTIONS)[number];
type StatusOption = (typeof STATUS_OPTIONS)[number];

const roleBadge: Record<string, string> = {
  FREELANCER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CLIENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ADMIN: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};

const statusBadge: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  SUSPENDED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  DEACTIVATED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export default function AdminUsersPage() {
  const [params, setParams] = useState<AdminUserListParams>({ page: 1, limit: 20 });
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const queryParams = {
    ...params,
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(params.search ? { search: params.search } : {}),
  };

  const { data, isLoading } = useAdminUsers(queryParams);
  const updateStatusMutation = useUpdateUserStatus();
  const users = data?.items ?? [];

  const handleSearch = () => {
    setParams({ ...params, page: 1, search: searchInput || undefined });
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const res = await updateStatusMutation.mutateAsync({ userId: user.id, status: newStatus });
    if (res.success) {
      toast.success(`User ${newStatus === 'SUSPENDED' ? 'suspended' : 'activated'}`);
    } else {
      toast.error(res.error?.message ?? 'Failed to update user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-dt-text">
          <Users className="h-6 w-6 text-blue-500" />
          User Management
        </h1>
        <p className="mt-1 text-sm text-dt-text-muted">
          {data ? `${data.total} users on the platform` : 'Manage all platform users'}
        </p>
      </div>

      {/* Filters */}
      <Card className="border-dt-border bg-dt-surface">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs font-medium text-dt-text-muted">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dt-text-muted" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Name, email, or wallet..."
                  className="border-dt-border pl-9"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-dt-text-muted">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setParams({ ...params, page: 1 }); }}
                className="rounded-lg border border-dt-border bg-dt-surface px-3 py-2 text-sm text-dt-text"
              >
                <option value="">All Roles</option>
                <option value="FREELANCER">Freelancer</option>
                <option value="CLIENT">Client</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-dt-text-muted">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setParams({ ...params, page: 1 }); }}
                className="rounded-lg border border-dt-border bg-dt-surface px-3 py-2 text-sm text-dt-text"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
            <Button onClick={handleSearch} className="bg-blue-600 text-white hover:bg-blue-700">
              <Search className="mr-1 h-4 w-4" /> Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center"><Spinner size="lg" /></div>
      ) : users.length === 0 ? (
        <Card className="border-dt-border bg-dt-surface">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="mb-4 h-12 w-12 text-dt-text-muted opacity-40" />
            <h3 className="text-lg font-medium text-dt-text">No users found</h3>
            <p className="mt-1 text-sm text-dt-text-muted">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dt-border bg-dt-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dt-border bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-4 py-3 text-left font-medium text-dt-text-muted">User</th>
                  <th className="px-4 py-3 text-left font-medium text-dt-text-muted">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-dt-text-muted">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-dt-text-muted">Trust</th>
                  <th className="px-4 py-3 text-left font-medium text-dt-text-muted">Activity</th>
                  <th className="px-4 py-3 text-left font-medium text-dt-text-muted">Joined</th>
                  <th className="px-4 py-3 text-right font-medium text-dt-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dt-border">
                {users.map((user: AdminUser) => {
                  const trustScore = user.freelancerProfile?.trustScore ?? user.clientProfile?.trustScore ?? 0;
                  return (
                    <tr key={user.id} className="transition hover:bg-dt-surface-alt">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-dt-text">{user.name ?? 'Unnamed'}</p>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-dt-text-muted">
                            {user.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{user.email}</span>}
                          </div>
                          {user.walletAddress && (
                            <span className="flex items-center gap-1 text-xs text-dt-text-muted">
                              <Wallet className="h-3 w-3" />
                              {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn('text-xs', roleBadge[user.role] ?? 'bg-gray-100 text-gray-600')}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn('text-xs', statusBadge[user.status] ?? 'bg-gray-100 text-gray-600')}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className={cn(
                            'text-sm font-medium',
                            trustScore >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
                            trustScore >= 50 ? 'text-blue-600 dark:text-blue-400' :
                            'text-amber-600 dark:text-amber-400'
                          )}>
                            {trustScore}
                          </span>
                          <Star className="h-3 w-3 text-amber-400" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-dt-text-muted">
                          <p>{user._count.contracts} contracts</p>
                          <p>{user._count.reviewsReceived} reviews</p>
                          {user._count.disputesInitiated > 0 && (
                            <p className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3 w-3" />
                              {user._count.disputesInitiated} disputes
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-dt-text-muted">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {user.role !== 'ADMIN' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(user)}
                            disabled={updateStatusMutation.isPending}
                            className={cn(
                              'text-xs',
                              user.status === 'ACTIVE'
                                ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30'
                                : 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/30'
                            )}
                          >
                            {user.status === 'ACTIVE' ? (
                              <><Ban className="mr-1 h-3 w-3" /> Suspend</>
                            ) : (
                              <><CheckCircle2 className="mr-1 h-3 w-3" /> Activate</>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-dt-border px-4 py-3">
              <p className="text-xs text-dt-text-muted">
                Page {data.page} of {data.totalPages} · {data.total} users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasPrev}
                  onClick={() => setParams({ ...params, page: (params.page ?? 1) - 1 })}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasNext}
                  onClick={() => setParams({ ...params, page: (params.page ?? 1) + 1 })}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
