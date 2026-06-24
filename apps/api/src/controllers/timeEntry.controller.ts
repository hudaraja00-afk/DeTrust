import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, ForbiddenError } from '../middleware';
import { timeEntryService } from '../services/timeEntry.service';
import { createTimeEntrySchema, updateTimeEntrySchema } from '../validators/timeEntry.validator';

/**
 * List time entries for a milestone
 * GET /api/contracts/:contractId/milestones/:milestoneId/time-entries
 */
export const listTimeEntries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const { contractId, milestoneId } = req.params;

    const result = await timeEntryService.getTimeEntries(contractId, milestoneId, userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a time entry
 * POST /api/contracts/:contractId/milestones/:milestoneId/time-entries
 */
export const createTimeEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const freelancerId = authReq.userId!;
    const userRole = authReq.userRole;
    const { contractId, milestoneId } = req.params;

    if (userRole !== 'FREELANCER') {
      throw new ForbiddenError('Only freelancers can log time entries');
    }

    const data = createTimeEntrySchema.parse(req.body);
    const entry = await timeEntryService.createTimeEntry(contractId, milestoneId, freelancerId, data);
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a time entry
 * PUT /api/contracts/:contractId/milestones/:milestoneId/time-entries/:entryId
 */
export const updateTimeEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const freelancerId = authReq.userId!;
    const userRole = authReq.userRole;
    const { contractId, milestoneId, entryId } = req.params;

    if (userRole !== 'FREELANCER') {
      throw new ForbiddenError('Only freelancers can update time entries');
    }

    const data = updateTimeEntrySchema.parse(req.body);
    const entry = await timeEntryService.updateTimeEntry(contractId, milestoneId, entryId, freelancerId, data);
    res.json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a time entry
 * DELETE /api/contracts/:contractId/milestones/:milestoneId/time-entries/:entryId
 */
export const deleteTimeEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const freelancerId = authReq.userId!;
    const userRole = authReq.userRole;
    const { contractId, milestoneId, entryId } = req.params;

    if (userRole !== 'FREELANCER') {
      throw new ForbiddenError('Only freelancers can delete time entries');
    }

    const result = await timeEntryService.deleteTimeEntry(contractId, milestoneId, entryId, freelancerId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const timeEntryController = {
  listTimeEntries,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
};
