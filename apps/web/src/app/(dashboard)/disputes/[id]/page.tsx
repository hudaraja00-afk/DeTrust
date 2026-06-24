'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  Scale,
  CheckCircle2,
  Clock,
  FileText,
  User,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import type { DisputeVote, DisputeEvidence } from '@detrust/types';
import {
  useDispute,
  useCastVote,
  useAdminResolve,
  useStartVoting,
  useJurorEligibility,
  useSubmitEvidence,
  useUploadEvidence,
} from '@/hooks/queries/use-disputes';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';
import { openSecureFileInNewTab } from '@/lib/secure-files';

/** Detect evidence URLs that are inaccessible SHA-256 fallback hashes */
function isSha256Evidence(url: string): boolean {
  return /^(ipfs:\/\/)?sha256:/i.test(url);
}

/** Detect evidence URLs stored as secure API uploads */
function isSecureApiUpload(url: string): boolean {
  return /\/api\/uploads\//.test(url);
}

interface DisputeContract {
  id: string;
  title: string;
  totalAmount: number;
  clientId?: string;
  freelancerId?: string;
  client?: { id: string; name: string | null; avatarUrl: string | null };
  freelancer?: { id: string; name: string | null; avatarUrl: string | null };
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  OPEN: { icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Open' },
  VOTING: { icon: <Scale className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Voting' },
  RESOLVED: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Resolved' },
  APPEALED: { icon: <Clock className="h-4 w-4" />, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Appealed' },
};

const outcomeLabels: Record<string, string> = {
  PENDING: 'Pending',
  CLIENT_WINS: 'Client Wins',
  FREELANCER_WINS: 'Freelancer Wins',
  SPLIT: 'Split Decision',
};

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const disputeId = params.id as string;

  const { data: dispute, isLoading } = useDispute(disputeId);
  const castVoteMutation = useCastVote();
  const adminResolveMutation = useAdminResolve();
  const startVotingMutation = useStartVoting();
  const submitEvidenceMutation = useSubmitEvidence();
  const uploadEvidenceMutation = useUploadEvidence();

  // Juror eligibility check (only meaningful during VOTING phase)
  const { data: eligibility } = useJurorEligibility(disputeId);

  const [voteChoice, setVoteChoice] = useState<'CLIENT_WINS' | 'FREELANCER_WINS' | ''>('');
  const [reasoning, setReasoning] = useState('');
  const [resolution, setResolution] = useState('');
  const [resolveOutcome, setResolveOutcome] = useState<'CLIENT_WINS' | 'FREELANCER_WINS' | 'SPLIT'>('CLIENT_WINS');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [openingEvidenceId, setOpeningEvidenceId] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN';
  const disputeContract = dispute?.contract as DisputeContract | undefined;
  const isParty = disputeContract
    && (user?.id === disputeContract.clientId || user?.id === disputeContract.freelancerId);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <Shield className="mb-4 h-12 w-12 text-dt-text-muted opacity-40" />
        <h2 className="text-lg font-medium text-dt-text">Dispute not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/disputes')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Disputes
        </Button>
      </div>
    );
  }

  const status = statusConfig[dispute.status] ?? statusConfig.OPEN;
  const contract = dispute.contract as DisputeContract;

  const handleCastVote = async () => {
    if (!voteChoice) {
      toast.error('Please select a vote');
      return;
    }
    const res = await castVoteMutation.mutateAsync({
      disputeId,
      input: { vote: voteChoice, reasoning: reasoning || undefined },
    });
    if (res.success) {
      toast.success('Vote cast successfully');
      setVoteChoice('');
      setReasoning('');
    } else {
      toast.error(res.error?.message ?? 'Failed to cast vote');
    }
  };

  const handleAdminResolve = async () => {
    if (resolution.length < 10) {
      toast.error('Resolution must be at least 10 characters');
      return;
    }
    const res = await adminResolveMutation.mutateAsync({
      disputeId,
      input: { outcome: resolveOutcome, resolution },
    });
    if (res.success) {
      toast.success('Dispute resolved');
    } else {
      toast.error(res.error?.message ?? 'Failed to resolve dispute');
    }
  };

  const handleStartVoting = async () => {
    const res = await startVotingMutation.mutateAsync(disputeId);
    if (res.success) {
      toast.success('Voting phase started');
    } else {
      toast.error(res.error?.message ?? 'Failed to start voting');
    }
  };

