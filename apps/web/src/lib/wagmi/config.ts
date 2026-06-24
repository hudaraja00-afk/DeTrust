import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, walletConnectWallet, coinbaseWallet, rainbowWallet } from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import type { Chain } from 'wagmi/chains';
import { polygon, polygonAmoy } from 'wagmi/chains';

import { walletConnectProjectId } from '@/lib/env';

// Custom chain config for local development
const localhost: Chain = {
  id: 31337,
  name: 'Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
} as const;

const projectId = walletConnectProjectId || 'demo-project-id';

const baseChains = [polygon, polygonAmoy] as const;
const devChains = [...baseChains, localhost] as const;
const chains = (process.env.NODE_ENV === 'development' ? devChains : baseChains) as readonly [Chain, ...Chain[]];

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Desktop wallets',
      wallets: [metaMaskWallet, coinbaseWallet],
    },
    {
      groupName: 'Mobile & QR',
      wallets: [walletConnectWallet, rainbowWallet],
    },
  ],
  {
    appName: 'DeTrust',
    projectId,
  }
);

const transports = chains.reduce<Record<number, ReturnType<typeof http>>>
  ((acc, chain) => {
    const url =
      chain.rpcUrls.default.http?.[0] ??
      chain.rpcUrls.public?.http?.[0];
    if (!url) {
      throw new Error(`Missing RPC URL for chain ${chain.name}`);
    }
    acc[chain.id] = http(url);
    return acc;
  }, {});

export const wagmiConfig = createConfig({
  chains,
  connectors,
  transports,
  ssr: true,
});

export { polygon, polygonAmoy, localhost };
