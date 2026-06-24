import { useQuery } from '@tanstack/react-query';
import { skillApi, type SkillQuery } from '@/lib/api/skill';

export const skillKeys = {
  all: ['skills'] as const,
  list: (params?: SkillQuery) => [...skillKeys.all, 'list', params] as const,
};

export function useSkills(params?: SkillQuery) {
  return useQuery({
    queryKey: skillKeys.list(params),
    queryFn: async () => {
      const res = await skillApi.list(params);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch skills');
      return res.data;
    },
    staleTime: 1000 * 60 * 10, // skills rarely change, cache 10 min
  });
}
