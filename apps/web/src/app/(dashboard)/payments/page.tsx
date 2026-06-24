'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAccount, useBalance } from 'wagmi';
import { type Address } from 'viem';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Scale,
  Shield,
  Wallet,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { useContracts } from '@/hooks/queries/use-contracts';

type TransactionType = 'payment' | 'withdrawal' | 'deposit' | 'escrow' | 'dispute-release' | 'dispute-refund' | 'dispute-split';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  contractId?: string;
  contractTitle?: string;
  txHash?: string;
  createdAt: string;
}

const TYPE_COLORS: Record<TransactionType, string> = {
  payment: 'bg-emerald-100 text-emerald-700',
  withdrawal: 'bg-blue-100 text-blue-700',
  deposit: 'bg-purple-100 text-purple-700',
  escrow: 'bg-amber-100 text-amber-700',
  'dispute-release': 'bg-emerald-100 text-emerald-700',
  'dispute-refund': 'bg-red-100 text-red-700',
  'dispute-split': 'bg-yellow-100 text-yellow-700',
};

const TYPE_LABELS: Record<TransactionType, string> = {
  payment: 'Payment',
  withdrawal: 'Withdrawal',
  deposit: 'Deposit',
  escrow: 'Escrow',
  'dispute-release': 'Dispute Release',
  'dispute-refund': 'Dispute Refund',
  'dispute-split': 'Dispute Split',
};

