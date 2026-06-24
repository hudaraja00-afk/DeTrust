import { Request, Response, NextFunction } from 'express';
import { publicService } from '../services/public.service';

/**
 * GET /api/public/stats
 * No auth — returns only aggregate platform metrics.
 */
const getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await publicService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/public/featured-reviews
 * No auth — returns top-rated public reviews for the landing page.
 */
const getFeaturedReviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 3, 6);
    const reviews = await publicService.getFeaturedReviews(limit);
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

export const publicController = { getStats, getFeaturedReviews };
