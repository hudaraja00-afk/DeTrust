import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api/user';

export const userKeys = {
  all: ['user'] as const,
  me: () => [...userKeys.all, 'me'] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
  freelancers: (params?: Record<string, unknown>) => [...userKeys.all, 'freelancers', params] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: async () => {
      const res = await userApi.getMe();
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch user');
      return res.data;
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const res = await userApi.getUser(id);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'User not found');
      return res.data;
    },
    enabled: !!id,
  });
}

export function useFreelancers(params?: Parameters<typeof userApi.searchFreelancers>[0]) {
  return useQuery({
    queryKey: userKeys.freelancers(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await userApi.searchFreelancers(params);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to search freelancers');
      return res.data;
    },
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; avatarUrl?: string }) => userApi.updateMe(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: userKeys.me() }); },
  });
}

export function useUpdateFreelancerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof userApi.updateFreelancerProfile>[0]) =>
      userApi.updateFreelancerProfile(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: userKeys.me() }); },
  });
}

export function useUpdateClientProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof userApi.updateClientProfile>[0]) =>
      userApi.updateClientProfile(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: userKeys.me() }); },
  });
}

export function useAddSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ skillId, yearsExperience, proficiencyLevel }: { skillId: string; yearsExperience?: number; proficiencyLevel?: number }) =>
      userApi.addSkill(skillId, yearsExperience, proficiencyLevel),
    onSuccess: () => { qc.invalidateQueries({ queryKey: userKeys.me() }); },
  });
}

export function useRemoveSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (skillId: string) => userApi.removeSkill(skillId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: userKeys.me() }); },
  });
}

export function useAddEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof userApi.addEducation>[0]) =>
      userApi.addEducation(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: userKeys.me() }); },
  });
}

export function useRemoveEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (educationId: string) => userApi.removeEducation(educationId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: userKeys.me() }); },
  });
}

export function useRemoveCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (certificationId: string) => userApi.removeCertification(certificationId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: userKeys.me() }); },
  });
}

export function useSetRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (role: 'CLIENT' | 'FREELANCER') => userApi.setRole(role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: userKeys.me() }); },
  });
}
