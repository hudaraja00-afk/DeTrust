import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobApi, type GetJobsParams, type CreateJobInput, type UpdateJobInput } from '@/lib/api/job';

export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (params?: GetJobsParams) => [...jobKeys.lists(), params] as const,
  mine: (params?: GetJobsParams) => [...jobKeys.all, 'mine', params] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
};

export function useJobs(params?: GetJobsParams) {
  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: async () => {
      const res = await jobApi.listJobs(params);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch jobs');
      return res.data;
    },
  });
}

export function useMyJobs(params?: GetJobsParams) {
  return useQuery({
    queryKey: jobKeys.mine(params),
    queryFn: async () => {
      const res = await jobApi.getMyJobs(params);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch your jobs');
      return res.data;
    },
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: async () => {
      const res = await jobApi.getJob(id);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Job not found');
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateJobInput) => jobApi.createJob(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobKeys.lists() });
      qc.invalidateQueries({ queryKey: jobKeys.mine() });
    },
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJobInput }) => jobApi.updateJob(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: jobKeys.detail(id) });
      qc.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}

export function usePublishJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobApi.publishJob(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}

export function useCancelJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobApi.cancelJob(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobApi.deleteJob(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}
