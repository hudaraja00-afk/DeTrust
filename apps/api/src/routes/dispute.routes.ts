import { Router } from 'express';
import { authenticate, requireAdmin, validateBody } from '../middleware';
import { disputeController } from '../controllers/dispute.controller';
import { evidenceUpload } from '../middleware/upload.middleware';
import {
  createDisputeSchema,
  submitEvidenceSchema,
  castVoteSchema,
  adminResolveSchema,
} from '../validators/dispute.validator';

const router: Router = Router();

// List disputes (authenticated — shows own disputes; admin sees all)
router.get('/', authenticate, disputeController.listDisputes);

// Get a single dispute by ID
router.get('/:disputeId', authenticate, disputeController.getDispute);

// Check juror eligibility for a dispute (M4-I5)
router.get('/:disputeId/eligibility', authenticate, disputeController.checkEligibility);

// Create a new dispute (M5-I1)
router.post('/', authenticate, validateBody(createDisputeSchema), disputeController.createDispute);

// Submit additional evidence — URL-based (M5-I3, legacy)
router.post('/:disputeId/evidence', authenticate, validateBody(submitEvidenceSchema), disputeController.submitEvidence);

// Upload evidence files via IPFS (multipart/form-data, max 5 files × 25 MB)
router.post('/:disputeId/evidence/upload', authenticate, evidenceUpload, disputeController.uploadEvidence);

// Admin: start voting phase (M5-I4)
router.post('/:disputeId/start-voting', authenticate, requireAdmin, disputeController.startVoting);

// Cast a vote (juror or admin) (M5-I5)
router.post('/:disputeId/vote', authenticate, validateBody(castVoteSchema), disputeController.castVote);

// Admin: directly resolve a dispute (hybrid model)
router.post('/:disputeId/resolve', authenticate, requireAdmin, validateBody(adminResolveSchema), disputeController.adminResolve);

export default router;
