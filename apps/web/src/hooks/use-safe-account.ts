'use client';

import { useAccount } from 'wagmi';
import type { Address } from 'viem';

interface SafeAccountResult {
  address: Address | undefined;
  isConnected: boolean;
}

export function useSafeAccount(): SafeAccountResult {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { address, isConnected } = useAccount();
    return { address, isConnected };
  } catch (error) {
    if (error instanceof Error && error.name === 'WagmiProviderNotFoundError') {
      return { address: undefined, isConnected: false } as const;
    }
    throw error;
  }
}