const STATUS_ICONS = {
  completed: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  pending: <Clock className="h-4 w-4 text-amber-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const { address, isConnected } = useAccount();
  const stableTokenAddress = process.env.NEXT_PUBLIC_STABLE_TOKEN_ADDRESS as Address | undefined;
  const { data: nativeBalance } = useBalance({ address });
  const { data: stableBalance } = useBalance({
    address,
    token: stableTokenAddress,
    query: { enabled: Boolean(address && stableTokenAddress) },
  });

  const [activeTab, setActiveTab] = useState<'all' | 'incoming' | 'outgoing'>('all');

  const isClient = user?.role === 'CLIENT';

  const { data, isLoading } = useContracts({
    role: isClient ? 'client' : 'freelancer',
    limit: 50,
  });

  const contracts = useMemo(() => data?.items ?? [], [data?.items]);

  // Generate transactions from milestones
  const transactions = useMemo<Transaction[]>(() => {
    const txs: Transaction[] = [];
    contracts.forEach((contract) => {
      contract.milestones?.forEach((milestone) => {
        if (milestone.status === 'PAID' || milestone.status === 'APPROVED') {
          txs.push({
            id: milestone.id,
            type: isClient ? 'payment' : 'payment',
            amount: Number(milestone.amount),
            status: 'completed',
            description: `${milestone.title} - ${contract.title}`,
            contractId: contract.id,
            contractTitle: contract.title,
            createdAt: milestone.approvedAt || milestone.paidAt || contract.createdAt,
          });
        }
      });

      // Add escrow funding transaction if exists
      if (contract.fundingTxHash) {
        txs.push({
          id: `escrow-${contract.id}`,
          type: 'escrow',
          amount: Number(contract.totalAmount),
          status: 'completed',
          description: `Escrow funded for ${contract.title}`,
          contractId: contract.id,
          contractTitle: contract.title,
          txHash: contract.fundingTxHash,
          createdAt: contract.createdAt,
        });
      }

      // Add dispute resolution transactions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (contract as any).disputes?.forEach((dispute: { id: string; outcome: string; resolutionTxHash?: string; resolvedAt?: string; status: string }) => {
        if (dispute.status !== 'RESOLVED') return;
        const amount = Number(contract.totalAmount);
        let type: TransactionType = 'dispute-split';
        let description = '';

        if (dispute.outcome === 'FREELANCER_WINS') {
          type = isClient ? 'dispute-refund' : 'dispute-release';
          description = isClient
            ? `Dispute lost — funds released to freelancer for ${contract.title}`
            : `Dispute won — funds released for ${contract.title}`;
        } else if (dispute.outcome === 'CLIENT_WINS') {
          type = isClient ? 'dispute-refund' : 'dispute-refund';
          description = isClient
            ? `Dispute won — escrow refunded for ${contract.title}`
            : `Dispute lost — escrow refunded to client for ${contract.title}`;
        } else if (dispute.outcome === 'SPLIT') {
          type = 'dispute-split';
          description = `Dispute split — partial resolution for ${contract.title}`;
        }

        txs.push({
          id: `dispute-${dispute.id}`,
          type,
          amount: dispute.outcome === 'SPLIT' ? amount / 2 : amount,
          status: 'completed',
          description,
          contractId: contract.id,
          contractTitle: contract.title,
          txHash: dispute.resolutionTxHash,
          createdAt: dispute.resolvedAt || contract.createdAt,
        });
      });
    });

    // Sort by date
    txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return txs;
  }, [contracts, isClient]);

  // Calculate totals
  const totalEarned = transactions
    .filter((t) => t.type === 'payment' && t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalPending = contracts.reduce((sum, contract) => {
    const pendingMilestoneAmount = (contract.milestones ?? [])
      .filter((milestone) => milestone.status === 'SUBMITTED')
      .reduce((milestoneSum, milestone) => milestoneSum + Number(milestone.amount || 0), 0);
    return sum + pendingMilestoneAmount;
  }, 0);

  const totalEscrow = contracts
    .filter((c) => c.status === 'ACTIVE' && Boolean(c.fundingTxHash || c.escrowAddress))
    .reduce((sum, c) => sum + Math.max(0, Number(c.totalAmount || 0) - Number(c.paidAmount || 0)), 0);

  const isDisputeTx = (type: TransactionType) =>
    type === 'dispute-release' || type === 'dispute-refund' || type === 'dispute-split';

  const filteredTransactions = transactions.filter((t) => {
    if (activeTab === 'incoming') return (t.type === 'payment' && !isClient) || t.type === 'dispute-release';
    if (activeTab === 'outgoing') return (t.type === 'payment' && isClient) || t.type === 'dispute-refund';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dt-text">Payments</h1>
          <p className="text-dt-text-muted">
            {isClient ? 'Track payments to freelancers' : 'Track your earnings and withdrawals'}
          </p>
        </div>
      </div>

      {/* Wallet & Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Wallet Balance */}
        <Card className="border-dt-border bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-100">Wallet Balance</p>
                <p className="mt-1 text-3xl font-semibold">
                  {isConnected && stableBalance
                    ? `${Number(stableBalance.formatted).toFixed(2)} ${stableBalance.symbol}`
                    : '-- dUSD'}
                </p>
                <p className="mt-1 text-xs text-emerald-100">
                  Gas: {isConnected && nativeBalance
                    ? `${Number(nativeBalance.formatted).toFixed(4)} ${nativeBalance.symbol}`
                    : '-- ETH'}
                </p>
                {address && (
                  <p className="mt-1 text-sm text-emerald-100 font-mono">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                )}
              </div>
              <Wallet className="h-12 w-12 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        {/* Total Earned/Paid */}
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dt-text-muted">{isClient ? 'Total Paid' : 'Total Earned'}</p>
                <p className="mt-1 text-2xl font-semibold text-dt-text">
                  ${totalEarned.toLocaleString()}
                </p>
              </div>
              {isClient ? (
                <ArrowUpRight className="h-8 w-8 text-red-400" />
              ) : (
                <ArrowDownLeft className="h-8 w-8 text-emerald-400" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dt-text-muted">Pending</p>
                <p className="mt-1 text-2xl font-semibold text-dt-text">
                  ${totalPending.toLocaleString()}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        {/* In Escrow */}
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dt-text-muted">In Escrow</p>
                <p className="mt-1 text-2xl font-semibold text-dt-text">
                  ${totalEscrow.toLocaleString()}
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Tabs */}
      <div className="flex gap-2 border-b border-dt-border pb-2">
        {(['all', 'incoming', 'outgoing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium capitalize transition',
              activeTab === tab
                ? 'bg-slate-900 text-white'
                : 'text-dt-text-muted hover:bg-dt-surface-alt'
            )}
          >
            {tab === 'all' ? 'All Transactions' : tab}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <DollarSign className="h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-dt-text">No transactions yet</h3>
            <p className="mt-2 text-dt-text-muted">
              {isClient
                ? 'Payments will appear when you approve milestones'
                : 'Earnings will appear when clients approve your work'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 hover:bg-dt-surface-alt"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        tx.type === 'payment' && !isClient
                          ? 'bg-emerald-100'
                          : tx.type === 'payment' && isClient
                          ? 'bg-red-100'
                          : tx.type === 'escrow'
                          ? 'bg-amber-100'
                          : tx.type === 'dispute-release'
                          ? 'bg-emerald-100'
                          : tx.type === 'dispute-refund'
                          ? 'bg-red-100'
                          : tx.type === 'dispute-split'
                          ? 'bg-yellow-100'
                          : 'bg-blue-100'
                      )}
                    >
                      {tx.type === 'payment' && !isClient ? (
                        <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
                      ) : tx.type === 'payment' && isClient ? (
                        <ArrowUpRight className="h-5 w-5 text-red-600" />
                      ) : tx.type === 'escrow' ? (
                        <Shield className="h-5 w-5 text-amber-600" />
                      ) : isDisputeTx(tx.type) ? (
                        <Scale className="h-5 w-5 text-blue-600" />
                      ) : (
                        <DollarSign className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-dt-text">{tx.description}</p>
                      <div className="flex items-center gap-2 text-sm text-dt-text-muted">
                        {STATUS_ICONS[tx.status]}
                        <span>{formatDate(tx.createdAt)}</span>
                        {tx.txHash && (
                          <a
                            href={`https://etherscan.io/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-emerald-600 hover:underline"
                          >
                            View Tx <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        'text-lg font-semibold',
                        (tx.type === 'payment' && !isClient) || tx.type === 'dispute-release'
                          ? 'text-emerald-600'
                          : (tx.type === 'payment' && isClient) || tx.type === 'dispute-refund'
                          ? 'text-red-600'
                          : tx.type === 'dispute-split'
                          ? 'text-yellow-600'
                          : 'text-dt-text'
                      )}
                    >
                      {(tx.type === 'payment' && !isClient) || tx.type === 'dispute-release' ? '+' : (tx.type === 'payment' && isClient) || tx.type === 'dispute-refund' ? '-' : '±'}
                      ${tx.amount.toLocaleString()}
                    </p>
                    <Badge className={TYPE_COLORS[tx.type]}>{TYPE_LABELS[tx.type] ?? tx.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Contracts with Pending Payments */}
      {contracts.filter((c) => c.status === 'ACTIVE').length > 0 && (
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-dt-text">
              Active Contracts with Pending Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contracts
              .filter((c) => c.status === 'ACTIVE')
              .map((contract) => {
                const pendingAmount = Number(contract.totalAmount || 0) - Number(contract.paidAmount || 0);
                const pendingMilestones = contract.milestones?.filter(
                  (m) => m.status !== 'PAID' && m.status !== 'APPROVED'
                ).length || 0;

                return (
                  <Link
                    key={contract.id}
                    href={`/contracts/${contract.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-4 hover:bg-dt-surface-alt"
                  >
                    <div>
                      <p className="font-medium text-dt-text">{contract.title}</p>
                      <p className="text-sm text-dt-text-muted">
                        {pendingMilestones} milestone{pendingMilestones !== 1 ? 's' : ''} pending
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-dt-text">
                        ${pendingAmount.toLocaleString()} remaining
                      </p>
                      {contract.escrowAddress && (
                        <Badge className="bg-emerald-100 text-emerald-700">Escrow Active</Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
