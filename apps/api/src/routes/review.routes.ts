import { Router } from 'express';
import { authenticate, optionalAuth, validateBody, validateQuery } from '../middleware';
import { reviewController } from '../controllers/review.controller';
import { createReviewSchema, createReviewResponseSchema, getReviewsQuerySchema } from '../validators/review.validator';

const router: Router = Router();

// Submit a review (authenticated users only)
router.post('/', authenticate, validateBody(createReviewSchema), reviewController.submitReview);

// Get reviews for a specific contract (optional auth for double-blind)
router.get('/contract/:contractId', optionalAuth, reviewController.getContractReviews);

// Check if current user has reviewed a contract
router.get('/contract/:contractId/status', authenticate, reviewController.getReviewStatus);

// Get reviews for a specific user (optional auth for double-blind, Zod-validated query)
router.get('/user/:userId', optionalAuth, validateQuery(getReviewsQuerySchema), reviewController.getUserReviews);

// Get aggregated review summary for a user (public, but log viewer if authenticated)
router.get('/user/:userId/summary', optionalAuth, reviewController.getReviewSummary);

// Submit a response/rebuttal to a review (M3-I6)
router.post('/:reviewId/response', authenticate, validateBody(createReviewResponseSchema), reviewController.submitResponse);

export default router;