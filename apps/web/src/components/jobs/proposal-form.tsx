'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import type { Job } from '@/lib/api/job';
import type { CreateProposalInput } from '@/lib/api/proposal';

export interface ProposalFormProps {
  job: Job;
  jobId: string;
  hasSubmittedProposal: boolean;
  onSubmit: (data: CreateProposalInput) => Promise<void>;
  submitting: boolean;
  defaultRate: number;
}

export function ProposalForm({
  job, hasSubmittedProposal, onSubmit, submitting, defaultRate,
}: ProposalFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [proposalData, setProposalData] = useState<CreateProposalInput>({
    coverLetter: '',
    proposedRate: defaultRate,
    estimatedDuration: '',
  });

  const update = (field: keyof CreateProposalInput, value: string | number) =>
    setProposalData((prev) => ({ ...prev, [field]: value }));

  const wordCount = proposalData.coverLetter.trim().split(/\s+/).filter(Boolean).length;

  const isHourly = job.type === 'HOURLY';
  const isFixedPrice = job.type === 'FIXED_PRICE';

  // Hourly rate range validation
  const rateMin = isHourly && job.hourlyRateMin ? Number(job.hourlyRateMin) : null;
  const rateMax = isHourly && job.hourlyRateMax ? Number(job.hourlyRateMax) : null;
  const rateOutOfRange = isHourly && rateMin !== null && rateMax !== null && proposalData.proposedRate > 0
    && (proposalData.proposedRate < rateMin || proposalData.proposedRate > rateMax);

  // Fixed-price budget ceiling validation
  const jobBudget = isFixedPrice && job.budget ? Number(job.budget) : null;
  const bidOverBudget = isFixedPrice && jobBudget !== null && proposalData.proposedRate > 0
    && proposalData.proposedRate > jobBudget;

  const hasRateError = !!rateOutOfRange || !!bidOverBudget;

  const handleSubmit = async () => {
    if (!proposalData.coverLetter.trim()) { toast.error('Please write a cover letter'); return; }
    if (wordCount < 50) { toast.error('Cover letter must be at least 50 words'); return; }
    if (!proposalData.proposedRate || proposalData.proposedRate <= 0) { toast.error('Please enter a valid rate'); return; }
    if (rateOutOfRange) {
      toast.error(`Hourly rate must be between $${rateMin} and $${rateMax}/hr`);
      return;
    }
    if (bidOverBudget) {
      toast.error(`Bid cannot exceed the job budget of $${jobBudget}`);
      return;
    }
    await onSubmit(proposalData);
    setShowForm(false);
  };

  if (hasSubmittedProposal) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="flex items-center gap-3 p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="font-medium text-emerald-900">Proposal Submitted</p>
            <p className="text-sm text-emerald-700">Status: {job.proposals?.[0]?.status}</p>
          </div>
          <Button asChild variant="outline" className="ml-auto border-emerald-200">
            <Link href="/proposals">View My Proposals</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (job.status !== 'OPEN') return null;

  return (
    <Card className="border-dt-border bg-dt-surface shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-dt-text">
          <Send className="h-5 w-5 text-emerald-500" /> Submit Your Proposal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showForm ? (
          <div className="text-center">
            <p className="mb-4 text-dt-text-muted">Interested in this job? Submit a proposal to apply.</p>
            <Button onClick={() => setShowForm(true)} className="bg-emerald-500 text-white hover:bg-emerald-600">
              Write Proposal
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-dt-text-muted">Cover Letter *</label>
              <Textarea
                value={proposalData.coverLetter}
                onChange={(e) => update('coverLetter', e.target.value)}
                placeholder="Introduce yourself and explain why you're a great fit for this job..."
                rows={6} className="border-dt-border"
              />
              <p className="mt-1 text-xs text-dt-text-muted">
                {wordCount}/50 words minimum
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-dt-text-muted">
                Your {isFixedPrice ? 'Bid' : 'Hourly Rate'} ($) *
              </label>
              <input
                type="number" value={proposalData.proposedRate || ''}
                onChange={(e) => update('proposedRate', Number(e.target.value))}
                placeholder={isFixedPrice ? 'Enter your bid' : 'Enter your hourly rate'}
                className={`w-full rounded-lg border px-3 py-2 ${hasRateError ? 'border-red-400' : 'border-dt-border'}`}
              />
              {isHourly && rateMin !== null && rateMax !== null && (
                <p className={`mt-1 text-xs ${rateOutOfRange ? 'text-red-500 font-medium' : 'text-dt-text-muted'}`}>
                  Client&apos;s range: ${rateMin} &mdash; ${rateMax}/hr
                  {rateOutOfRange && ' — your rate is outside this range'}
                </p>
              )}
              {isFixedPrice && jobBudget !== null && (
                <p className={`mt-1 text-xs ${bidOverBudget ? 'text-red-500 font-medium' : 'text-dt-text-muted'}`}>
                  Client&apos;s budget: ${jobBudget.toFixed(2)}
                  {bidOverBudget && ' — your bid exceeds the budget'}
                </p>
              )}
              {proposalData.proposedRate > 0 && (
                <div className="mt-2 rounded-lg border border-dt-border bg-dt-surface-alt/50 p-3 text-sm">
                  <div className="flex justify-between text-dt-text-muted">
                    <span>Your {isFixedPrice ? 'bid' : 'rate'}</span>
                    <span>${Number(proposalData.proposedRate).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-dt-text-muted">
                    <span>Platform fee (3%)</span>
                    <span>-${(Number(proposalData.proposedRate) * 0.03).toFixed(2)}</span>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-dt-border pt-1 font-medium text-dt-text">
                    <span>Your earnings</span>
                    <span className="text-emerald-600">${(Number(proposalData.proposedRate) * 0.97).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-dt-text-muted">Estimated Duration</label>
              <input
                type="text" value={proposalData.estimatedDuration || ''}
                onChange={(e) => update('estimatedDuration', e.target.value)}
                placeholder="e.g., 2 weeks, 1 month"
                className="w-full rounded-lg border border-dt-border px-3 py-2"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-dt-border">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting || hasRateError} className="bg-emerald-500 text-white hover:bg-emerald-600">
                {submitting ? <Spinner size="sm" /> : 'Submit Proposal'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
