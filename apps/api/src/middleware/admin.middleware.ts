import { Request, Response, NextFunction } from 'express';

import { ApiErrorCode } from '@detrust/types';

/**
 * Role-based authorization middleware
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: ApiErrorCode.UNAUTHORIZED,
          message: 'Authentication required',
        },
      });
      return;
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: ApiErrorCode.FORBIDDEN,
          message: 'Insufficient permissions',
        },
      });
      return;
    }
    
    next();
  };
};

/**
 * Require FREELANCER role
 */
export const requireFreelancer = requireRole('FREELANCER');

/**
 * Require CLIENT role
 */
export const requireClient = requireRole('CLIENT');

/**
 * Require ADMIN role
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Require either CLIENT or FREELANCER role
 */
export const requireUser = requireRole('CLIENT', 'FREELANCER', 'ADMIN');

export default requireRole;
