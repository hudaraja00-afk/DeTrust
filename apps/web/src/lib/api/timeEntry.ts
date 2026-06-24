import { api } from './client';
import type { TimeEntryResponse } from './contract';

// =============================================================================
// TIME ENTRY API
// =============================================================================

export interface CreateTimeEntryInput {
  date: string; // YYYY-MM-DD
  hours: number;
  description: string;
}

export interface UpdateTimeEntryInput {
  hours?: number;
  description?: string;
}

export interface TimeEntriesResponse {
  entries: TimeEntryResponse[];
  totalHours: number;
}

export const timeEntryApi = {
  listTimeEntries: (contractId: string, milestoneId: string) =>
    api.get<TimeEntriesResponse>(`/contracts/${contractId}/milestones/${milestoneId}/time-entries`),

  createTimeEntry: (contractId: string, milestoneId: string, data: CreateTimeEntryInput) =>
    api.post<TimeEntryResponse>(`/contracts/${contractId}/milestones/${milestoneId}/time-entries`, data),

  updateTimeEntry: (contractId: string, milestoneId: string, entryId: string, data: UpdateTimeEntryInput) =>
    api.put<TimeEntryResponse>(`/contracts/${contractId}/milestones/${milestoneId}/time-entries/${entryId}`, data),

  deleteTimeEntry: (contractId: string, milestoneId: string, entryId: string) =>
    api.delete<{ success: boolean }>(`/contracts/${contractId}/milestones/${milestoneId}/time-entries/${entryId}`),
};

export default timeEntryApi;
