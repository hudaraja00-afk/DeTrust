import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApi, type GetUserReviewsParams, type CreateReviewInput } from '@/lib/api/review';

export const reviewKeys = {
  all: ['reviews'] as const,
  user: (userId: string, params?: GetUserReviewsParams) => [...reviewKeys.all, 'user', userId, params] as const,
  summary: (userId: string) => [...reviewKeys.all, 'summary', userId] as const,
  contract: (contractId: string) => [...reviewKeys.all, 'contract', contractId] as const,
  status: (contractId: string) => [...reviewKeys.all, 'status', contractId] as const,
};

export function useUserReviews(userId: string, params?: GetUserReviewsParams) {
  return useQuery({
    queryKey: reviewKeys.user(userId, params),
    queryFn: async () => {
      const res = await reviewApi.getUserReviews(userId, params);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch reviews');
      return res.data;
    },
    enabled: !!userId,
  });
}

export function useReviewSummary(userId: string) {
  return useQuery({
    queryKey: reviewKeys.summary(userId),
    queryFn: async () => {
      const res = await reviewApi.getReviewSummary(userId);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch review summary');
      return res.data;
    },
    enabled: !!userId,
  });
}

export function useContractReviews(contractId: string) {
  return useQuery({
    queryKey: reviewKeys.contract(contractId),
    queryFn: async () => {
      const res = await reviewApi.getContractReviews(contractId);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch contract reviews');
      return res.data;
    },
    enabled: !!contractId,
  });
}

export function useReviewStatus(contractId: string) {
  return useQuery({
    queryKey: reviewKeys.status(contractId),
    queryFn: async () => {
      const res = await reviewApi.getReviewStatus(contractId);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch review status');
      return res.data;
    },
    enabled: !!contractId,
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      const res = await reviewApi.submitReview(input);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to submit review');
      return res.data;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: reviewKeys.contract(input.contractId) });
      qc.invalidateQueries({ queryKey: reviewKeys.status(input.contractId) });
      qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}

export function useSubmitReviewResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, responseText }: { reviewId: string; responseText: string }) => {
      const res = await reviewApi.submitResponse(reviewId, responseText);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to submit response');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}
