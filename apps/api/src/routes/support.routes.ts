import { Router, Response, NextFunction } from 'express';
import { authenticate, type AuthenticatedRequest } from '../middleware';
import { config } from '../config';
import { prisma } from '../config/database';

const router: Router = Router();

/**
 * GET /api/support/admin-id
 * Returns the support admin user ID so the frontend
 * can start a support conversation. If no admin is configured,
 * falls back to the first ADMIN user in the database.
 */
router.get('/admin-id', authenticate, async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let adminId = config.support.adminUserId;

    if (!adminId) {
      // Fallback: pick the first ADMIN user
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN', status: 'ACTIVE' },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      adminId = admin?.id ?? undefined;
    }

    if (!adminId) {
      res.status(404).json({
        success: false,
        error: { message: 'No support admin configured' },
      });
      return;
    }

    // Verify admin user exists
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, name: true, avatarUrl: true },
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        error: { message: 'Support admin user not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        adminId: admin.id,
        adminName: admin.name ?? 'DeTrust Support',
        adminAvatar: admin.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
