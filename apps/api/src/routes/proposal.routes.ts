import { Router } from 'express';
import { authenticate, validateBody, validateQuery, validateParams } from '../middleware';
import { proposalController } from '../controllers';
import {
  updateProposalSchema,
  acceptProposalSchema,
  rejectProposalSchema,
  getProposalsQuerySchema,
  getProposalByIdParamsSchema,
} from '../validators';

const router: Router = Router();

// =============================================================================
// PROPOSAL ROUTES
// =============================================================================

// Get freelancer's proposals
router.get(
  '/mine',
  authenticate,
  validateQuery(getProposalsQuerySchema),
  proposalController.getMyProposals
);

// Get proposal by ID
router.get(
  '/:id',
  authenticate,
  validateParams(getProposalByIdParamsSchema),
  proposalController.getProposal
);

// Update a proposal (freelancer only)
router.patch(
  '/:id',
  authenticate,
  validateParams(getProposalByIdParamsSchema),
  validateBody(updateProposalSchema),
  proposalController.updateProposal
);

// Withdraw a proposal (freelancer only)
router.post(
  '/:id/withdraw',
  authenticate,
  validateParams(getProposalByIdParamsSchema),
  proposalController.withdrawProposal
);

// Accept a proposal (client only)
router.post(
  '/:id/accept',
  authenticate,
  validateParams(getProposalByIdParamsSchema),
  validateBody(acceptProposalSchema),
  proposalController.acceptProposal
);

// Reject a proposal (client only)
router.post(
  '/:id/reject',
  authenticate,
  validateParams(getProposalByIdParamsSchema),
  validateBody(rejectProposalSchema),
  proposalController.rejectProposal
);

// Shortlist a proposal (client only)
router.post(
  '/:id/shortlist',
  authenticate,
  validateParams(getProposalByIdParamsSchema),
  proposalController.shortlistProposal
);

export default router;
