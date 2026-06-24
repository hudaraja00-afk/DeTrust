const walletConnectProjectId = (process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '').trim();
export const isWalletConnectConfigured = walletConnectProjectId.length > 0;

if (!isWalletConnectConfigured && process.env.NODE_ENV !== 'test') {
  const message =
    'WalletConnect project ID is missing. Set NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID in apps/web/.env.local to enable RainbowKit connectors.';
  if (typeof window === 'undefined') {
    console.warn(message);
  } else {
    console.info(message);
  }
}

export { walletConnectProjectId };
