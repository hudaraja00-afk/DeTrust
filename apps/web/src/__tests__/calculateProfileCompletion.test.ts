/**
 * Unit Testing 4: calculateProfileCompletion() Utility Function Testing
 *
 * Chapter 5, Table 49 — Profile completion percentage based on filled fields.
 *
 * @see apps/web/src/lib/profile-utils.ts
 */
import {
  computeProfileCompletion,
  calculateProfileCompletion,
  computeClientCompletion,
} from '../lib/profile-utils';
import type { User, ClientProfile } from '../lib/api/user';

// Helper to create a minimal User object
function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    role: 'FREELANCER',
    status: 'active',
    createdAt: '2026-01-01',
    ...overrides,
  } as User;
}

describe('Unit Test 4: calculateProfileCompletion()', () => {
  // Table 49, Row 1 — Full Profile (Name, Bio, Skills, Portfolio present)
  it('returns 100% for a fully complete freelancer profile', () => {
    const user = makeUser({
      role: 'FREELANCER',
      name: 'Alice Developer',
      freelancerProfile: {
        id: 'fp-1',
        title: 'Senior Dev',
        bio: 'Full-stack developer',
        hourlyRate: 75,
        availability: 'FULL_TIME',
        location: 'Remote',
        timezone: 'UTC',
        languages: ['English'],
        portfolioLinks: ['https://portfolio.dev'],
        trustScore: 80,
        aiCapabilityScore: 72,
        completedJobs: 10,
        avgRating: 4.5,
        totalReviews: 10,
        completenessScore: 100,
        profileComplete: true,
        skills: [],
      },
    });
    expect(computeProfileCompletion(user)).toBe(100);
  });

  // Table 49, Row 2 — Minimal Profile (only Name and Email) → Returns < 50%
  it('returns < 50% for a minimal freelancer profile', () => {
    const user = makeUser({
      role: 'FREELANCER',
      name: 'Bob',
      email: 'bob@example.com',
      freelancerProfile: {
        id: 'fp-2',
        title: undefined,
        bio: undefined,
        hourlyRate: undefined,
        availability: undefined,
        location: undefined,
        timezone: undefined,
        languages: [],
        portfolioLinks: [],
        trustScore: 0,
        aiCapabilityScore: 0,
        completedJobs: 0,
        avgRating: 0,
        totalReviews: 0,
        completenessScore: 30,
        profileComplete: false,
        skills: [],
      },
    });
    const result = computeProfileCompletion(user);
    expect(result).toBe(30);
    expect(result).toBeLessThan(50);
  });

  // Table 49, Row 3 — Empty Fields (null Bio, empty Skills array) → correct partial score
  it('returns correct partial score when some fields are null/empty', () => {
    const user = makeUser({
      role: 'FREELANCER',
      freelancerProfile: {
        id: 'fp-3',
        title: 'Dev',
        bio: undefined,
        hourlyRate: 50,
        availability: 'PART_TIME',
        location: undefined,
        timezone: undefined,
        languages: [],
        portfolioLinks: [],
        trustScore: 0,
        aiCapabilityScore: 0,
        completedJobs: 0,
        avgRating: 0,
        totalReviews: 0,
        completenessScore: 45,
        profileComplete: false,
        skills: [],
      },
    });
    const result = computeProfileCompletion(user);
    expect(result).toBe(45);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  // Test: client profile completion via computeClientCompletion
  it('computes client completion based on filled fields', () => {
    const fullClient: ClientProfile = {
      id: 'cp-1',
      companyName: 'DeFi Corp',
      description: 'A DeFi company',
      companyWebsite: 'https://defi.io',
      industry: 'DeFi',
      location: 'Remote',
      companySize: '10-50',
      trustScore: 80,
      jobsPosted: 5,
      hireRate: 90,
      avgRating: 4.0,
      totalReviews: 5,
      paymentVerified: true,
    };

    expect(computeClientCompletion(fullClient)).toBe(100);
  });

  it('returns 0 for client with no filled fields', () => {
    const emptyClient: ClientProfile = {
      id: 'cp-2',
      companyName: undefined,
      description: undefined,
      companyWebsite: undefined,
      industry: undefined,
      location: undefined,
      companySize: undefined,
      trustScore: 0,
      jobsPosted: 0,
      hireRate: 0,
      avgRating: 0,
      totalReviews: 0,
      paymentVerified: false,
    };

    expect(computeClientCompletion(emptyClient)).toBe(0);
  });

  // Test: null / undefined user
  it('returns 0 for null user', () => {
    expect(computeProfileCompletion(null)).toBe(0);
  });

  it('returns 0 for undefined user', () => {
    expect(computeProfileCompletion(undefined)).toBe(0);
  });

  // Test: calculateProfileCompletion alias
  it('calculateProfileCompletion is an alias for computeProfileCompletion', () => {
    expect(calculateProfileCompletion).toBe(computeProfileCompletion);
  });
});