  const handleSubmitEvidence = async () => {
    if (evidenceFiles.length === 0) {
      toast.error('Please select at least one evidence file');
      return;
    }
    if (evidenceDesc.length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }
    if (evidenceFiles.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }
    const res = await uploadEvidenceMutation.mutateAsync({
      disputeId,
      files: evidenceFiles,
      description: evidenceDesc,
    });
    if (res.success) {
      toast.success('Evidence uploaded to IPFS successfully');
      setEvidenceFiles([]);
      setEvidenceDesc('');
    } else {
      toast.error(res.error?.message ?? 'Failed to upload evidence');
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button + Header */}
      <div>
        <button
          onClick={() => router.push('/disputes')}
          className="mb-3 flex items-center gap-1 text-sm text-dt-text-muted hover:text-dt-text"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Disputes
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-dt-text">
            Dispute: {contract?.title ?? 'Unknown Contract'}
          </h1>
          <Badge className={cn('flex items-center gap-1', status.color)}>
            {status.icon}
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-dt-border bg-dt-surface">
          <CardContent className="p-4">
            <p className="text-xs text-dt-text-muted">Contract Value</p>
            <p className="mt-1 text-xl font-semibold text-dt-text">
              ${contract?.totalAmount ? Number(contract.totalAmount).toLocaleString() : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-dt-border bg-dt-surface">
          <CardContent className="p-4">
            <p className="text-xs text-dt-text-muted">Outcome</p>
            <p className="mt-1 text-xl font-semibold text-dt-text">
              {outcomeLabels[dispute.outcome] ?? 'Pending'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-dt-border bg-dt-surface">
          <CardContent className="p-4">
            <p className="text-xs text-dt-text-muted">Client Votes</p>
            <p className="mt-1 text-xl font-semibold text-blue-600">{dispute.clientVotes}</p>
          </CardContent>
        </Card>
        <Card className="border-dt-border bg-dt-surface">
          <CardContent className="p-4">
            <p className="text-xs text-dt-text-muted">Freelancer Votes</p>
            <p className="mt-1 text-xl font-semibold text-emerald-600">{dispute.freelancerVotes}</p>
          </CardContent>
        </Card>
      </div>

      {/* Dispute Details */}
      <Card className="border-dt-border bg-dt-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-dt-text">
            <FileText className="h-5 w-5" /> Dispute Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-dt-text-muted">Reason</p>
            <p className="mt-1 text-dt-text">{dispute.reason}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-dt-text-muted">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-dt-text">{dispute.description}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-dt-text-muted">
            <span>Filed: {new Date(dispute.createdAt).toLocaleDateString()}</span>
            {dispute.votingDeadline && (
              <span>Voting Deadline: {new Date(dispute.votingDeadline).toLocaleDateString()}</span>
            )}
            {dispute.resolvedAt && (
              <span>Resolved: {new Date(dispute.resolvedAt).toLocaleDateString()}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parties */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-dt-border bg-dt-surface">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-dt-text-muted">Client</p>
              <p className="font-medium text-dt-text">{contract?.client?.name ?? '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-dt-border bg-dt-surface">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-dt-text-muted">Freelancer</p>
              <p className="font-medium text-dt-text">{contract?.freelancer?.name ?? '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evidence / Proof */}
      <Card className="border-dt-border bg-dt-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-dt-text">
            <FileText className="h-5 w-5" /> Evidence &amp; Proof
            {(() => {
              const count = (dispute.evidenceItems as DisputeEvidence[] | undefined)?.length ?? dispute.evidence?.length ?? 0;
              return count > 0 ? (
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {count} file{count !== 1 ? 's' : ''}
                </Badge>
              ) : null;
            })()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(dispute.evidenceItems as DisputeEvidence[] | undefined)?.length ? (
            <div className="space-y-3">
              {(dispute.evidenceItems as DisputeEvidence[]).map((item) => {
                const url = item.url;
                const sha256 = isSha256Evidence(url);
                const secureUpload = isSecureApiUpload(url);
                const isImage = !sha256 && /\.(png|jpe?g|gif|webp|svg)$/i.test(url);
                const isPdf = !sha256 && /\.pdf$/i.test(url);
                const fileName = item.fileName ?? url.split('/').pop() ?? 'Evidence file';

                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-xl border border-dt-border"
                  >
                    {/* Party attribution header */}
                    <div className="flex items-center justify-between bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-dt-text">
                        <User className="h-3.5 w-3.5" />
                        {item.uploadedBy?.name ?? 'Unknown'}
                      </span>
                      <span className="text-xs text-dt-text-muted">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* SHA-256 fallback: file was never uploaded to IPFS */}
                    {sha256 ? (
                      <div className="flex items-start gap-3 border-t border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                        <div>
                          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                            Evidence unavailable
                          </p>
                          <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                            This file ({fileName}) was uploaded before IPFS integration was fixed.
                            The party should re-upload the evidence.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Preview for images */}
                        {isImage && !secureUpload && (
                          <div className="relative bg-slate-50 p-4 dark:bg-slate-800/50">
                            <img
                              src={url}
                              alt={`Evidence by ${item.uploadedBy?.name ?? 'Unknown'}`}
                              className="mx-auto max-h-64 rounded-lg object-contain"
                            />
                          </div>
                        )}

                        {/* Embedded PDF viewer */}
                        {isPdf && !secureUpload && (
                          <div className="bg-slate-50 dark:bg-slate-800/50">
                            <iframe
                              src={url}
                              title={`Evidence PDF — ${fileName}`}
                              className="h-80 w-full border-0"
                            />
                          </div>
                        )}

                        {/* File info + download link */}
                        {secureUpload ? (
                          <button
                            type="button"
                            disabled={openingEvidenceId === item.id}
                            onClick={async () => {
                              setOpeningEvidenceId(item.id);
                              try {
                                await openSecureFileInNewTab(url, { token: api.getToken() ?? undefined });
                              } catch {
                                toast.error('Failed to open evidence file');
                              } finally {
                                setOpeningEvidenceId(null);
                              }
                            }}
                            className="flex w-full items-center gap-3 p-3 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                              <p className="truncate font-medium text-dt-text">{fileName}</p>
                              <p className="text-xs text-dt-text-muted">
                                {isImage ? 'Image' : isPdf ? 'PDF Document' : 'File'}
                                {item.fileSize ? ` · ${(item.fileSize / 1024).toFixed(0)} KB` : ''}
                                {item.description ? ` · ${item.description}` : ''}
                              </p>
                            </div>
                            {openingEvidenceId === item.id ? (
                              <Spinner size="sm" />
                            ) : (
                              <ArrowLeft className="h-4 w-4 rotate-180 text-dt-text-muted" />
                            )}
                          </button>
                        ) : (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-dt-text">{fileName}</p>
                              <p className="text-xs text-dt-text-muted">
                                {isImage ? 'Image' : isPdf ? 'PDF Document' : 'File'}
                                {item.fileSize ? ` · ${(item.fileSize / 1024).toFixed(0)} KB` : ''}
                                {item.description ? ` · ${item.description}` : ''}
                              </p>
                            </div>
                            <ArrowLeft className="h-4 w-4 rotate-180 text-dt-text-muted" />
                          </a>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : dispute.evidence && dispute.evidence.length > 0 ? (
            <div className="space-y-3">
              {dispute.evidence.map((url: string, idx: number) => {
                const sha256 = isSha256Evidence(url);
                const secureUpload = isSecureApiUpload(url);
                const isImage = !sha256 && /\.(png|jpe?g|gif|webp|svg)$/i.test(url);
                const isPdf = !sha256 && /\.pdf$/i.test(url);
                const fileName = url.split('/').pop() ?? `Evidence file ${idx + 1}`;

                return (
                  <div
                    key={idx}
                    className="overflow-hidden rounded-xl border border-dt-border"
                  >
                    {sha256 ? (
                      <div className="flex items-start gap-3 bg-amber-50 p-4 dark:bg-amber-950/30">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                        <div>
                          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                            Evidence unavailable
                          </p>
                          <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                            This file was uploaded before IPFS integration was fixed.
                            The party should re-upload the evidence.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {isImage && !secureUpload && (
                          <div className="relative bg-slate-50 p-4 dark:bg-slate-800/50">
                            <img
                              src={url}
                              alt={`Evidence ${idx + 1}`}
                              className="mx-auto max-h-64 rounded-lg object-contain"
                            />
                          </div>
                        )}
                        {isPdf && !secureUpload && (
                          <div className="bg-slate-50 dark:bg-slate-800/50">
                            <iframe
                              src={url}
                              title={`Evidence PDF ${idx + 1}`}
                              className="h-80 w-full border-0"
                            />
                          </div>
                        )}
                        {secureUpload ? (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await openSecureFileInNewTab(url, { token: api.getToken() ?? undefined });
                              } catch {
                                toast.error('Failed to open evidence file');
                              }
                            }}
                            className="flex w-full items-center gap-3 p-3 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                              <p className="truncate font-medium text-dt-text">{fileName}</p>
                              <p className="text-xs text-dt-text-muted">Secure upload · Click to open</p>
                            </div>
                            <ArrowLeft className="h-4 w-4 rotate-180 text-dt-text-muted" />
                          </button>
                        ) : (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-dt-text">{fileName}</p>
                              <p className="text-xs text-dt-text-muted">
                                {isImage ? 'Image' : isPdf ? 'PDF Document' : 'File'} · Click to open
                              </p>
                            </div>
                            <ArrowLeft className="h-4 w-4 rotate-180 text-dt-text-muted" />
                          </a>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <FileText className="h-6 w-6 text-dt-text-muted" />
              </div>
              <p className="text-sm font-medium text-dt-text">No evidence submitted yet</p>
              <p className="mt-1 text-xs text-dt-text-muted">
                Parties can submit evidence files while the dispute is open.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Votes */}
      {dispute.votes && dispute.votes.length > 0 && (
        <Card className="border-dt-border bg-dt-surface">
          <CardHeader>
            <CardTitle className="text-dt-text">Votes ({dispute.votes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dispute.votes.map((vote: DisputeVote) => (
                <div
                  key={vote.id}
                  className="flex items-start justify-between rounded-lg border border-dt-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-dt-text">
                      {vote.juror?.name ?? 'Anonymous Juror'}
                    </p>
                    {vote.reasoning && (
                      <p className="mt-1 text-sm text-dt-text-muted">{vote.reasoning}</p>
                    )}
                  </div>
                  <Badge
                    className={cn(
                      'text-xs',
                      vote.vote === 'CLIENT_WINS'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    )}
                  >
                    {outcomeLabels[vote.vote]} (×{vote.weight})
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Additional Evidence (for parties, OPEN status only) */}
      {dispute.status === 'OPEN' && isParty && (
        <Card className="border-dt-border bg-dt-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-dt-text">
              <FileText className="h-5 w-5" /> Upload Evidence Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label
                htmlFor="evidence-files"
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-dt-border p-6 transition hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/20"
              >
                <FileText className="mb-2 h-8 w-8 text-dt-text-muted" />
                <span className="text-sm font-medium text-dt-text">
                  {evidenceFiles.length > 0
                    ? `${evidenceFiles.length} file${evidenceFiles.length > 1 ? 's' : ''} selected`
                    : 'Click to select files'}
                </span>
                <span className="mt-1 text-xs text-dt-text-muted">
                  PDF, images, Office docs, ZIP — max 5 files, 25 MB each
                </span>
                <input
                  id="evidence-files"
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.7z,.tar,.gz,.txt,.mp4,.webm,.mp3,.ogg"
                  className="hidden"
                  onChange={(e) => {
                    const selected = Array.from(e.target.files ?? []);
                    if (selected.length > 5) {
                      toast.error('Maximum 5 files allowed');
                      return;
                    }
                    setEvidenceFiles(selected);
                  }}
                />
              </label>
              {evidenceFiles.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {evidenceFiles.map((f, i) => (
                    <li key={i} className="flex items-center justify-between rounded-md bg-dt-surface-alt px-3 py-1.5 text-xs text-dt-text">
                      <span className="truncate">{f.name}</span>
                      <span className="ml-2 shrink-0 text-dt-text-muted">{(f.size / 1024).toFixed(0)} KB</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Textarea
              value={evidenceDesc}
              onChange={(e) => setEvidenceDesc(e.target.value)}
              placeholder="Describe this evidence (min 10 chars)..."
              rows={2}
              className="border-dt-border"
            />
            <Button
              onClick={handleSubmitEvidence}
              disabled={evidenceFiles.length === 0 || evidenceDesc.length < 10 || uploadEvidenceMutation.isPending}
              size="sm"
            >
              {uploadEvidenceMutation.isPending ? <Spinner size="sm" /> : 'Upload to IPFS'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Vote Panel (for eligible non-parties during VOTING) */}
      {dispute.status === 'VOTING' && !isParty && (
        <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-dt-text">
              <Scale className="h-5 w-5 text-blue-500" /> Cast Your Vote
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Eligibility check */}
            {eligibility && !eligibility.eligible ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  You are not eligible to vote on this dispute.
                </p>
                <ul className="mt-2 space-y-1 text-xs text-amber-600 dark:text-amber-500">
                  {eligibility.isParty && <li>• You are a party to this dispute</li>}
                  {eligibility.hasVoted && <li>• You have already voted</li>}
                  {!eligibility.meetsScoreRequirement && (
                    <li>
                      • Your trust score ({eligibility.trustScore.toFixed(1)}) is below the
                      minimum ({eligibility.minimumRequired})
                    </li>
                  )}
                  {!eligibility.withinDeadline && <li>• The voting deadline has passed</li>}
                </ul>
              </div>
            ) : (
              <>
                <div className="flex gap-3">
                  <Button
                    variant={voteChoice === 'CLIENT_WINS' ? 'default' : 'outline'}
                    onClick={() => setVoteChoice('CLIENT_WINS')}
                    className={cn(
                      voteChoice === 'CLIENT_WINS' && 'bg-blue-600 text-white hover:bg-blue-700'
                    )}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" /> Client Wins
                  </Button>
                  <Button
                    variant={voteChoice === 'FREELANCER_WINS' ? 'default' : 'outline'}
                    onClick={() => setVoteChoice('FREELANCER_WINS')}
                    className={cn(
                      voteChoice === 'FREELANCER_WINS' && 'bg-emerald-600 text-white hover:bg-emerald-700'
                    )}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" /> Freelancer Wins
                  </Button>
                </div>
                <Textarea
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  placeholder="Optional: explain your reasoning..."
                  rows={3}
                  className="border-dt-border"
                />
                <Button
                  onClick={handleCastVote}
                  disabled={!voteChoice || castVoteMutation.isPending}
                >
                  {castVoteMutation.isPending ? <Spinner size="sm" /> : 'Submit Vote'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin Actions */}
      {isAdmin && dispute.status !== 'RESOLVED' && (
        <Card className="border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-dt-text">
              <Shield className="h-5 w-5 text-amber-500" /> Admin Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dispute.status === 'OPEN' && (
              <Button
                onClick={handleStartVoting}
                disabled={startVotingMutation.isPending}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {startVotingMutation.isPending ? <Spinner size="sm" /> : 'Start Voting Phase'}
              </Button>
            )}

            <div className="border-t border-dt-border pt-4">
              <p className="mb-3 text-sm font-medium text-dt-text">Direct Resolution</p>
              <div className="space-y-3">
                <select
                  value={resolveOutcome}
                  onChange={(e) => setResolveOutcome(e.target.value as typeof resolveOutcome)}
                  className="w-full rounded-lg border border-dt-border bg-dt-surface px-3 py-2 text-sm text-dt-text"
                >
                  <option value="CLIENT_WINS">Client Wins</option>
                  <option value="FREELANCER_WINS">Freelancer Wins</option>
                  <option value="SPLIT">Split Decision</option>
                </select>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Explain the resolution (min 10 chars)..."
                  rows={3}
                  className="border-dt-border"
                />
                <Button
                  onClick={handleAdminResolve}
                  disabled={resolution.length < 10 || adminResolveMutation.isPending}
                  className="bg-amber-600 text-white hover:bg-amber-700"
                >
                  {adminResolveMutation.isPending ? <Spinner size="sm" /> : 'Resolve Dispute'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolution result */}
      {dispute.status === 'RESOLVED' && dispute.resolution && (
        <Card className="border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" /> Resolution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium text-dt-text">
              Outcome: {outcomeLabels[dispute.outcome] ?? dispute.outcome}
            </p>
            <p className="whitespace-pre-wrap text-sm text-dt-text-muted">{dispute.resolution}</p>
            {dispute.resolutionTxHash && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                <p className="text-xs font-medium text-green-700 dark:text-green-400">
                  On-chain Resolution
                </p>
                <p className="mt-1 font-mono text-xs text-dt-text-muted break-all">
                  Tx: {dispute.resolutionTxHash}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
