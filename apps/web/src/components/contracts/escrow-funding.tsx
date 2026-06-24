'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Copy, DollarSign, ExternalLink, Shield, Wallet2 } from 'lucide-react';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { type Address } from 'viem';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useJobEscrow } from '@/hooks/use-job-escrow';
import { contractApi, type Contract } from '@/lib/api/contract';

interface EscrowFundingProps {
  contract: Contract;
  onFunded: () => void;
  autoFund?: boolean;
}

export function EscrowFunding({ contract, onFunded, autoFund }: EscrowFundingProps) {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({
    address,
    query: { enabled: Boolean(address && isConnected) },
  });

  const {
    createJobEscrow,
    contractAddress,
    loading: escrowLoading,
    error: escrowError,
    isConnected: isEscrowReady,
  } = useJobEscrow();

  const [funding, setFunding] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [feeBreakdown, setFeeBreakdown] = useState<{
    total: string;
    fee: string;
    milestoneTotal: string;
  } | null>(null);
  const autoFundTriggered = useRef(false);

  const totalAmount = Number(contract.totalAmount || 0);
  const freelancerAddress = contract.freelancer?.walletAddress as Address | undefined;
  const milestoneAmounts = (contract.milestones ?? []).map((m) => Number(m.amount));

  // Calculate fee breakdown in USD (3% platform fee)
  useEffect(() => {
    if (totalAmount <= 0) return;
    const fee = totalAmount * 0.03;
    const total = totalAmount + fee;
    setFeeBreakdown({
      milestoneTotal: `$${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      fee: `$${fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      total: `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    });
  }, [totalAmount]);

  const txExplorerUrl =
    lastTxHash && chainId !== 31337
      ? chainId === 137
        ? `https://polygonscan.com/tx/${lastTxHash}`
        : chainId === 80002
        ? `https://amoy.polygonscan.com/tx/${lastTxHash}`
        : undefined
      : undefined;

  const handleCopyTxHash = useCallback(async () => {
    if (!lastTxHash) return;
    try {
      await navigator.clipboard.writeText(lastTxHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success('Transaction ID copied');
    } catch {
      toast.error('Failed to copy transaction ID');
    }
  }, [lastTxHash]);

  const handleFundEscrow = useCallback(async () => {
    if (!freelancerAddress) {
      toast.error('Freelancer has not connected a wallet yet. Ask them to link a wallet from their profile.');
      return;
    }

    if (!isConnected || !address) {
      toast.error('Please connect your wallet first.');
      return;
    }

    if (!isEscrowReady) {
      toast.error('Smart contract not available on this network. Switch to a supported chain.');
      return;
    }

    if (!contract.jobId) {
      toast.error('No job linked to this contract.');
      return;
    }

    setFunding(true);
    try {
      const { txHash, blockchainJobId } = await createJobEscrow(
        contract.jobId,
        freelancerAddress,
        milestoneAmounts
      );
      setLastTxHash(txHash);

      const response = await contractApi.fundEscrow(
        contract.id,
        txHash,
        contractAddress ?? undefined,
        blockchainJobId
      );

      if (response.success) {
        toast.success('Escrow funded! Contract is now active.');
        onFunded();
      } else {
        toast.error(response.error?.message || 'Failed to register funding on server');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fund escrow';
      if (message.includes('User rejected') || message.includes('denied')) {
        toast.error('Transaction was rejected in your wallet.');
      } else {
        toast.error(message);
      }
    } finally {
      setFunding(false);
    }
  }, [address, contract, contractAddress, createJobEscrow, freelancerAddress, isConnected, isEscrowReady, milestoneAmounts, onFunded]);

  // Auto-trigger funding when autoFund prop is set (from proposal acceptance redirect)
  useEffect(() => {
    if (!autoFund || autoFundTriggered.current) return;
    if (!isConnected || !freelancerAddress || !isEscrowReady) return;
    autoFundTriggered.current = true;
    void handleFundEscrow();
  }, [autoFund, isConnected, freelancerAddress, isEscrowReady, handleFundEscrow]);

  const walletBalance = balanceData
    ? `${Number(balanceData.formatted).toFixed(4)} ${balanceData.symbol}`
    : null;

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white shadow-xl">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-3 text-xl text-amber-900">
          <Wallet2 className="h-6 w-6 text-amber-500" />
          Fund Escrow to Activate Contract
        </CardTitle>
        <p className="text-sm text-amber-700">
          Deposit dUSD stablecoins into the smart contract. Your payment is held securely until you approve each milestone.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Fee Breakdown */}
        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-dt-text-muted">Milestone total</span>
              <span className="font-semibold text-dt-text">
                {feeBreakdown?.milestoneTotal ?? `$${totalAmount.toFixed(2)}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dt-text-muted">Platform fee (3%)</span>
              <span className="text-dt-text-muted">
                {feeBreakdown?.fee ?? '...'}
              </span>
            </div>
            <div className="h-px bg-amber-100" />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-900">Total to deposit</span>
              <span className="text-lg font-bold text-amber-900">
                {feeBreakdown?.total ?? '...'}
              </span>
            </div>
          </div>
        </div>

        {/* Wallet Status */}
        <div className="rounded-2xl border border-dt-border bg-dt-surface p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-dt-text-muted">
              <Wallet2 className="h-4 w-4" /> Your wallet
            </span>
            {isConnected ? (
              <span className="font-mono text-xs text-dt-text">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            ) : (
              <span className="text-amber-600">Not connected</span>
            )}
          </div>
          {walletBalance && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-dt-text-muted">Native balance (gas)</span>
              <span className="font-semibold text-dt-text">{walletBalance}</span>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          Funding uses dUSD and usually asks for two wallet signatures: token approval, then escrow funding.
        </div>

        {/* Warnings */}
        {!freelancerAddress && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Freelancer hasn&apos;t linked a wallet. They need to connect one before you can fund escrow.</span>
          </div>
        )}

        {!isEscrowReady && isConnected && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Smart contract not available on this network. Please switch to Polygon, Amoy testnet, or Localhost.</span>
          </div>
        )}

        {escrowError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{escrowError}</span>
          </div>
        )}

        {/* Security note */}
        <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <span>Funds are held in an auditable smart contract. Payments release only when you approve each milestone.</span>
        </div>

        {lastTxHash && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Escrow funding transaction confirmed
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-white px-3 py-2">
              <span className="font-mono text-xs text-dt-text">{lastTxHash.slice(0, 10)}...{lastTxHash.slice(-8)}</span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleCopyTxHash}>
                  <Copy className="mr-1 h-3.5 w-3.5" />
                  {copied ? 'Copied' : 'Copy Tx ID'}
                </Button>
                {txExplorerUrl && (
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={txExplorerUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      Block Explorer
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fund Button */}
        <Button
          onClick={handleFundEscrow}
          disabled={funding || escrowLoading || !isConnected || !freelancerAddress || !isEscrowReady}
          className="w-full bg-amber-500 py-6 text-base font-semibold text-white shadow-lg shadow-amber-200/70 hover:bg-amber-600 disabled:opacity-50"
        >
          {funding || escrowLoading ? (
            <><Spinner size="sm" className="mr-2 border-white" /> Processing transaction...</>
          ) : !isConnected ? (
            <><Wallet2 className="mr-2 h-5 w-5" /> Connect Wallet to Fund</>
          ) : (
            <><DollarSign className="mr-2 h-5 w-5" /> Fund Escrow &amp; Activate Contract</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
