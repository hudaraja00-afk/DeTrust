'use client';

import { ReactNode, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { Toaster } from 'sonner';
import { Web3Provider } from '@/lib/wagmi/provider';

/**
 * WalletSyncWatcher is client-only because it calls useAccount/useWalletSync
 * hooks that depend on the wallet connection state.
 */
const WalletSyncWatcher = dynamic(
  () => import('@/lib/wagmi/wallet-sync-watcher').then((m) => m.WalletSyncWatcher),
  { ssr: false },
);

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const resolvedTheme =
    theme === 'system'
      ? typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  return (
    <Web3Provider>
      <WalletSyncWatcher />
      {children}
      <Toaster
        theme={resolvedTheme}
        position="top-right"
        richColors
      />
    </Web3Provider>
  );
}
