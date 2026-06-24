import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractApi, type GetContractsParams } from '@/lib/api/contract';

export const contractKeys = {
  all: ['contracts'] as const,
  lists: () => [...contractKeys.all, 'list'] as const,
  list: (params?: GetContractsParams) => [...contractKeys.lists(), params] as const,
  detail: (id: string) => [...contractKeys.all, 'detail', id] as const,
  payments: (params?: Record<string, unknown>) => [...contractKeys.all, 'payments', params] as const,
  paymentStats: () => [...contractKeys.all, 'paymentStats'] as const,
};

export function useContracts(params?: GetContractsParams) {
  return useQuery({
    queryKey: contractKeys.list(params),
    queryFn: async () => {
      const res = await contractApi.listContracts(params);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch contracts');
      return res.data;
    },
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: async () => {
      const res = await contractApi.getContract(id);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Contract not found');
      return res.data;
    },
    enabled: !!id,
  });
}

export function usePaymentHistory(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: contractKeys.payments(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await contractApi.getPaymentHistory(params);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch payments');
      return res.data;
    },
  });
}

export function usePaymentStats() {
  return useQuery({
    queryKey: contractKeys.paymentStats(),
    queryFn: async () => {
      const res = await contractApi.getPaymentStats();
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch payment stats');
      return res.data;
    },
  });
}

export function useSubmitMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contractId, milestoneId, data }: { contractId: string; milestoneId: string; data: { deliverableUrl?: string; deliverableHash?: string } }) =>
      contractApi.submitMilestone(contractId, milestoneId, data),
    onSuccess: (_, { contractId }) => {
      qc.invalidateQueries({ queryKey: contractKeys.detail(contractId) });
    },
  });
}

export function useApproveMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contractId, milestoneId }: { contractId: string; milestoneId: string }) =>
      contractApi.approveMilestone(contractId, milestoneId),
    onSuccess: (_, { contractId }) => {
      qc.invalidateQueries({ queryKey: contractKeys.detail(contractId) });
      qc.invalidateQueries({ queryKey: contractKeys.payments() });
      qc.invalidateQueries({ queryKey: contractKeys.paymentStats() });
    },
  });
}

export function useRequestRevision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contractId, milestoneId, reason }: { contractId: string; milestoneId: string; reason: string }) =>
      contractApi.requestRevision(contractId, milestoneId, reason),
    onSuccess: (_, { contractId }) => {
      qc.invalidateQueries({ queryKey: contractKeys.detail(contractId) });
    },
  });
}

export function useFundEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contractId, txHash, escrowAddress, blockchainJobId }: { contractId: string; txHash: string; escrowAddress?: string; blockchainJobId?: string }) =>
      contractApi.fundEscrow(contractId, txHash, escrowAddress, blockchainJobId),
    onSuccess: (_, { contractId }) => {
      qc.invalidateQueries({ queryKey: contractKeys.detail(contractId) });
    },
  });
}

export function useCompleteContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contractId: string) => contractApi.completeContract(contractId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}

export function useRaiseDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contractId, reason, evidence }: { contractId: string; reason: string; evidence?: string[] }) =>
      contractApi.raiseDispute(contractId, reason, evidence),
    onSuccess: (_, { contractId }) => {
      qc.invalidateQueries({ queryKey: contractKeys.detail(contractId) });
      qc.invalidateQueries({ queryKey: contractKeys.lists() });
    },
  });
}
