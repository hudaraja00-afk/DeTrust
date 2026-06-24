import { api } from './client';

// User types
export interface User {
  id: string;
  email?: string;
  walletAddress?: string;
  name?: string;
  avatarUrl?: string;
  role: 'CLIENT' | 'FREELANCER' | 'ADMIN';
  status: string;
  twoFactorEnabled?: boolean;
  createdAt: string;
  freelancerProfile?: FreelancerProfile;
  clientProfile?: ClientProfile;
}

export interface FreelancerProfile {
  id: string;
  title?: string;
  bio?: string;
  hourlyRate?: number;
  availability?: string;
  location?: string;
  timezone?: string;
  languages: string[];
  portfolioLinks: string[];
  resumeUrl?: string | null;
  trustScore: number;
  aiCapabilityScore: number;
  completedJobs: number;
  avgRating: number;
  totalReviews: number;
  completenessScore: number;
  profileComplete: boolean;
  skills: FreelancerSkill[];
  education?: EducationEntry[];
  certifications?: CertificationEntry[];
  experience?: ExperienceEntry[];
  portfolioItems?: PortfolioItemEntry[];
}

export interface FreelancerSkill {
  id?: string;
  skillId: string;
  skill: {
    id: string;
    name: string;
    category: string;
  };
  yearsExperience?: number;
  proficiencyLevel?: number;
  verificationStatus: string;
  verificationScore?: number | null;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExperienceEntry {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortfolioItemEntry {
  id: string;
  title: string;
  description?: string | null;
  projectUrl?: string | null;
  repoUrl?: string | null;
  imageUrl?: string | null;
  techStack: string[];
  startDate?: string | null;
  endDate?: string | null;
  isFeatured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExperiencePayload {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

export interface PortfolioItemPayload {
  title: string;
  description?: string;
  projectUrl?: string;
  repoUrl?: string;
  imageUrl?: string;
  techStack?: string[];
  startDate?: string;
  endDate?: string;
  isFeatured?: boolean;
}

export interface EducationPayload {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface ClientProfile {
  id: string;
  companyName?: string;
  companySize?: string;
  industry?: string;
  companyWebsite?: string;
  description?: string;
  location?: string;
  trustScore: number;
  jobsPosted: number;
  hireRate: number;
  avgRating: number;
  totalReviews: number;
  paymentVerified: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface FreelancerSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  skills?: string;
  minTrustScore?: number;
  minRating?: number;
  sort?: 'trustScore' | 'avgRating' | 'completedJobs' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface TrustScoreComponent {
  label: string;
  weight: number;
  rawValue: number;
  normalizedValue: number;
  weightedValue: number;
}

export interface TrustScoreBreakdown {
  totalScore: number | null;
  eligible: boolean;
  minimumContracts?: number;
  currentContracts?: number;
  components: TrustScoreComponent[];
}

export interface TrustScoreHistoryEntry {
  id: string;
  score: number;
  breakdown: TrustScoreComponent[] | null;
  createdAt: string;
}

export interface TrustScoreHistoryResponse {
  items: TrustScoreHistoryEntry[];
  total: number;
}

// User API functions
export const userApi = {
  // Get current user
  getMe: () => 
    api.get<User>('/users/me'),
  
  // Update current user
  updateMe: (data: { name?: string; avatarUrl?: string; walletAddress?: string | null }) =>
    api.patch<User>('/users/me', data),
  
  // Set role (onboarding)
  setRole: (role: 'CLIENT' | 'FREELANCER') => 
    api.post<User>('/users/me/role', { role }),
  
  // Get public profile
  getUser: (id: string) => 
    api.get<User>(`/users/${id}`),
  
  // Freelancer profile
  updateFreelancerProfile: (data: Partial<Omit<FreelancerProfile, 'id' | 'skills'>>) => 
    api.patch<FreelancerProfile>('/users/me/freelancer', data),
  
  addSkill: (skillId: string, yearsExperience?: number, proficiencyLevel?: number) => 
    api.post<FreelancerSkill>('/users/me/skills', { skillId, yearsExperience, proficiencyLevel }),
  
  removeSkill: (skillId: string) => 
    api.delete(`/users/me/skills/${skillId}`),

  addEducation: (data: EducationPayload) => 
    api.post<EducationEntry>('/users/me/education', data),

  removeEducation: (educationId: string) => 
    api.delete(`/users/me/education/${educationId}`),

  removeCertification: (certificationId: string) =>
    api.delete(`/users/me/certifications/${certificationId}`),

  addExperience: (data: ExperiencePayload) =>
    api.post<ExperienceEntry>('/users/me/experience', data),

  removeExperience: (experienceId: string) =>
    api.delete(`/users/me/experience/${experienceId}`),

  addPortfolioItem: (data: PortfolioItemPayload) =>
    api.post<PortfolioItemEntry>('/users/me/portfolio', data),

  removePortfolioItem: (itemId: string) =>
    api.delete(`/users/me/portfolio/${itemId}`),
  
  // Client profile
  updateClientProfile: (data: Partial<Omit<ClientProfile, 'id'>>) =>
    api.patch<ClientProfile>('/users/me/client', data),

  // KYC
  updateKyc: (data: { documentType: string; idNumber: string; country: string }) =>
    api.patch('/users/me/kyc', data),

  // Search
  searchFreelancers: (params?: FreelancerSearchParams) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return api.get<PaginatedResponse<User>>(`/users/freelancers${query ? `?${query}` : ''}`);
  },

  // Trust Score
  getTrustScore: (userId: string) =>
    api.get<TrustScoreBreakdown>(`/users/${userId}/trust-score`),

  // Trust Score History
  getTrustScoreHistory: (userId: string, limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    return api.get<TrustScoreHistoryResponse>(`/users/${userId}/trust-score/history${params}`);
  },

  // AI Capability
  recalculateAiCapability: () =>
    api.post<{ score: number }>('/users/me/ai-capability/recalculate', {}),

  // Skill Verification
  startSkillVerification: (skillId: string) =>
    api.post<{
      testId: string;
      skillName: string;
      skillCategory: string;
      questions: { id: string; text: string; options: string[]; difficulty: string }[];
      timeLimit: number;
      passingScore: number;
    }>(`/users/me/skills/${skillId}/verify/start`, {}),

  submitSkillVerification: (
    skillId: string,
    data: {
      testId: string;
      answers: { question_id: string; selected_answer: string }[];
      timeTaken: number;
    },
  ) =>
    api.post<{
      attemptId: string;
      score: number;
      correctCount: number;
      totalQuestions: number;
      passed: boolean;
      timeTaken: number;
    }>(`/users/me/skills/${skillId}/verify/submit`, data),

  getSkillTestHistory: () =>
    api.get<any[]>('/users/me/skill-tests'),
};

export default userApi;
