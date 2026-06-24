'use client';

import Link from 'next/link';
import { Briefcase, X } from 'lucide-react';
import { useContract } from '@/hooks/queries/use-contracts';

interface ContractContextBannerProps {
  contractId: string;
  onDismiss: () => void;
}

export function ContractContextBanner({ contractId, onDismiss }: ContractContextBannerProps) {
  const { data: contract } = useContract(contractId);

  if (!contract) return null;

  const jobTitle = contract.job?.title ?? 'Unknown Contract';

  return (
    <div className="flex items-center gap-2 border-b border-dt-border bg-blue-50 px-4 py-2 dark:bg-blue-950/30">
      <Briefcase className="h-4 w-4 flex-shrink-0 text-blue-500" />
      <span className="truncate text-xs font-medium text-blue-700 dark:text-blue-400">
        Re: {jobTitle}
      </span>
      <Link
        href={`/contracts/${contractId}`}
        className="ml-auto text-xs text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        View Contract
      </Link>
      <button
        onClick={onDismiss}
        className="ml-1 rounded p-0.5 text-blue-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/50"
        aria-label="Dismiss contract context"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
