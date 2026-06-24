'use client';

import { Wallet } from 'lucide-react';
import { useBalance } from 'wagmi';

import { useSafeAccount } from '@/hooks/use-safe-account';

export function TokenBalance() {
  const { address, isConnected } = useSafeAccount();

  const { data: balanceData, isLoading } = useBalance({
    address,
    query: {
      enabled: Boolean(address && isConnected),
      refetchInterval: 15_000,
    },
  });

  // Nothing to show when wallet is not connected
  if (!isConnected || !address) {
    return null;
  }

  const formattedBalance = balanceData
    ? `${Number(balanceData.formatted).toFixed(4)} ${balanceData.symbol}`
    : null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
      <Wallet className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />

      {isLoading || !formattedBalance ? (
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
      ) : (
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {formattedBalance}
        </span>
      )}
    </div>
  );
}
