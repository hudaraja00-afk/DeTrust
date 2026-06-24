'use client';

import { useWalletSync } from '@/hooks/use-wallet-sync';

/** Mounted inside Web3Provider so wagmi context is available */
export function WalletSyncWatcher() {
  useWalletSync();
  return null;
}
