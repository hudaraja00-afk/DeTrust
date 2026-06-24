import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disputeApi, type GetDisputesParams, type CreateDisputeInput, type CastVoteInput, type AdminResolveInput } from '@/lib/api/dispute';

export const disputeKeys = {
  all: ['disputes'] as const,
  lists: () => [...disputeKeys.all, 'list'] as const,
  list: (params?: GetDisputesParams) => [...disputeKeys.lists(), params] as const,
  detail: (id: string) => [...disputeKeys.all, 'detail', id] as const,
  eligibility: (id: string) => [...disputeKeys.all, 'eligibility', id] as const,
};

export function useDisputes(params?: GetDisputesParams) {
  return useQuery({
    queryKey: disputeKeys.list(params),
    queryFn: async () => {
      const res = await disputeApi.listDisputes(params);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch disputes');
      return res.data;
    },
  });
}

export function useDispute(id: string) {
  return useQuery({
    queryKey: disputeKeys.detail(id),
    queryFn: async () => {
      const res = await disputeApi.getDispute(id);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Dispute not found');
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDisputeInput) => disputeApi.createDispute(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disputeKeys.lists() });
    },
  });
}

export function useSubmitEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, data }: { disputeId: string; data: { description: string; files: string[] } }) =>
      disputeApi.submitEvidence(disputeId, data),
    onSuccess: (_, { disputeId }) => {
      qc.invalidateQueries({ queryKey: disputeKeys.detail(disputeId) });
    },
  });
}

export function useUploadEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, files, description }: { disputeId: string; files: File[]; description: string }) =>
      disputeApi.uploadEvidence(disputeId, files, description),
    onSuccess: (_, { disputeId }) => {
      qc.invalidateQueries({ queryKey: disputeKeys.detail(disputeId) });
    },
  });
}

export function useStartVoting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (disputeId: string) => disputeApi.startVoting(disputeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disputeKeys.all });
    },
  });
}

export function useCastVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, input }: { disputeId: string; input: CastVoteInput }) =>
      disputeApi.castVote(disputeId, input),
    onSuccess: (_, { disputeId }) => {
      qc.invalidateQueries({ queryKey: disputeKeys.detail(disputeId) });
    },
  });
}

export function useAdminResolve() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, input }: { disputeId: string; input: AdminResolveInput }) =>
      disputeApi.adminResolve(disputeId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disputeKeys.all });
    },
  });
}

export function useJurorEligibility(disputeId: string) {
  return useQuery({
    queryKey: disputeKeys.eligibility(disputeId),
    queryFn: async () => {
      const res = await disputeApi.checkEligibility(disputeId);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to check eligibility');
      return res.data;
    },
    enabled: !!disputeId,
  });
}
