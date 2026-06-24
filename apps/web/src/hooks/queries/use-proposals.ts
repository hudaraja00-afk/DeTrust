import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  proposalApi,
  type GetProposalsParams,
  type CreateProposalInput,
  type UpdateProposalInput,
  type AcceptProposalInput,
} from '@/lib/api/proposal';
import { jobKeys } from './use-jobs';

export const proposalKeys = {
  all: ['proposals'] as const,
  mine: (params?: GetProposalsParams) => [...proposalKeys.all, 'mine', params] as const,
  forJob: (jobId: string, params?: GetProposalsParams) => [...proposalKeys.all, 'job', jobId, params] as const,
  detail: (id: string) => [...proposalKeys.all, 'detail', id] as const,
};

export function useMyProposals(params?: GetProposalsParams) {
  return useQuery({
    queryKey: proposalKeys.mine(params),
    queryFn: async () => {
      const res = await proposalApi.getMyProposals(params);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch proposals');
      return res.data;
    },
  });
}

export function useJobProposals(jobId: string, params?: GetProposalsParams) {
  return useQuery({
    queryKey: proposalKeys.forJob(jobId, params),
    queryFn: async () => {
      const res = await proposalApi.getJobProposals(jobId, params);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch proposals');
      return res.data;
    },
    enabled: !!jobId,
  });
}

export function useProposal(id: string) {
  return useQuery({
    queryKey: proposalKeys.detail(id),
    queryFn: async () => {
      const res = await proposalApi.getProposal(id);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Proposal not found');
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: CreateProposalInput }) =>
      proposalApi.createProposal(jobId, data),
    onSuccess: (_, { jobId }) => {
      qc.invalidateQueries({ queryKey: proposalKeys.mine() });
      qc.invalidateQueries({ queryKey: proposalKeys.forJob(jobId) });
      qc.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
    },
  });
}

export function useUpdateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProposalInput }) =>
      proposalApi.updateProposal(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: proposalKeys.detail(id) });
      qc.invalidateQueries({ queryKey: proposalKeys.mine() });
    },
  });
}

export function useWithdrawProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => proposalApi.withdrawProposal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: proposalKeys.all });
    },
  });
}

export function useAcceptProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AcceptProposalInput }) =>
      proposalApi.acceptProposal(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: proposalKeys.all });
      qc.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}

export function useRejectProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      proposalApi.rejectProposal(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: proposalKeys.all });
    },
  });
}

export function useShortlistProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => proposalApi.shortlistProposal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: proposalKeys.all });
    },
  });
}
