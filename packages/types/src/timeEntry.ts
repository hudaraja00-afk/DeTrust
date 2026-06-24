// TimeEntry Types for DeTrust Platform

export interface TimeEntry {
  id: string;
  milestoneId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  hours: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeEntryInput {
  date: string; // ISO date string
  hours: number; // 0.25 - 24
  description: string;
}

export interface UpdateTimeEntryInput {
  hours?: number;
  description?: string;
}
