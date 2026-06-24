import { z } from 'zod';

// Password validation (min 12 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char)
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Ethereum address validation
const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

// =============================================================================
// EMAIL AUTH
// =============================================================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(['CLIENT', 'FREELANCER'], {
    errorMap: () => ({ message: 'Role must be CLIENT or FREELANCER' }),
  }),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  twoFactorCode: z.string().length(6).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

// =============================================================================
// WALLET AUTH (SIWE)
// =============================================================================

export const walletNonceSchema = z.object({
  address: ethereumAddressSchema,
});

export const walletVerifySchema = z.object({
  address: ethereumAddressSchema,
  signature: z.string().min(1, 'Signature is required'),
  message: z.string().min(1, 'Message is required'),
});

// =============================================================================
// 2FA
// =============================================================================

export const verify2FASchema = z.object({
  code: z.string().length(6, '2FA code must be 6 digits'),
});

export const disable2FASchema = z.object({
  code: z.string().length(6, '2FA code must be 6 digits'),
  password: z.string().min(1, 'Password is required'),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type WalletNonceInput = z.infer<typeof walletNonceSchema>;
export type WalletVerifyInput = z.infer<typeof walletVerifySchema>;
export type Verify2FAInput = z.infer<typeof verify2FASchema>;
