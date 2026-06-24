import { useQuery } from '@tanstack/react-query';
import { clientProfileApi } from '@/lib/api/client-profile';

export function useClientProfile(id: string) {
  return useQuery({
    queryKey: ['clients', 'profile', id],
    queryFn: async () => {
      const res = await clientProfileApi.getClientProfile(id);
      if (!res.success) throw new Error(res.error?.message || 'Failed to fetch client profile');
      return res.data;
    },
    enabled: !!id,
  });
}
