import Image from 'next/image';
import { Clock, CheckCircle2, ExternalLink, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Contract, ContractStatus } from '@/lib/api/contract';
import { CONTRACT_STATUS_COLORS, formatDate } from './constants';

interface ContractHeaderProps {
  contract: Contract;
  otherParty: {
    name: string;
    avatar: string | null;
    subtitle: string;
    trustScore: number;
  };
}

export function ContractHeader({ contract, otherParty }: ContractHeaderProps) {
  return (
    <Card className="border-dt-border bg-dt-surface shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-emerald-100 bg-dt-surface-alt">
              {otherParty.avatar ? (
                <Image
                  src={otherParty.avatar}
                  alt={otherParty.name}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-dt-text-muted">
                  {otherParty.name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-dt-text">{contract.title}</h1>
                <Badge className={CONTRACT_STATUS_COLORS[contract.status as ContractStatus]}>
                  {contract.status}
                </Badge>
                <Badge className={contract.billingType === 'HOURLY' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}>
                  {contract.billingType === 'HOURLY' ? 'Hourly' : 'Fixed Price'}
                </Badge>
              </div>
              <p className="text-dt-text-muted">
                Contract with {otherParty.name} · {otherParty.subtitle}
              </p>
              <div className="mt-2 flex items-center gap-4 text-sm text-dt-text-muted">
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  {otherParty.trustScore}% trust
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Started {formatDate(contract.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-dt-text">
              ${Number(contract.totalAmount).toLocaleString()}
            </div>
            <div className="text-sm text-emerald-600">
              ${Number(contract.paidAmount ?? 0).toLocaleString()} paid
            </div>
            {contract.billingType === 'HOURLY' && contract.hourlyRate && (
              <div className="mt-1 text-xs text-dt-text-muted">
                ${Number(contract.hourlyRate).toFixed(2)}/hr · {contract.weeklyHourLimit ?? 40}hrs/week
              </div>
            )}
          </div>
        </div>

        {contract.escrowAddress && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-900">Escrow Funded</p>
              <p className="text-sm text-emerald-700">Funds secured in smart contract</p>
            </div>
            {contract.fundingTxHash && (
              <a
                href={`https://etherscan.io/tx/${contract.fundingTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-sm text-emerald-600 hover:underline"
              >
                View Tx <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
