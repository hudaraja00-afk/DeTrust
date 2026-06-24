import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, ForbiddenError, ValidationError } from '../middleware';
import { contractService } from '../services/contract.service';
import { ContractStatus } from '@prisma/client';

/**
 * List contracts for the authenticated user
 * GET /api/contracts
 */
export const listContracts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const userRole = authReq.userRole;
    const { status, role, page = '1', limit = '10', sort = 'createdAt', order = 'desc' } = req.query;

    const query = {
      status: status as ContractStatus | undefined,
      role: role as 'client' | 'freelancer' | undefined,
      page: parseInt(page as string, 10),
      limit: Math.min(parseInt(limit as string, 10), 100),
      sort: (sort as 'createdAt' | 'totalAmount') || 'createdAt',
      order: (order as 'asc' | 'desc') || 'desc',
    };

    // Admin sees all contracts; regular users see only their own
    const contracts = userRole === 'ADMIN'
      ? await contractService.listAllContracts(query)
      : await contractService.listContracts(userId, query);
    res.json({ success: true, data: contracts });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single contract
 * GET /api/contracts/:contractId
 */
export const getContract = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const { contractId } = req.params;

    const contract = await contractService.getContractById(contractId, userId);
    res.json({ success: true, data: contract });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment history
 * GET /api/contracts/payments
 */
export const getPaymentHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const { page = '1', limit = '20' } = req.query;

    const query = {
      page: parseInt(page as string, 10),
      limit: Math.min(parseInt(limit as string, 10), 100),
    };

    const payments = await contractService.getPaymentHistory(userId, query);
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment stats
 * GET /api/contracts/payments/stats
 */
export const getPaymentStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;

    const stats = await contractService.getPaymentStats(userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * Fund escrow (client only)
 * POST /api/contracts/:contractId/fund
 */
export const fundEscrow = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const clientId = authReq.userId!;
    const userRole = authReq.userRole;
    const { contractId } = req.params;
    const { txHash, escrowAddress, blockchainJobId } = req.body;

    if (userRole !== 'CLIENT') {
      throw new ForbiddenError('Only clients can fund escrow');
    }

    if (!txHash) {
      throw new ValidationError('Transaction hash is required');
    }

    const contract = await contractService.fundEscrow(contractId, clientId, {
      txHash,
      escrowAddress,
      blockchainJobId,
    });
    res.json({ success: true, data: contract, message: 'Escrow funded successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete contract
 * POST /api/contracts/:contractId/complete
 */
export const completeContract = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const { contractId } = req.params;

    const contract = await contractService.completeContract(contractId, userId);
    res.json({ success: true, data: contract, message: 'Contract completed successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Raise dispute
 * POST /api/contracts/:contractId/dispute
 */
export const raiseDispute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const { contractId } = req.params;
    const { reason, evidence } = req.body;

    if (!reason) {
      throw new ValidationError('Dispute reason is required');
    }

    const contract = await contractService.raiseDispute(contractId, userId, reason, evidence);
    res.json({ success: true, data: contract, message: 'Dispute raised successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit milestone deliverable (freelancer only)
 * POST /api/contracts/:contractId/milestones/:milestoneId/submit
 */
export const submitMilestone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const freelancerId = authReq.userId!;
    const userRole = authReq.userRole;
    const { contractId, milestoneId } = req.params;
    const { deliverableUrl, deliverableHash, deliverableNote } = req.body;

    if (userRole !== 'FREELANCER') {
      throw new ForbiddenError('Only freelancers can submit milestones');
    }

    const milestone = await contractService.submitMilestone(contractId, milestoneId, freelancerId, {
      deliverableUrl,
      deliverableHash,
      deliverableNote,
    });
    res.json({ success: true, data: milestone, message: 'Milestone submitted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve milestone (client only)
 * POST /api/contracts/:contractId/milestones/:milestoneId/approve
 */
export const approveMilestone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const clientId = authReq.userId!;
    const userRole = authReq.userRole;
    const { contractId, milestoneId } = req.params;

    if (userRole !== 'CLIENT') {
      throw new ForbiddenError('Only clients can approve milestones');
    }

    const milestone = await contractService.approveMilestone(contractId, milestoneId, clientId);
    res.json({ success: true, data: milestone, message: 'Milestone approved successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Request revision (client only)
 * POST /api/contracts/:contractId/milestones/:milestoneId/revision
 */
export const requestRevision = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const clientId = authReq.userId!;
    const userRole = authReq.userRole;
    const { contractId, milestoneId } = req.params;
    const { reason } = req.body;

    if (userRole !== 'CLIENT') {
      throw new ForbiddenError('Only clients can request revisions');
    }

    if (!reason) {
      throw new ValidationError('Revision reason is required');
    }

    const milestone = await contractService.requestRevision(contractId, milestoneId, clientId, reason);
    res.json({ success: true, data: milestone, message: 'Revision requested successfully' });
  } catch (error) {
    next(error);
  }
};

export const contractController = {
  listContracts,
  getContract,
  getPaymentHistory,
  getPaymentStats,
  fundEscrow,
  completeContract,
  raiseDispute,
  submitMilestone,
  approveMilestone,
  requestRevision,
};
