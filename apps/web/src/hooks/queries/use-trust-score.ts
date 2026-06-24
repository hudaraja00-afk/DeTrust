import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/lib/api/user';

export const trustScoreKeys = {
  all: ['trustScore'] as const,
  user: (userId: string) => [...trustScoreKeys.all, userId] as const,
  history: (userId: string) => [...trustScoreKeys.all, 'history', userId] as const,
};

export function useTrustScore(userId: string) {
  return useQuery({
    queryKey: trustScoreKeys.user(userId),
    queryFn: async () => {
      const res = await userApi.getTrustScore(userId);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch trust score');
      return res.data;
    },
    enabled: !!userId,
  });
}

export function useTrustScoreHistory(userId: string, limit?: number) {
  return useQuery({
    queryKey: trustScoreKeys.history(userId),
    queryFn: async () => {
      const res = await userApi.getTrustScoreHistory(userId, limit);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch trust score history');
      return res.data;
    },
    enabled: !!userId,
  });
}
