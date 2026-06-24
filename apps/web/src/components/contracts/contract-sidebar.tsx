import Link from 'next/link';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Contract } from '@/lib/api/contract';
import { formatDate } from './constants';

interface ContractSidebarProps {
  contract: Contract;
  isClient: boolean;
  onRaiseDispute: () => void;
  actionLoading: boolean;
}

export function ContractSidebar({ contract, isClient, onRaiseDispute, actionLoading }: ContractSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Contract Summary */}
      <Card className="border-dt-border bg-dt-surface shadow-lg">
        <CardHeader>
          <CardTitle className="text-base text-dt-text">Contract Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-dt-text-muted">Total Value</span>
            <span className="font-semibold text-dt-text">
              ${Number(contract.totalAmount).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-dt-text-muted">Amount Paid</span>
            <span className="font-semibold text-emerald-600">
              ${Number(contract.paidAmount ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-dt-text-muted">Remaining</span>
            <span className="font-semibold text-dt-text">
              ${(Number(contract.totalAmount || 0) - Number(contract.paidAmount || 0)).toLocaleString()}
            </span>
          </div>
          <div className="h-px bg-dt-surface-alt" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-dt-text-muted">Platform Fee (3%)</span>
            <span className="font-medium text-dt-text-muted">
              ${(Number(contract.totalAmount || 0) * 0.03).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-dt-text-muted">Client Total</span>
            <span className="font-semibold text-dt-text">
              ${(Number(contract.totalAmount || 0) * 1.03).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {contract.billingType === 'HOURLY' && (
            <>
              <div className="h-px bg-dt-surface-alt" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-dt-text-muted">Billing Type</span>
                <span className="font-medium text-blue-600">Hourly</span>
              </div>
              {contract.hourlyRate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dt-text-muted">Hourly Rate</span>
                  <span className="font-semibold text-dt-text">
                    ${Number(contract.hourlyRate).toFixed(2)}/hr
                  </span>
                </div>
              )}
              {contract.weeklyHourLimit && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dt-text-muted">Weekly Limit</span>
                  <span className="font-semibold text-dt-text">
                    {contract.weeklyHourLimit} hrs
                  </span>
                </div>
              )}
            </>
          )}
          <div className="h-px bg-dt-surface-alt" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-dt-text-muted">Start Date</span>
            <span className="text-dt-text">
              {contract.startDate ? formatDate(contract.startDate) : formatDate(contract.createdAt)}
            </span>
          </div>
          {contract.endDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-dt-text-muted">End Date</span>
              <span className="text-dt-text">{formatDate(contract.endDate)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {contract.status === 'ACTIVE' && (
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardHeader>
            <CardTitle className="text-base text-dt-text">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full border-dt-border">
              <Link href={`/messages?contract=${contract.id}`}>
                Message {isClient ? 'Freelancer' : 'Client'}
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={onRaiseDispute}
              disabled={actionLoading}
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
            >
              <Flag className="mr-2 h-4 w-4" />
              Raise Dispute
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Related Job */}
      {contract.job && (
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardHeader>
            <CardTitle className="text-base text-dt-text">Related Job</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/jobs/${contract.jobId}`}
              className="text-sm text-emerald-600 hover:underline"
            >
              {contract.job.title}
            </Link>
            <p className="mt-1 text-xs text-dt-text-muted">
              {contract.job.category} · {contract.job.type === 'FIXED_PRICE' ? 'Fixed Price' : 'Hourly'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
