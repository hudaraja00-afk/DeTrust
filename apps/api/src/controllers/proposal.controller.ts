import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, ForbiddenError } from '../middleware';
import { proposalService } from '../services';
import { CreateProposalInput, UpdateProposalInput, AcceptProposalInput, GetProposalsQuery } from '../validators';

/**
 * Create a proposal for a job
 * POST /api/jobs/:jobId/proposals
 */
export const createProposal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const userRole = authReq.userRole;
    const jobId = req.params.jobId;

    if (userRole !== 'FREELANCER') {
      throw new ForbiddenError('Only freelancers can submit proposals');
    }

    const data = req.body as CreateProposalInput;
    const proposal = await proposalService.createProposal(userId, jobId, data);

    res.status(201).json({
      success: true,
      data: proposal,
      message: 'Proposal submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a proposal
 * PATCH /api/proposals/:id
 */
export const updateProposal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const proposalId = req.params.id;
    const data = req.body as UpdateProposalInput;

    const proposal = await proposalService.updateProposal(proposalId, userId, data);

    res.json({
      success: true,
      data: proposal,
      message: 'Proposal updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a proposal by ID
 * GET /api/proposals/:id
 */
export const getProposal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const proposalId = req.params.id;

    const proposal = await proposalService.getProposalById(proposalId, userId);

    res.json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get proposals for a job (client only)
 * GET /api/jobs/:jobId/proposals
 */
export const getJobProposals = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const jobId = req.params.jobId;
    const query = req.query as unknown as GetProposalsQuery;

    const proposals = await proposalService.getJobProposals(jobId, userId, query);

    res.json({
      success: true,
      data: proposals,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get freelancer's proposals
 * GET /api/proposals/mine
 */
export const getMyProposals = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const userRole = authReq.userRole;

    if (userRole !== 'FREELANCER') {
      throw new ForbiddenError('Only freelancers can access this endpoint');
    }

    const query = req.query as unknown as GetProposalsQuery;
    const proposals = await proposalService.getFreelancerProposals(userId, query);

    res.json({
      success: true,
      data: proposals,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Withdraw a proposal
 * POST /api/proposals/:id/withdraw
 */
export const withdrawProposal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const proposalId = req.params.id;

    const proposal = await proposalService.withdrawProposal(proposalId, userId);

    res.json({
      success: true,
      data: proposal,
      message: 'Proposal withdrawn successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept a proposal (client only)
 * POST /api/proposals/:id/accept
 */
export const acceptProposal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const userRole = authReq.userRole;
    const proposalId = req.params.id;

    if (userRole !== 'CLIENT') {
      throw new ForbiddenError('Only clients can accept proposals');
    }

    const data = req.body as AcceptProposalInput;
    const result = await proposalService.acceptProposal(proposalId, userId, data);

    res.json({
      success: true,
      data: result,
      message: 'Proposal accepted and contract created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a proposal (client only)
 * POST /api/proposals/:id/reject
 */
export const rejectProposal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const userRole = authReq.userRole;
    const proposalId = req.params.id;

    if (userRole !== 'CLIENT') {
      throw new ForbiddenError('Only clients can reject proposals');
    }

    const { reason } = req.body;
    const proposal = await proposalService.rejectProposal(proposalId, userId, reason);

    res.json({
      success: true,
      data: proposal,
      message: 'Proposal rejected',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Shortlist a proposal (client only)
 * POST /api/proposals/:id/shortlist
 */
export const shortlistProposal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const userRole = authReq.userRole;
    const proposalId = req.params.id;

    if (userRole !== 'CLIENT') {
      throw new ForbiddenError('Only clients can shortlist proposals');
    }

    const proposal = await proposalService.shortlistProposal(proposalId, userId);

    res.json({
      success: true,
      data: proposal,
      message: 'Proposal shortlisted',
    });
  } catch (error) {
    next(error);
  }
};
