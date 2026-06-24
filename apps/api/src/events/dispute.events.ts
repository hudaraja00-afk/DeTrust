import { getIO } from '../config/socket';

/**
 * Emit dispute-related socket events to relevant users.
 */

export function emitDisputeOpened(
  clientId: string,
  freelancerId: string,
  disputeId: string,
  contractTitle: string,
) {
  const io = getIO();
  if (!io) return;

  const payload = { disputeId, contractTitle, type: 'DISPUTE_OPENED' };
  io.to(`user:${clientId}`).emit('dispute:opened', payload);
  io.to(`user:${freelancerId}`).emit('dispute:opened', payload);
}

export function emitDisputeVotingStarted(
  clientId: string,
  freelancerId: string,
  disputeId: string,
) {
  const io = getIO();
  if (!io) return;

  const payload = { disputeId, type: 'DISPUTE_VOTING' };
  io.to(`user:${clientId}`).emit('dispute:voting', payload);
  io.to(`user:${freelancerId}`).emit('dispute:voting', payload);
}

export function emitDisputeResolved(
  clientId: string,
  freelancerId: string,
  disputeId: string,
  outcome: string,
) {
  const io = getIO();
  if (!io) return;

  const payload = { disputeId, outcome, type: 'DISPUTE_RESOLVED' };
  io.to(`user:${clientId}`).emit('dispute:resolved', payload);
  io.to(`user:${freelancerId}`).emit('dispute:resolved', payload);
}
