import { Router } from 'express';
import { authenticate, optionalAuth, validateBody, validateQuery, validateParams } from '../middleware';
import { jobController, proposalController } from '../controllers';
import {
  createJobSchema,
  updateJobSchema,
  getJobsQuerySchema,
  getJobByIdParamsSchema,
  createProposalSchema,
  getProposalsQuerySchema,
} from '../validators';

const router: Router = Router();

// =============================================================================
// JOB ROUTES
// =============================================================================

// List jobs (public, but optionalAuth for personalized results)
router.get(
  '/',
  optionalAuth,
  validateQuery(getJobsQuerySchema),
  jobController.listJobs
);

// Get client's jobs (including drafts)
router.get(
  '/mine',
  authenticate,
  validateQuery(getJobsQuerySchema),
  jobController.getMyJobs
);

// Get job by ID (public, but optionalAuth for personalized results)
router.get(
  '/:id',
  optionalAuth,
  validateParams(getJobByIdParamsSchema),
  jobController.getJob
);

// Create a job (client only)
router.post(
  '/',
  authenticate,
  validateBody(createJobSchema),
  jobController.createJob
);

// Update a job (client only, DRAFT status only)
router.patch(
  '/:id',
  authenticate,
  validateParams(getJobByIdParamsSchema),
  validateBody(updateJobSchema),
  jobController.updateJob
);

// Publish a job (client only)
router.post(
  '/:id/publish',
  authenticate,
  validateParams(getJobByIdParamsSchema),
  jobController.publishJob
);

// Cancel a job (client only)
router.post(
  '/:id/cancel',
  authenticate,
  validateParams(getJobByIdParamsSchema),
  jobController.cancelJob
);

// Delete a job (client only, DRAFT status only)
router.delete(
  '/:id',
  authenticate,
  validateParams(getJobByIdParamsSchema),
  jobController.deleteJob
);

// =============================================================================
// JOB PROPOSALS ROUTES
// =============================================================================

// Get proposals for a job (client only)
router.get(
  '/:jobId/proposals',
  authenticate,
  validateQuery(getProposalsQuerySchema),
  proposalController.getJobProposals
);

// Submit a proposal to a job (freelancer only)
router.post(
  '/:jobId/proposals',
  authenticate,
  validateBody(createProposalSchema),
  proposalController.createProposal
);

export default router;
