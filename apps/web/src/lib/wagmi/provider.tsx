'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, lightTheme, Theme } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from './config';

// Custom DeTrust theme for RainbowKit
const baseTheme = lightTheme({
  accentColor: '#0ebc8b',
  accentColorForeground: '#041b18',
  borderRadius: 'large',
  fontStack: 'rounded',
  overlayBlur: 'small',
});

const detrustTheme: Theme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    modalBackground: '#ffffff',
    modalBorder: 'rgba(15, 23, 42, 0.08)',
    profileForeground: '#f7fafc',
    connectButtonBackground: '#0ebc8b',
    connectButtonInnerBackground: '#0aa175',
    connectButtonText: '#f0fdf4',
  },
  shadows: {
    ...baseTheme.shadows,
    connectButton: '0 18px 40px rgba(14, 188, 139, 0.35)',
  },
};

interface Web3ProviderProps {
  children: ReactNode;
}

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 10,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

/**
 * Web3Provider – wagmi → QueryClient → RainbowKit.
 *
 * Wrapping order follows the official RainbowKit installation guide:
 *   WagmiProvider > QueryClientProvider > RainbowKitProvider
 *
 * This component is rendered directly (NOT via next/dynamic) to avoid
 * Turbopack creating separate module instances of @tanstack/react-query
 * across chunk boundaries.  The wagmi config already has `ssr: true`,
 * so external stores like localStorage are deferred until hydration –
 * no SSR errors.
 */
export function Web3Provider({ children }: Web3ProviderProps) {
  const queryClient = getQueryClient();

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={detrustTheme}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
