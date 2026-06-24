import type { ContractStatus, MilestoneStatus } from '@/lib/api/contract';

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  DISPUTED: 'bg-orange-100 text-orange-700',
};

export const MILESTONE_STATUS_COLORS: Record<MilestoneStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  SUBMITTED: 'bg-purple-100 text-purple-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  PAID: 'bg-green-100 text-green-700',
  DISPUTED: 'bg-orange-100 text-orange-700',
  REVISION_REQUESTED: 'bg-amber-100 text-amber-700',
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};
