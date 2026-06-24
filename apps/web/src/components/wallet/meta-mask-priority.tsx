import { useEffect, useMemo, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Loader2, ShieldCheck, Wallet } from 'lucide-react';
import { useAccount, useConnect } from 'wagmi';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ProviderInfo = {
  isMetaMask?: boolean;
};

interface MetaMaskPriorityConnectProps {
  className?: string;
  compact?: boolean;
}

export function MetaMaskPriorityConnect({ className, compact }: MetaMaskPriorityConnectProps) {
  const { connectors, connectAsync, status, error, reset } = useConnect();
  const { isConnected } = useAccount();
  const [metaMaskDetected, setMetaMaskDetected] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    const anyWindow = window as typeof window & {
      ethereum?: {
        isMetaMask?: boolean;
        providers?: Array<{ isMetaMask?: boolean }>;
      };
    };
    const provider = anyWindow.ethereum;
    if (!provider) {
      setMetaMaskDetected(false);
      return;
    }
    if (provider.isMetaMask) {
      setMetaMaskDetected(true);
      return;
    }
    if (Array.isArray(provider.providers)) {
      setMetaMaskDetected(
        provider.providers.some((item: ProviderInfo | undefined) => item?.isMetaMask)
      );
    }
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  const metamaskConnector = useMemo(
    () => connectors.find((connector) => connector.id === 'metaMask'),
    [connectors]
  );

  const isConnecting = status === 'pending';

  const handleMetaMaskConnect = async () => {
    if (!metamaskConnector) {
      toast.error('MetaMask connector unavailable. Use "Other wallets" instead.');
      return;
    }

    try {
      await connectAsync({ connector: metamaskConnector });
      toast.success('MetaMask connected');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to connect MetaMask';
      toast.error(message);
      reset();
    }
  };

  return (
    <Card className={cn('border border-dt-border bg-dt-surface', className)}>
      <CardContent className={cn('space-y-4', compact ? 'p-4' : 'p-5')}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-dt-text">
              <Wallet className="h-4 w-4" /> Step 1: Connect wallet
            </p>
            <p className="text-sm text-dt-text-muted">
              {metaMaskDetected
                ? 'MetaMask detected. Click connect to sign in instantly.'
                : 'Install MetaMask or choose another wallet below.'}
            </p>
          </div>
          <Button
            type="button"
            onClick={handleMetaMaskConnect}
            disabled={isConnecting || isConnected || !mounted || !metamaskConnector}
            className="whitespace-nowrap bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-none hover:from-emerald-600 hover:to-emerald-700"
          >
            {isConnecting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Wallet className="h-4 w-4" /> {isConnected ? 'Connected' : 'Connect MetaMask'}
              </span>
            )}
          </Button>
        </div>

        <div className="rounded-xl border border-dt-border p-4">
          <p className="text-sm font-medium text-dt-text">Other wallets</p>
          <p className="text-sm text-dt-text-muted">
            Rainbow, Trust, Coinbase Wallet, and 100+ others via WalletConnect.
          </p>
          <div className="mt-3">
            <ConnectButton.Custom>
              {({ openConnectModal, mounted }) => (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full justify-center bg-dt-text text-dt-surface hover:bg-dt-text/90"
                  onClick={openConnectModal}
                  disabled={!mounted}
                >
                  Browse all wallets
                </Button>
              )}
            </ConnectButton.Custom>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MetaMaskPriorityConnect;
