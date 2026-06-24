'use client';

import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { userApi } from '@/lib/api/user';
import { userKeys } from '@/hooks/queries/use-user';

/**
 * Automatically syncs the connected wallet address to the backend
 * whenever a user connects (or changes) their wallet while logged in.
 *
 * Works for both CLIENT and FREELANCER roles.
 * Must be mounted inside Web3Provider so wagmi context is available.
 */
export function useWalletSync() {
  const { address, isConnected } = useAccount();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();

  // Track the last synced address to avoid duplicate API calls
  const lastSyncedRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Only run when authenticated and wallet is connected
    if (!isAuthenticated || !user || !isConnected || !address) return;

    // Normalize to lowercase for comparison so casing differences don't trigger re-sync
    const normalizedNew = address.toLowerCase();
    const normalizedStored = user.walletAddress?.toLowerCase();
    const normalizedLastSynced = lastSyncedRef.current?.toLowerCase();

    // Skip if backend already has this address or we just synced it
    if (normalizedNew === normalizedStored || normalizedNew === normalizedLastSynced) return;

    lastSyncedRef.current = address;

    userApi
      .updateMe({ walletAddress: address })
      .then((res) => {
        if (res.success && res.data) {
          // Update Zustand store immediately so UI reflects the new address
          setUser({ ...user, ...res.data });
          // Invalidate TanStack Query cache so useCurrentUser() refetches fresh data
          // (prevents stale cache from overwriting the updated walletAddress)
          qc.invalidateQueries({ queryKey: userKeys.me() });
          toast.success('Wallet synced', {
            description: `${address.slice(0, 6)}…${address.slice(-4)} linked to your account`,
          });
        } else if (!res.success) {
          // Conflict: wallet already belongs to another account — do NOT reset
          // lastSyncedRef so we don't hammer the API with retries on every render.
          const isConflict =
            res.error?.code === 'CONFLICT' ||
            (res.error?.message ?? '').toLowerCase().includes('unique') ||
            (res.error?.message ?? '').toLowerCase().includes('already linked');

          if (isConflict) {
            toast.error('Wallet already in use', {
              description: `${address.slice(0, 6)}…${address.slice(-4)} is linked to a different account. Connect a different wallet.`,
            });
            // Keep lastSyncedRef set so we don't retry this conflicting address
          } else {
            // For any other API error, clear ref so a later retry is possible
            lastSyncedRef.current = undefined;
          }
        }
      })
      .catch(() => {
        // Network / unexpected error — reset ref to allow a retry next time
        lastSyncedRef.current = undefined;
      });
  }, [address, isConnected, isAuthenticated, user, setUser]);
}
