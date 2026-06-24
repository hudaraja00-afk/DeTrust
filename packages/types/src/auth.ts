// Auth Types for DeTrust Platform

import { UserRole, UserWithProfile } from './user';

// Auth Methods
export enum AuthMethod {
  WALLET = 'WALLET',
  EMAIL = 'EMAIL',
}

// Wallet Auth
export interface WalletNonceRequest {
  address: string;
}

export interface WalletNonceResponse {
  nonce: string;
  message: string;
}

export interface WalletVerifyRequest {
  address: string;
  signature: string;
  nonce: string;
}

// Email Auth
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// 2FA
export interface Setup2FAResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface Verify2FARequest {
  code: string;
}

// Auth Response
export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: UserWithProfile;
  expiresAt: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Token Payload
export interface TokenPayload {
  userId: string;
  role: UserRole;
  walletAddress?: string;
  email?: string;
  iat: number;
  exp: number;
}

// Session
export interface Session {
  id: string;
  userId: string;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
}

// Onboarding
export interface OnboardingStep {
  step: number;
  completed: boolean;
  data?: Record<string, unknown>;
}

export interface FreelancerOnboardingData {
  title: string;
  bio: string;
  skills: string[];
  hourlyRate?: number;
  availability?: string;
  portfolioLinks?: string[];
}

export interface ClientOnboardingData {
  companyName?: string;
  companySize?: string;
  industry?: string;
  description?: string;
}
