import { useQuery } from '@tanstack/react-query';
import { supportApi } from '@/lib/api/support';

export const supportKeys = {
  all: ['support'] as const,
  adminId: () => [...supportKeys.all, 'adminId'] as const,
};

export function useSupportAdmin() {
  return useQuery({
    queryKey: supportKeys.adminId(),
    queryFn: async () => {
      const res = await supportApi.getAdminId();
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to get support admin');
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 min
    retry: 1,
  });
}
