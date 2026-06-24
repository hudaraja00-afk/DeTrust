import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminApi,
  type AdminUserListParams,
  type AdminJobListParams,
  type AdminReviewListParams,
  type AdminTrustScoreListParams,
} from '@/lib/api/admin';

export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  trends: () => [...adminKeys.all, 'trends'] as const,
  activity: (limit?: number) => [...adminKeys.all, 'activity', limit] as const,
  users: (params?: AdminUserListParams) => [...adminKeys.all, 'users', params] as const,
  jobs: (params?: AdminJobListParams) => [...adminKeys.all, 'jobs', params] as const,
  flagged: (params?: { page?: number; limit?: number }) => [...adminKeys.all, 'flagged', params] as const,
  reviews: (params?: AdminReviewListParams) => [...adminKeys.all, 'reviews', params] as const,
  trustScores: (params?: AdminTrustScoreListParams) => [...adminKeys.all, 'trustScores', params] as const,
};

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      const res = await adminApi.getStats();
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch stats');
      return res.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useAdminTrends() {
  return useQuery({
    queryKey: adminKeys.trends(),
    queryFn: async () => {
      const res = await adminApi.getTrends();
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch trends');
      return res.data;
    },
  });
}

export function useAdminActivity(limit?: number) {
  return useQuery({
    queryKey: adminKeys.activity(limit),
    queryFn: async () => {
      const res = await adminApi.getActivity(limit);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch activity');
      return res.data;
    },
    refetchInterval: 30000,
  });
}

export function useAdminUsers(params?: AdminUserListParams) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: async () => {
      const res = await adminApi.listUsers(params);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch users');
      return res.data;
    },
  });
}

export function useAdminJobs(params?: AdminJobListParams) {
  return useQuery({
    queryKey: adminKeys.jobs(params),
    queryFn: async () => {
      const res = await adminApi.listJobs(params);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch jobs');
      return res.data;
    },
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'ACTIVE' | 'SUSPENDED' }) =>
      adminApi.updateUserStatus(userId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.users() });
      qc.invalidateQueries({ queryKey: adminKeys.stats() });
      qc.invalidateQueries({ queryKey: adminKeys.flagged() });
    },
  });
}

export function useAdminFlaggedAccounts(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: adminKeys.flagged(params),
    queryFn: async () => {
      const res = await adminApi.getFlaggedAccounts(params);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch flagged accounts');
      return res.data;
    },
    refetchInterval: 120000, // Refresh every 2 minutes
  });
}

export function useAdminReviews(params?: AdminReviewListParams) {
  return useQuery({
    queryKey: adminKeys.reviews(params),
    queryFn: async () => {
      const res = await adminApi.listReviews(params);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch reviews');
      return res.data;
    },
  });
}

export function useAdminTrustScores(params?: AdminTrustScoreListParams) {
  return useQuery({
    queryKey: adminKeys.trustScores(params),
    queryFn: async () => {
      const res = await adminApi.listTrustScores(params);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch trust scores');
      return res.data;
    },
  });
}

export function useAdjustTrustScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: { adjustment: number; reason: string } }) =>
      adminApi.adjustTrustScore(userId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.trustScores() });
      qc.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}
