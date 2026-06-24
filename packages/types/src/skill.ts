// Skill Types for DeTrust Platform

import { Skill, SkillVerificationStatus } from './user';

export interface SkillCategory {
  name: string;
  slug: string;
  skills: Skill[];
}

export interface SkillTest {
  id: string;
  skillId: string;
  name: string;
  description: string | null;
  questions: SkillTestQuestion[];
  timeLimit: number; // In minutes
  passingScore: number; // Percentage
  isActive: boolean;
}

export interface SkillTestQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'code';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  points: number;
  explanation?: string;
}

export interface SkillTestAttempt {
  id: string;
  testId: string;
  userId: string;
  answers: Record<string, string | number>;
  score: number;
  passed: boolean;
  timeTaken: number; // In seconds
  completedAt: Date;
}

// Submit Test
export interface SubmitSkillTestInput {
  answers: Record<string, string | number>;
  timeTaken: number;
}

export interface SkillTestResult {
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  newVerificationStatus: SkillVerificationStatus;
}

// AI Capability Prediction
export interface CapabilityPredictionInput {
  skills: string[];
  yearsExperience?: Record<string, number>;
  education?: string;
  certifications?: string[];
  portfolioLinks?: string[];
}

export interface CapabilityPredictionResult {
  capabilityLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  score: number; // 0-100
  confidence: number; // 0-1
  strengths: string[];
  recommendations: string[];
  skillBreakdown: {
    skill: string;
    predictedLevel: number;
    confidence: number;
  }[];
}
