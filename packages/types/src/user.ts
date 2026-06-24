// User Types for DeTrust Platform

export enum UserRole {
  CLIENT = 'CLIENT',
  FREELANCER = 'FREELANCER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

export interface User {
  id: string;
  walletAddress: string | null;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FreelancerProfile {
  id: string;
  userId: string;
  title: string | null;
  bio: string | null;
  hourlyRate: number | null;
  availability: string | null;
  location: string | null;
  timezone: string | null;
  languages: string[];
  portfolioLinks: string[];
  resumeUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  
  // Scores
  trustScore: number;
  aiCapabilityScore: number;
  totalEarnings: number;
  completedJobs: number;
  successRate: number;
  avgRating: number;
  totalReviews: number;
  
  // Completeness
  profileComplete: boolean;
  completenessScore: number;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (optional, when included)
  skills?: FreelancerSkill[];
  certifications?: Certification[];
  education?: Education[];
  experience?: Experience[];
}

export interface ClientProfile {
  id: string;
  userId: string;
  companyName: string | null;
  companySize: string | null;
  industry: string | null;
  companyWebsite: string | null;
  description: string | null;
  location: string | null;
  
  // Scores
  trustScore: number;
  totalSpent: number;
  jobsPosted: number;
  hireRate: number;
  avgRating: number;
  totalReviews: number;
  paymentVerified: boolean;

  // Completeness
  profileComplete: boolean;
  completenessScore: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  isActive: boolean;
}

export enum SkillVerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  EXPIRED = 'EXPIRED',
}

export interface FreelancerSkill {
  id: string;
  freelancerProfileId: string;
  skillId: string;
  yearsExperience: number | null;
  proficiencyLevel: number;
  verificationStatus: SkillVerificationStatus;
  verifiedAt: Date | null;
  verificationScore: number | null;
  skill?: Skill;
}

export interface Certification {
  id: string;
  freelancerProfileId: string;
  name: string;
  issuer: string;
  issueDate: Date | null;
  expiryDate: Date | null;
  credentialId: string | null;
  credentialUrl: string | null;
}

export interface Education {
  id: string;
  freelancerProfileId: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startDate: Date | null;
  endDate: Date | null;
  description: string | null;
}

export interface Experience {
  id: string;
  freelancerProfileId: string;
  title: string;
  company: string;
  location: string | null;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
  description: string | null;
}

// User with Profile (combined)
export interface UserWithProfile extends User {
  freelancerProfile?: FreelancerProfile | null;
  clientProfile?: ClientProfile | null;
}

// Public User (safe to expose)
export interface PublicUser {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: Date;
}

export interface PublicFreelancerProfile extends PublicUser {
  freelancerProfile: {
    title: string | null;
    bio: string | null;
    hourlyRate: number | null;
    location: string | null;
    trustScore: number;
    aiCapabilityScore: number;
    completedJobs: number;
    avgRating: number;
    totalReviews: number;
    skills?: FreelancerSkill[];
  };
}

export interface PublicClientProfile extends PublicUser {
  clientProfile: {
    companyName: string | null;
    industry: string | null;
    location: string | null;
    trustScore: number;
    jobsPosted: number;
    hireRate: number;
    avgRating: number;
    totalReviews: number;
    paymentVerified: boolean;
    profileComplete: boolean;
    completenessScore: number;
  };
}
