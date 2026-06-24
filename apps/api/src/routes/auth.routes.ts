import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import { authController } from '../controllers';
import { authenticate, authLimiter, validateBody } from '../middleware';
import { 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  walletNonceSchema,
  walletVerifySchema,
  verify2FASchema,
  disable2FASchema,
} from '../validators';
const router: ExpressRouter = Router();

// =============================================================================
// EMAIL AUTHENTICATION
// =============================================================================
// =============================================================================

/**
 * @route   POST /auth/register
 * @desc    Register a new user with email
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  authController.register
);

/**
 * @route   POST /auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  authController.login
);

/**
 * @route   POST /auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post(
  '/forgot-password',
  authLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @route   POST /auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  authLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

/**
 * @route   POST /auth/change-password
 * @desc    Change password (authenticated)
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);

// =============================================================================
// WALLET AUTHENTICATION (SIWE)
// =============================================================================

/**
 * @route   POST /auth/wallet/nonce
 * @desc    Get nonce for wallet authentication
 * @access  Public
 */
router.post(
  '/wallet/nonce',
  authLimiter,
  validateBody(walletNonceSchema),
  authController.walletNonce
);

/**
 * @route   POST /auth/wallet/verify
 * @desc    Verify wallet signature
 * @access  Public
 */
router.post(
  '/wallet/verify',
  authLimiter,
  validateBody(walletVerifySchema),
  authController.walletVerify
);

// =============================================================================
// 2FA
// =============================================================================

/**
 * @route   POST /auth/2fa/setup
 * @desc    Initialize 2FA setup
 * @access  Private
 */
router.post('/2fa/setup', authenticate, authController.setup2FA);

/**
 * @route   POST /auth/2fa/verify
 * @desc    Verify 2FA code and enable
 * @access  Private
 */
router.post(
  '/2fa/verify',
  authenticate,
  validateBody(verify2FASchema),
  authController.verify2FA
);

/**
 * @route   POST /auth/2fa/disable
 * @desc    Disable 2FA (requires current code + password)
 * @access  Private
 */
router.post(
  '/2fa/disable',
  authenticate,
  validateBody(disable2FASchema),
  authController.disable2FA
);

// =============================================================================
// SESSION
// =============================================================================

/**
 * @route   GET /auth/me
 * @desc    Get current user from token
 * @access  Private
 */
router.get('/me', authenticate, authController.me);

/**
 * @route   POST /auth/logout
 * @desc    Clear auth cookies and end session
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token using refresh cookie
 * @access  Public
 */
router.post('/refresh', authLimiter, authController.refresh);

export default router;
