'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Clock, FileCheck, FileUp, Link2, Upload, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api/client';
import { contractApi, type Contract, type MilestoneStatus } from '@/lib/api/contract';
import { uploadApi } from '@/lib/api/upload';
import { openSecureFileInNewTab } from '@/lib/secure-files';
import { cn } from '@/lib/utils';
import { MILESTONE_STATUS_COLORS, formatDate } from './constants';
import { TimeEntryLogger } from './time-entry-logger';

interface MilestoneListProps {
  contract: Contract;
  isClient: boolean;
  isFreelancer: boolean;
  isAuthenticated: boolean;
  onApproveOnChain: (jobId: string, index: number) => Promise<void>;
  onRefresh: () => void;
}

export function MilestoneList({
  contract,
  isClient,
  isFreelancer,
  isAuthenticated,
  onApproveOnChain,
  onRefresh,
}: MilestoneListProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [submittingMilestone, setSubmittingMilestone] = useState<string | null>(null);
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitMode, setSubmitMode] = useState<'url' | 'file'>('url');
  const [openingDeliverableId, setOpeningDeliverableId] = useState<string | null>(null);
  const [revisionMilestoneId, setRevisionMilestoneId] = useState<string | null>(null);
  const [revisionReason, setRevisionReason] = useState('');
  const [revisionLoading, setRevisionLoading] = useState(false);

  const isEscrowFunded = contract.status === 'ACTIVE';
  const isDisputed = contract.status === 'DISPUTED';
  const isHourly = contract.billingType === 'HOURLY';

  const completedMilestones = contract.milestones?.filter(m => m.status === 'PAID' || m.status === 'APPROVED').length || 0;
  const totalMilestones = contract.milestones?.length || 0;

  const handleViewDeliverable = useCallback(
    async (milestoneId: string, url: string) => {
      if (!url) return;

      const isSecureUpload = /\/api\/uploads\//.test(url);
      if (!isSecureUpload) {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }

      if (!isAuthenticated) {
        toast.error('Please sign in again to view this deliverable.');
        return;
      }

      setOpeningDeliverableId(milestoneId);
      try {
        await openSecureFileInNewTab(url, { token: api.getToken() ?? undefined });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to open deliverable');
      } finally {
        setOpeningDeliverableId(null);
      }
    },
    [isAuthenticated]
  );

  const handleSubmitMilestone = async (milestoneId: string, index: number) => {
    let finalDeliverableUrl = deliverableUrl;

    if (submitMode === 'file' && deliverableFile) {
      setUploadingFile(true);
      try {
        const uploadResponse = await uploadApi.uploadDeliverable(deliverableFile);
        if (uploadResponse.success && uploadResponse.data) {
          finalDeliverableUrl = uploadResponse.data.url;
        } else {
          toast.error('Failed to upload file');
          setUploadingFile(false);
          return;
        }
      } catch {
        toast.error('Failed to upload file');
        setUploadingFile(false);
        return;
      }
      setUploadingFile(false);
    }

    if (!finalDeliverableUrl.trim()) {
      toast.error('Please provide a deliverable URL or upload a file');
      return;
    }

    setActionLoading(milestoneId);
    try {
      const response = await contractApi.submitMilestone(contract.id, milestoneId, {
        deliverableUrl: finalDeliverableUrl,
        deliverableHash: btoa(finalDeliverableUrl).slice(0, 32),
      });
      if (response.success) {
        toast.success('Milestone submitted for review');
        setSubmittingMilestone(null);
        setDeliverableUrl('');
        setDeliverableFile(null);
        onRefresh();
      } else {
        toast.error(response.error?.message || 'Failed to submit milestone');
      }
    } catch {
      toast.error('Failed to submit milestone');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitHourlyMilestone = async (milestoneId: string, index: number, totalHours: number) => {
    if (totalHours <= 0) {
      toast.error('Please log at least some hours before submitting');
      return;
    }

    const deliverable = `Timesheet: ${totalHours.toFixed(1)} hours logged`;
    setActionLoading(milestoneId);
    try {
      const response = await contractApi.submitMilestone(contract.id, milestoneId, {
        deliverableUrl: deliverable,
        deliverableHash: btoa(deliverable).slice(0, 32),
      });
      if (response.success) {
        toast.success('Weekly timesheet submitted for review');
        onRefresh();
      } else {
        toast.error(response.error?.message || 'Failed to submit timesheet');
      }
    } catch {
      toast.error('Failed to submit timesheet');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveMilestone = async (milestoneId: string, index: number) => {
    if (!confirm('Approve this milestone and release payment?')) return;

    setActionLoading(milestoneId);
    try {
      if (contract?.blockchainJobId) {
        await onApproveOnChain(contract.jobId, index);
      }

      const response = await contractApi.approveMilestone(contract.id, milestoneId);
      if (response.success) {
        toast.success('Milestone approved! Payment released.');
        onRefresh();
      } else {
        toast.error(response.error?.message || 'Failed to approve milestone');
      }
    } catch {
      toast.error('Failed to approve milestone');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestRevision = async (milestoneId: string) => {
    if (!revisionReason.trim()) {
      toast.error('Please provide a reason for the revision request');
      return;
    }

    setRevisionLoading(true);
    try {
      const response = await contractApi.requestRevision(contract.id, milestoneId, revisionReason);
      if (response.success) {
        toast.success('Revision requested');
        setRevisionMilestoneId(null);
        setRevisionReason('');
        onRefresh();
      } else {
        toast.error(response.error?.message || 'Failed to request revision');
      }
    } catch {
      toast.error('Failed to request revision');
    } finally {
      setRevisionLoading(false);
    }
  };

  return (
    <Card className="border-dt-border bg-dt-surface shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg text-dt-text">
          <span className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-emerald-500" />
            Milestones
          </span>
          <span className="text-sm font-normal text-dt-text-muted">
            {completedMilestones} / {totalMilestones} completed
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {contract.milestones?.map((milestone, index) => {
          const milestoneDeliverableUrl = milestone.deliverableUrl?.trim();
          const isSecureDeliverable = !!milestoneDeliverableUrl && /\/api\/uploads\//.test(milestoneDeliverableUrl);
          const normalizedExternalUrl =
            milestoneDeliverableUrl && !isSecureDeliverable
              ? /^https?:\/\//i.test(milestoneDeliverableUrl)
                ? milestoneDeliverableUrl
                : `https://${milestoneDeliverableUrl}`
              : undefined;
          let displayUrl = milestoneDeliverableUrl ?? '';

          if (milestoneDeliverableUrl) {
            try {
              const parsed = new URL(normalizedExternalUrl ?? milestoneDeliverableUrl);
              displayUrl = `${parsed.hostname}${parsed.pathname === '/' ? '' : parsed.pathname}`;
            } catch {
              displayUrl = milestoneDeliverableUrl.replace(/^https?:\/\//, '');
            }
            if (displayUrl.length > 48) {
              displayUrl = `${displayUrl.slice(0, 45)}…`;
            }
          }

          return (
            <div
              key={milestone.id}
              className={cn(
                'rounded-xl border p-4',
                milestone.status === 'PAID' || milestone.status === 'APPROVED'
                  ? 'border-emerald-200 bg-emerald-50'
                  : milestone.status === 'SUBMITTED'
                  ? 'border-purple-200 bg-purple-50'
                  : milestone.status === 'REVISION_REQUESTED'
                  ? 'border-amber-200 bg-amber-50'
                  : isDisputed
                  ? 'border-red-200 bg-red-50/30'
                  : 'border-dt-border bg-dt-surface'
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <h4 className="font-semibold text-dt-text">{milestone.title}</h4>
                    <Badge className={MILESTONE_STATUS_COLORS[milestone.status as MilestoneStatus]}>
                      {milestone.status}
                    </Badge>
                  </div>
                  {milestone.description && (
                    <p className="mt-2 text-sm text-dt-text-muted">{milestone.description}</p>
                  )}
                  {milestone.dueDate && (
                    <p className="mt-1 text-sm text-dt-text-muted">Due: {formatDate(milestone.dueDate)}</p>
                  )}
                  {milestoneDeliverableUrl && (
                    isSecureDeliverable ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={openingDeliverableId === milestone.id}
                        onClick={() => handleViewDeliverable(milestone.id, milestoneDeliverableUrl)}
                        className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-white/80 px-5 text-emerald-700 shadow-sm hover:from-emerald-100 hover:to-white"
                      >
                        {openingDeliverableId === milestone.id ? (
                          <><Spinner size="sm" className="border-emerald-500" /> Opening…</>
                        ) : (
                          <><FileUp className="h-4 w-4" /> View Deliverable</>
                        )}
                      </Button>
                    ) : (
                      <a
                        href={normalizedExternalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-5 text-blue-600 shadow-sm transition hover:bg-blue-100"
                      >
                        <Link2 className="h-4 w-4" />
                        <span className="truncate text-sm font-medium">{displayUrl}</span>
                      </a>
                    )
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-dt-text">
                    ${Number(milestone.amount).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Revision requested notice */}
              {milestone.status === 'REVISION_REQUESTED' && milestone.revisionNote && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-700">Revision Requested</p>
                    <p className="mt-1 text-sm text-amber-600">{milestone.revisionNote}</p>
                  </div>
                </div>
              )}

              {/* Freelancer submit */}
              {isFreelancer && (milestone.status === 'PENDING' || milestone.status === 'IN_PROGRESS' || milestone.status === 'REVISION_REQUESTED') && (
                <div className="mt-4">
                  {isDisputed ? (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      This contract is under dispute — milestone submissions are disabled until the dispute is resolved.
                    </div>
                  ) : !isEscrowFunded ? (
                    <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      Escrow must be funded before deliverables can be submitted
                    </div>
                  ) : isHourly ? (
                    /* Hourly: show time entry logger + submit timesheet button */
                    <div className="space-y-3">
                      <TimeEntryLogger
                        contractId={contract.id}
                        milestoneId={milestone.id}
                        isFreelancer={true}
                        editable={true}
                        initialEntries={milestone.timeEntries}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const hrs = milestone.timeEntries?.reduce((s, e) => s + Number(e.hours), 0) ?? 0;
                          handleSubmitHourlyMilestone(milestone.id, index, hrs);
                        }}
                        disabled={!!actionLoading}
                        className="bg-blue-500 text-white hover:bg-blue-600"
                      >
                        {actionLoading === milestone.id ? <Spinner size="sm" /> : (
                          <><Clock className="mr-1 h-3 w-3" /> Submit Weekly Timesheet</>
                        )}
                      </Button>
                    </div>
                  ) : submittingMilestone === milestone.id ? (
                    /* Fixed-price: URL / file upload form */
                    <div className="space-y-3 rounded-lg border border-dt-border bg-dt-surface p-4">
                      <div className="flex gap-2 border-b border-slate-100 pb-3">
                        <button
                          type="button"
                          onClick={() => setSubmitMode('url')}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                            submitMode === 'url' ? 'bg-emerald-100 text-emerald-700' : 'text-dt-text-muted hover:bg-dt-surface-alt'
                          )}
                        >
                          <Link2 className="h-4 w-4" /> Link / URL
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubmitMode('file')}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                            submitMode === 'file' ? 'bg-emerald-100 text-emerald-700' : 'text-dt-text-muted hover:bg-dt-surface-alt'
                          )}
                        >
                          <Upload className="h-4 w-4" /> Upload File
                        </button>
                      </div>

                      {submitMode === 'url' ? (
                        <Input
                          value={deliverableUrl}
                          onChange={(e) => setDeliverableUrl(e.target.value)}
                          placeholder="Enter deliverable URL (e.g., GitHub, Figma, Google Drive)"
                          className="border-dt-border"
                        />
                      ) : (
                        <div className="space-y-2">
                          <label
                            htmlFor={`file-upload-${milestone.id}`}
                            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-dt-border bg-dt-surface-alt p-6 transition hover:border-emerald-300 hover:bg-emerald-50"
                          >
                            <Upload className="h-8 w-8 text-slate-400" />
                            <p className="mt-2 text-sm text-dt-text-muted">
                              {deliverableFile ? deliverableFile.name : 'Click to upload or drag and drop'}
                            </p>
                            <p className="text-xs text-slate-400">PDF, ZIP, PNG, JPG up to 50MB</p>
                            <input
                              id={`file-upload-${milestone.id}`}
                              type="file"
                              className="hidden"
                              onChange={(e) => setDeliverableFile(e.target.files?.[0] || null)}
                              accept=".pdf,.zip,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.fig,.sketch"
                            />
                          </label>
                          {deliverableFile && (
                            <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm">
                              <span className="text-emerald-700">{deliverableFile.name}</span>
                              <button type="button" onClick={() => setDeliverableFile(null)} className="text-slate-400 hover:text-red-500">
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSubmittingMilestone(null); setDeliverableUrl(''); setDeliverableFile(null); }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSubmitMilestone(milestone.id, index)}
                          disabled={!!actionLoading || uploadingFile}
                          className="bg-emerald-500 text-white hover:bg-emerald-600"
                        >
                          {actionLoading === milestone.id || uploadingFile ? <Spinner size="sm" /> : 'Submit'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setSubmittingMilestone(milestone.id)}
                      className="bg-blue-500 text-white hover:bg-blue-600"
                    >
                      {milestone.status === 'REVISION_REQUESTED' ? (
                        <><RotateCcw className="mr-1 h-3 w-3" /> Re-submit Deliverable</>
                      ) : (
                        <><FileUp className="mr-1 h-3 w-3" /> Submit Deliverable</>
                      )}
                    </Button>
                  )}
                </div>
              )}

              {/* Client approve + revision */}
              {isClient && milestone.status === 'SUBMITTED' && (
                <div className="mt-4 space-y-3">
                  {/* Show timesheet for hourly contracts */}
                  {isHourly && (
                    <TimeEntryLogger
                      contractId={contract.id}
                      milestoneId={milestone.id}
                      isFreelancer={false}
                      editable={false}
                      initialEntries={milestone.timeEntries}
                    />
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveMilestone(milestone.id, index)}
                      disabled={!!actionLoading}
                      className="bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                      {actionLoading === milestone.id ? <Spinner size="sm" /> : (
                        <><CheckCircle2 className="mr-1 h-3 w-3" /> Approve & Pay</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRevisionMilestoneId(
                        revisionMilestoneId === milestone.id ? null : milestone.id
                      )}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      <RotateCcw className="mr-1 h-3 w-3" /> Request Revision
                    </Button>
                  </div>
                  {revisionMilestoneId === milestone.id && (
                    <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <Textarea
                        value={revisionReason}
                        onChange={(e) => setRevisionReason(e.target.value)}
                        placeholder="Describe what needs to be revised..."
                        rows={3}
                        className="border-amber-200 bg-white"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setRevisionMilestoneId(null); setRevisionReason(''); }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRequestRevision(milestone.id)}
                          disabled={revisionLoading || !revisionReason.trim()}
                          className="bg-amber-500 text-white hover:bg-amber-600"
                        >
                          {revisionLoading ? <Spinner size="sm" /> : 'Submit Revision Request'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(milestone.status === 'PAID' || milestone.status === 'APPROVED') && (
                <div className="mt-4 space-y-3">
                  {isHourly && (
                    <TimeEntryLogger
                      contractId={contract.id}
                      milestoneId={milestone.id}
                      isFreelancer={false}
                      editable={false}
                      initialEntries={milestone.timeEntries}
                    />
                  )}
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Completed {milestone.approvedAt && `on ${formatDate(milestone.approvedAt)}`}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
