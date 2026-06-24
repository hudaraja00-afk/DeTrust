import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntryApi, type CreateTimeEntryInput, type UpdateTimeEntryInput } from '@/lib/api/timeEntry';
import { contractKeys } from './use-contracts';

export const timeEntryKeys = {
  all: ['timeEntries'] as const,
  forMilestone: (contractId: string, milestoneId: string) =>
    [...timeEntryKeys.all, contractId, milestoneId] as const,
};

export function useTimeEntries(contractId: string, milestoneId: string) {
  return useQuery({
    queryKey: timeEntryKeys.forMilestone(contractId, milestoneId),
    queryFn: async () => {
      const res = await timeEntryApi.listTimeEntries(contractId, milestoneId);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch time entries');
      return res.data;
    },
    enabled: !!contractId && !!milestoneId,
  });
}

export function useCreateTimeEntry(contractId: string, milestoneId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTimeEntryInput) =>
      timeEntryApi.createTimeEntry(contractId, milestoneId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: timeEntryKeys.forMilestone(contractId, milestoneId) });
      qc.invalidateQueries({ queryKey: contractKeys.detail(contractId) });
    },
  });
}

export function useUpdateTimeEntry(contractId: string, milestoneId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, data }: { entryId: string; data: UpdateTimeEntryInput }) =>
      timeEntryApi.updateTimeEntry(contractId, milestoneId, entryId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: timeEntryKeys.forMilestone(contractId, milestoneId) });
      qc.invalidateQueries({ queryKey: contractKeys.detail(contractId) });
    },
  });
}

export function useDeleteTimeEntry(contractId: string, milestoneId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) =>
      timeEntryApi.deleteTimeEntry(contractId, milestoneId, entryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: timeEntryKeys.forMilestone(contractId, milestoneId) });
      qc.invalidateQueries({ queryKey: contractKeys.detail(contractId) });
    },
  });
}
