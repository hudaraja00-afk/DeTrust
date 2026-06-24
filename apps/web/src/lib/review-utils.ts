/**
 * Shared review label mappings for client vs freelancer reviews.
 * Used by review-form, review-list, and review-summary components.
 */

/** Rating categories when a client reviews a freelancer */
export const CLIENT_REVIEW_LABELS = {
  communication: 'Communication',
  quality: 'Quality',
  timeliness: 'Timeliness',
  professionalism: 'Professionalism',
} as const;

/** Rating categories when a freelancer reviews a client (SRS FE-2: Job Clarity) */
export const FREELANCER_REVIEW_LABELS = {
  communication: 'Communication',
  quality: 'Job Clarity',
  timeliness: 'Payment Promptness',
  professionalism: 'Responsiveness',
} as const;

export type ReviewLabels = typeof CLIENT_REVIEW_LABELS | typeof FREELANCER_REVIEW_LABELS;

/** Get category labels based on whether the reviewer is a client */
export function getReviewLabels(isClientReviewer: boolean): ReviewLabels {
  return isClientReviewer ? CLIENT_REVIEW_LABELS : FREELANCER_REVIEW_LABELS;
}

/** Trust score color thresholds (SRS §8 Trust palette) */
export const TRUST_SCORE_EXCELLENT = 75;
export const TRUST_SCORE_GOOD = 50;
