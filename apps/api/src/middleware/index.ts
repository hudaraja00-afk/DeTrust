export { authenticate, optionalAuth } from './auth.middleware';
export type { AuthenticatedRequest, TokenPayload } from './auth.middleware';
export { 
  requireRole, 
  requireAdmin, 
  requireClient, 
  requireFreelancer, 
  requireUser 
} from './admin.middleware';
export { validate, validateBody, validateQuery, validateParams } from './validate.middleware';
export { 
  errorHandler, 
  notFoundHandler, 
  AppError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError, 
  ValidationError, 
  ConflictError 
} from './error.middleware';
export { defaultLimiter, authLimiter, strictLimiter } from './rateLimit.middleware';
