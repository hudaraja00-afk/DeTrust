'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Link2, Shield, MessageSquare, Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { AdminReview } from '@/lib/api/admin';

interface AdminReviewTableProps {
  reviews: AdminReview[];
  isLoading?: boolean;
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      <Star className="h-3.5 w-3.5 fill-current" />
      <span className="text-sm font-medium">{Number(rating).toFixed(1)}</span>
    </span>
  );
}

function UserCell({ name, role }: { name: string | null; role: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-dt-text">{name ?? 'Unknown'}</span>
      <span className="text-xs text-dt-text-muted capitalize">{role.toLowerCase()}</span>
    </div>
  );
}

function ExpandedRow({ review }: { review: AdminReview }) {
  const categories = [
    { label: 'Communication', value: review.communicationRating },
    { label: 'Quality', value: review.qualityRating },
    { label: 'Timeliness', value: review.timelinessRating },
    { label: 'Professionalism', value: review.professionalismRating },
  ];

  return (
    <tr>
      <td colSpan={8} className="border-b border-dt-border bg-dt-surface/50 px-6 py-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Comment */}
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase text-dt-text-muted">Comment</h4>
            <p className="text-sm text-dt-text">{review.comment || 'No comment provided'}</p>

            {review.responseText && (
              <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                <h4 className="mb-1 text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">
                  <MessageSquare className="mr-1 inline h-3 w-3" /> Response
                </h4>
                <p className="text-sm text-dt-text">{review.responseText}</p>
                <p className="mt-1 text-xs text-dt-text-muted">
                  {review.responseAt ? new Date(review.responseAt).toLocaleDateString() : ''}
                </p>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-dt-text-muted">Category Ratings</h4>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((c) => (
                  <div key={c.label} className="flex items-center justify-between rounded bg-dt-surface px-2 py-1">
                    <span className="text-xs text-dt-text-muted">{c.label}</span>
                    {c.value ? <RatingStars rating={Number(c.value)} /> : <span className="text-xs text-dt-text-muted">—</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              {review.ipfsHash && (
                <p className="text-xs text-dt-text-muted">
                  <Shield className="mr-1 inline h-3 w-3" /> IPFS: <code className="text-[10px]">{review.ipfsHash.slice(0, 20)}…</code>
                </p>
              )}
              {review.blockchainTxHash && (
                <p className="text-xs text-dt-text-muted">
                  <Link2 className="mr-1 inline h-3 w-3" /> Tx: <code className="text-[10px]">{review.blockchainTxHash.slice(0, 20)}…</code>
                </p>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

export function AdminReviewTable({ reviews, isLoading }: AdminReviewTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-dt-text-muted">Loading reviews…</div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-dt-text-muted">No reviews match your filters.</div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-dt-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-dt-border bg-dt-surface text-xs uppercase text-dt-text-muted">
          <tr>
            <th className="px-4 py-3" />
            <th className="px-4 py-3">Author</th>
            <th className="px-4 py-3">Subject</th>
            <th className="px-4 py-3">Contract</th>
            <th className="px-4 py-3">Rating</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Response</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => {
            const isExpanded = expandedId === review.id;
            return (
              <>
                <tr
                  key={review.id}
                  onClick={() => setExpandedId(isExpanded ? null : review.id)}
                  className="cursor-pointer border-b border-dt-border transition-colors hover:bg-dt-surface/50"
                >
                  <td className="px-4 py-3">
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-dt-text-muted" /> : <ChevronDown className="h-4 w-4 text-dt-text-muted" />}
                  </td>
                  <td className="px-4 py-3"><UserCell name={review.author.name} role={review.author.role} /></td>
                  <td className="px-4 py-3"><UserCell name={review.subject.name} role={review.subject.role} /></td>
                  <td className="px-4 py-3">
                    <span className="max-w-[150px] truncate text-sm text-dt-text">{review.contract.title}</span>
                  </td>
                  <td className="px-4 py-3"><RatingStars rating={Number(review.overallRating)} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Badge variant={review.ipfsHash ? 'default' : 'secondary'} className="text-[10px]">
                        IPFS {review.ipfsHash ? '✅' : '⏳'}
                      </Badge>
                      <Badge variant={review.blockchainTxHash ? 'default' : 'secondary'} className="text-[10px]">
                        Chain {review.blockchainTxHash ? '✅' : '⏳'}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {review.responseText ? (
                      <Badge variant="outline" className="text-[10px]"><MessageSquare className="mr-1 h-3 w-3" /> Yes</Badge>
                    ) : (
                      <span className="text-xs text-dt-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-dt-text-muted">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </td>
                </tr>
                {isExpanded && <ExpandedRow key={`${review.id}-expand`} review={review} />}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
