import { getIO } from '../config/socket';
import type { TrustScoreBreakdown } from '../services/trustScore.service';

/**
 * Emit trust score update events via Socket.io.
 * Fires on: review submissions, dispute resolutions, daily cron, on-demand API calls.
 */
export function emitTrustScoreUpdated(
  userId: string,
  breakdown: TrustScoreBreakdown,
): void {
  const io = getIO();
  if (!io) return;

  io.to(`user:${userId}`).emit('trust-score:updated', {
    userId,
    totalScore: breakdown.totalScore,
    eligible: breakdown.eligible,
    components: breakdown.components,
    type: 'TRUST_SCORE_UPDATED',
  });
}
