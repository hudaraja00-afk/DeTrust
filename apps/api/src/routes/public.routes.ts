import { Router } from 'express';
import { defaultLimiter } from '../middleware';
import { publicController } from '../controllers/public.controller';

const router: Router = Router();

// Public routes — NO authentication required
// Rate limited to prevent abuse on unauthenticated endpoints
router.use(defaultLimiter);

// Aggregate platform statistics (landing page hero numbers)
router.get('/stats', publicController.getStats);

// Top-rated public reviews (landing page testimonials)
router.get('/featured-reviews', publicController.getFeaturedReviews);

export default router;
