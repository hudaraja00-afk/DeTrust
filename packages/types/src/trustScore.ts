// Trust Score Types for DeTrust Platform

/**
 * A single component of a trust score breakdown.
 */
export interface TrustScoreComponent {
  label: string;
  weight: number;
  rawValue: number;
  normalizedValue: number;
  weightedValue: number;
}

/**
 * Full trust score breakdown returned by the API.
 *
 * - `totalScore` is `null` when the user is ineligible (fewer than
 *   `minimumContracts` completed contracts).
 * - `eligible` indicates whether the user has met the contract threshold.
 */
export interface TrustScoreBreakdown {
  totalScore: number | null;
  eligible: boolean;
  minimumContracts?: number;
  currentContracts?: number;
  components: TrustScoreComponent[];
}

/**
 * A single history entry persisted by the background job.
 */
export interface TrustScoreHistoryEntry {
  id: string;
  userId: string;
  score: number;
  breakdown: TrustScoreComponent[] | null;
  createdAt: string;
}
