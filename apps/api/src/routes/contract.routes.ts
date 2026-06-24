import { Router } from 'express';
import { authenticate } from '../middleware';
import { contractController } from '../controllers/contract.controller';
import { timeEntryController } from '../controllers/timeEntry.controller';

const router: Router = Router();

// =============================================================================
// CONTRACT ROUTES
// =============================================================================

// List contracts for the authenticated user
router.get('/', authenticate, contractController.listContracts);

// Get payment history
router.get('/payments', authenticate, contractController.getPaymentHistory);

// Get payment stats
router.get('/payments/stats', authenticate, contractController.getPaymentStats);

// Get a single contract
router.get('/:contractId', authenticate, contractController.getContract);

// Fund escrow (client only)
router.post('/:contractId/fund', authenticate, contractController.fundEscrow);

// Complete contract
router.post('/:contractId/complete', authenticate, contractController.completeContract);

// Raise dispute
router.post('/:contractId/dispute', authenticate, contractController.raiseDispute);

// Submit milestone deliverable (freelancer only)
router.post('/:contractId/milestones/:milestoneId/submit', authenticate, contractController.submitMilestone);

// Approve milestone (client only)
router.post('/:contractId/milestones/:milestoneId/approve', authenticate, contractController.approveMilestone);

// Request revision (client only)
router.post('/:contractId/milestones/:milestoneId/revision', authenticate, contractController.requestRevision);

// =============================================================================
// TIME ENTRY ROUTES (hourly contracts)
// =============================================================================

// List time entries for a milestone
router.get('/:contractId/milestones/:milestoneId/time-entries', authenticate, timeEntryController.listTimeEntries);

// Create a time entry (freelancer only)
router.post('/:contractId/milestones/:milestoneId/time-entries', authenticate, timeEntryController.createTimeEntry);

// Update a time entry (freelancer only)
router.put('/:contractId/milestones/:milestoneId/time-entries/:entryId', authenticate, timeEntryController.updateTimeEntry);

// Delete a time entry (freelancer only)
router.delete('/:contractId/milestones/:milestoneId/time-entries/:entryId', authenticate, timeEntryController.deleteTimeEntry);

export default router;
