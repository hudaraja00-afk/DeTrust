import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware';
import { CreateTimeEntryInput, UpdateTimeEntryInput } from '../validators/timeEntry.validator';

export class TimeEntryService {
  /**
   * Get time entries for a milestone (both parties can view)
   */
  async getTimeEntries(contractId: string, milestoneId: string, userId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { clientId: true, freelancerId: true, billingType: true },
    });

    if (!contract) throw new NotFoundError('Contract not found');
    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      throw new ForbiddenError('You do not have access to this contract');
    }

    const milestone = await prisma.milestone.findFirst({
      where: { id: milestoneId, contractId },
    });
    if (!milestone) throw new NotFoundError('Milestone not found');

    const entries = await prisma.timeEntry.findMany({
      where: { milestoneId },
      orderBy: { date: 'asc' },
    });

    const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);

    return { entries, totalHours };
  }

  /**
   * Create a time entry (freelancer only, milestone must be PENDING or IN_PROGRESS)
   */
  async createTimeEntry(contractId: string, milestoneId: string, freelancerId: string, data: CreateTimeEntryInput) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { freelancerId: true, billingType: true, status: true },
    });

    if (!contract) throw new NotFoundError('Contract not found');
    if (contract.freelancerId !== freelancerId) {
      throw new ForbiddenError('Only the freelancer can log time entries');
    }
    if (contract.billingType !== 'HOURLY') {
      throw new ValidationError('Time entries can only be logged for hourly contracts');
    }
    if (contract.status !== 'ACTIVE') {
      throw new ForbiddenError('Contract must be active to log time');
    }

    const milestone = await prisma.milestone.findFirst({
      where: { id: milestoneId, contractId },
    });
    if (!milestone) throw new NotFoundError('Milestone not found');

    if (milestone.status !== 'PENDING' && milestone.status !== 'IN_PROGRESS') {
      throw new ForbiddenError('Cannot log time for a milestone that has been submitted or completed');
    }

    // Upsert: if entry for this date already exists, update it
    const entry = await prisma.timeEntry.upsert({
      where: {
        milestoneId_date: {
          milestoneId,
          date: new Date(data.date),
        },
      },
      create: {
        milestoneId,
        date: new Date(data.date),
        hours: data.hours,
        description: data.description,
      },
      update: {
        hours: data.hours,
        description: data.description,
      },
    });

    // Auto-set milestone to IN_PROGRESS if PENDING
    if (milestone.status === 'PENDING') {
      await prisma.milestone.update({
        where: { id: milestoneId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return entry;
  }

  /**
   * Update a time entry (freelancer only)
   */
  async updateTimeEntry(contractId: string, milestoneId: string, entryId: string, freelancerId: string, data: UpdateTimeEntryInput) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { freelancerId: true },
    });

    if (!contract) throw new NotFoundError('Contract not found');
    if (contract.freelancerId !== freelancerId) {
      throw new ForbiddenError('Only the freelancer can update time entries');
    }

    const entry = await prisma.timeEntry.findFirst({
      where: { id: entryId, milestoneId },
      include: { milestone: { select: { status: true } } },
    });
    if (!entry) throw new NotFoundError('Time entry not found');

    if (entry.milestone.status !== 'PENDING' && entry.milestone.status !== 'IN_PROGRESS') {
      throw new ForbiddenError('Cannot edit time entries for submitted or completed milestones');
    }

    const updated = await prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        ...(data.hours !== undefined && { hours: data.hours }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });

    return updated;
  }

  /**
   * Delete a time entry (freelancer only)
   */
  async deleteTimeEntry(contractId: string, milestoneId: string, entryId: string, freelancerId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { freelancerId: true },
    });

    if (!contract) throw new NotFoundError('Contract not found');
    if (contract.freelancerId !== freelancerId) {
      throw new ForbiddenError('Only the freelancer can delete time entries');
    }

    const entry = await prisma.timeEntry.findFirst({
      where: { id: entryId, milestoneId },
      include: { milestone: { select: { status: true } } },
    });
    if (!entry) throw new NotFoundError('Time entry not found');

    if (entry.milestone.status !== 'PENDING' && entry.milestone.status !== 'IN_PROGRESS') {
      throw new ForbiddenError('Cannot delete time entries for submitted or completed milestones');
    }

    await prisma.timeEntry.delete({ where: { id: entryId } });

    return { success: true };
  }
}

export const timeEntryService = new TimeEntryService();
export default timeEntryService;
