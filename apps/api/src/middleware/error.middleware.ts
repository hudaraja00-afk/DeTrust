import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

import { config } from '../config';
import { ApiErrorCode } from '@detrust/types';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, unknown>;
  public isOperational: boolean;
  
  constructor(
    message: string,
    statusCode: number = 500,
    code: string = ApiErrorCode.INTERNAL_ERROR,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Pre-defined errors
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, ApiErrorCode.NOT_FOUND);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, ApiErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, ApiErrorCode.FORBIDDEN);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: Record<string, unknown>) {
    super(message, 400, ApiErrorCode.VALIDATION_ERROR, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, ApiErrorCode.CONFLICT);
  }
}

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      code: ApiErrorCode.NOT_FOUND,
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};

/**
 * Global error handler
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Zod validation error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    
    res.status(400).json({
      success: false,
      error: {
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: { errors: formattedErrors },
      },
    });
    return;
  }
  
  // Prisma known errors — map common codes to meaningful HTTP responses
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // Unique constraint violation
      res.status(409).json({
        success: false,
        error: {
          code: ApiErrorCode.CONFLICT,
          message: 'A unique constraint was violated. The resource already exists.',
        },
      });
      return;
    }
    if (err.code === 'P2025') {
      // Record not found for update/delete
      res.status(404).json({
        success: false,
        error: { code: ApiErrorCode.NOT_FOUND, message: 'Record not found' },
      });
      return;
    }
  }

  // Custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        ...(config.isDev && { stack: err.stack }),
      },
    });
    return;
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', err);
  
  // Generic server error
  res.status(500).json({
    success: false,
    error: {
      code: ApiErrorCode.INTERNAL_ERROR,
      message: config.isDev ? err.message : 'Internal server error',
      ...(config.isDev && { stack: err.stack }),
    },
  });
};

export default errorHandler;
