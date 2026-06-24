/**
 * Queue name constants.
 *
 * Every BullMQ queue in the system is registered here so that
 * producers and workers always reference the same string.
 */
export const QUEUE_NAMES = {
  /** Hourly check for expired voting disputes → auto-resolve */
  DISPUTE_AUTO_RESOLVE: 'dispute-auto-resolve',

  /** 15-min email digest for unread notifications */
  EMAIL_DIGEST: 'email-digest',

  /** Hourly auto-approve for stale milestones (7 days without client action) */
  MILESTONE_AUTO_APPROVE: 'milestone-auto-approve',

  /** Daily trust-score recalculation for all profiles */
  TRUST_SCORE_RECALC: 'trust-score-recalc',

  /** 6-hour retry for failed IPFS uploads + blockchain writes */
  BLOCKCHAIN_RETRY: 'blockchain-retry',

  /** On-demand: IPFS + blockchain upload triggered by review creation */
  REVIEW_IPFS_UPLOAD: 'review-ipfs-upload',

  /** On-demand: Trust score recalculation for a single user */
  TRUST_SCORE_USER: 'trust-score-user',

  /** On-demand: Notify eligible jurors when voting starts */
  JUROR_NOTIFICATION: 'juror-notification',

  /** On-demand: Send a single email (SMTP with retry) */
  EMAIL_SEND: 'email-send',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
