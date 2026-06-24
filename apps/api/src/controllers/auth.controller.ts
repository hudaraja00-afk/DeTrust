import { Request, Response, NextFunction, CookieOptions } from 'express';
import { authService } from '../services';
import { config } from '../config';
import { AuthenticatedRequest } from '../middleware';

const TOKEN_COOKIE = 'detrust-auth-token';
const REFRESH_COOKIE = 'detrust-refresh-token';

function cookieOpts(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: !config.isDev,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs,
  };
}

const ACCESS_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function setAuthCookies(res: Response, token: string, refreshToken: string) {
  res.cookie(TOKEN_COOKIE, token, cookieOpts(ACCESS_MAX_AGE));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts(REFRESH_MAX_AGE));
}

function clearAuthCookies(res: Response) {
  res.clearCookie(TOKEN_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
}

export class AuthController {
  /**
   * Register with email
   * POST /auth/register
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      setAuthCookies(res, result.token, result.refreshToken);
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login with email
   * POST /auth/login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      if (!result.requires2FA && 'token' in result) {
        setAuthCookies(res, result.token, result.refreshToken);
      }
      res.json({
        success: true,
        message: result.requires2FA ? '2FA required' : 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get nonce for wallet auth
   * POST /auth/wallet/nonce
   */
  async walletNonce(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.generateWalletNonce(req.body.address);
      res.json({
        success: true,
        data: result,
        message: 'Nonce generated',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify wallet signature
   * POST /auth/wallet/verify
   */
  async walletVerify(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.verifyWallet(req.body);
      setAuthCookies(res, result.token, result.refreshToken);
      res.json({
        success: true,
        message: result.isNewUser ? 'Account created' : 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Setup 2FA
   * POST /auth/2fa/setup
   */
  async setup2FA(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.setup2FA(req.userId!);
      res.json({
        success: true,
        data: result,
        message: '2FA setup initiated',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify 2FA setup
   * POST /auth/2fa/verify
   */
  async verify2FA(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.verify2FA(req.userId!, req.body.code);
      res.json({
        success: true,
        message: '2FA enabled successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disable 2FA
   * POST /auth/2fa/disable
   */
  async disable2FA(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.disable2FA(req.userId!, req.body.code, req.body.password);
      res.json({
        success: true,
        message: '2FA disabled successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot password
   * POST /auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body.email);
      res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   * POST /auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resetPassword(req.body);
      res.json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password (authenticated)
   * POST /auth/change-password
   */
  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await authService.changePassword(req.userId!, req.body);
      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * GET /auth/me
   */
  async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: {
          userId: req.userId,
          userRole: req.userRole,
          email: req.userEmail,
          walletAddress: req.userWallet,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout (clear auth cookies)
   * POST /auth/logout
   */
  async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      clearAuthCookies(res);
      res.json({
        success: true,
        message: 'Logged out',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE];
      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token provided' },
        });
        return;
      }
      const tokens = await authService.refreshTokens(refreshToken);
      setAuthCookies(res, tokens.token, tokens.refreshToken);
      res.json({ success: true, data: { token: tokens.token, expiresAt: tokens.expiresAt }, message: 'Token refreshed' });
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  }
}

export const authController = new AuthController();
export default authController;
