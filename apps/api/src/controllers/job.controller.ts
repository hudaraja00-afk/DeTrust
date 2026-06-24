import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, ForbiddenError } from '../middleware';
import { jobService } from '../services';
import { CreateJobInput, UpdateJobInput, GetJobsQuery } from '../validators';

/**
 * Create a new job
 * POST /api/jobs
 */
export const createJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const userRole = authReq.userRole;

    if (userRole !== 'CLIENT') {
      throw new ForbiddenError('Only clients can create jobs');
    }

    const data = req.body as CreateJobInput;
    const job = await jobService.createJob(userId, data);

    res.status(201).json({
      success: true,
      data: job,
      message: 'Job created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a job
 * PATCH /api/jobs/:id
 */
export const updateJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const jobId = req.params.id;
    const data = req.body as UpdateJobInput;

    const job = await jobService.updateJob(jobId, userId, data);

    res.json({
      success: true,
      data: job,
      message: 'Job updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a job by ID
 * GET /api/jobs/:id
 */
export const getJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;
    const jobId = req.params.id;

    const job = await jobService.getJobById(jobId, userId);

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List jobs with filters
 * GET /api/jobs
 */
export const listJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;
    const query = req.query as unknown as GetJobsQuery;

    const jobs = await jobService.listJobs(query, userId);

    res.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get client's jobs (including drafts)
 * GET /api/jobs/mine
 */
export const getMyJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const userRole = authReq.userRole;

    if (userRole !== 'CLIENT') {
      throw new ForbiddenError('Only clients can access this endpoint');
    }

    const query = req.query as unknown as GetJobsQuery;
    const jobs = await jobService.getClientJobs(userId, query);

    res.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Publish a job
 * POST /api/jobs/:id/publish
 */
export const publishJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const jobId = req.params.id;

    const job = await jobService.publishJob(jobId, userId);

    res.json({
      success: true,
      data: job,
      message: 'Job published successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a job
 * POST /api/jobs/:id/cancel
 */
export const cancelJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const jobId = req.params.id;

    const job = await jobService.cancelJob(jobId, userId);

    res.json({
      success: true,
      data: job,
      message: 'Job cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a job (DRAFT only)
 * DELETE /api/jobs/:id
 */
export const deleteJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const jobId = req.params.id;

    await jobService.deleteJob(jobId, userId);

    res.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
