import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { SiweMessage } from 'siwe';

import { sendEmail, emailTemplates } from './email.service';

import { prisma } from '../config/database';
import { config } from '../config';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis';
import { AppError, ConflictError, UnauthorizedError } from '../middleware';
import { 
  RegisterInput, 
  LoginInput, 
  WalletVerifyInput,
  ResetPasswordInput,
  ChangePasswordInput 
} from '../validators';

const SALT_ROUNDS = 12;
const NONCE_TTL = 300; // 5 minutes
const RESET_TOKEN_TTL = 3600; // 1 hour

export class AuthService {
  /**
   * Register a new user with email
   */
  async register(data: RegisterInput) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role,
        emailVerified: false, // TODO: Implement email verification
      },
    });
    
    // Create profile based on role
    if (data.role === 'FREELANCER') {
      await prisma.freelancerProfile.create({
        data: { userId: user.id },
      });
    } else if (data.role === 'CLIENT') {
      await prisma.clientProfile.create({
        data: { userId: user.id },
      });
    }
    
    // Generate tokens
    const tokens = this.generateTokens(user);
    
    // Return user without sensitive data
    const { passwordHash: _, twoFactorSecret: __, ...safeUser } = user;
    
    return {
      user: safeUser,
      ...tokens,
    };
  }
  
  /**
   * Login with email and password
   */
  async login(data: LoginInput) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        freelancerProfile: true,
        clientProfile: true,
      },
    });
    
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }
    
    // Check 2FA
    if (user.twoFactorEnabled) {
      if (!data.twoFactorCode) {
        return { requires2FA: true };
      }
      
      const isValidCode = authenticator.verify({
        token: data.twoFactorCode,
        secret: user.twoFactorSecret!,
      });
      
      if (!isValidCode) {
        throw new UnauthorizedError('Invalid 2FA code');
      }
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    
    // Generate tokens
    const tokens = this.generateTokens(user);
    
    // Return user without sensitive data
    const { passwordHash: _, twoFactorSecret: __, ...safeUser } = user;
    
    return {
      user: safeUser,
      ...tokens,
    };
  }
  
  /**
   * Generate nonce for wallet authentication (SIWE)
   */
  async generateWalletNonce(address: string) {
    const nonce = uuidv4();
    
    // Store nonce in Redis with TTL
    await cacheSet(`nonce:${address.toLowerCase()}`, nonce, NONCE_TTL);
    
    // Create SIWE message
    const message = new SiweMessage({
      domain: new URL(config.server.frontendUrl).host,
      address,
      statement: 'Sign in to DeTrust',
      uri: config.server.frontendUrl,
      version: '1',
      chainId: config.blockchain.chainId,
      nonce,
    });
    
    return {
      nonce,
      message: message.prepareMessage(),
    };
  }
  
  /**
   * Verify wallet signature and authenticate
   */
  async verifyWallet(data: WalletVerifyInput) {
    const address = data.address.toLowerCase();
    
    // Get stored nonce
    const storedNonce = await cacheGet<string>(`nonce:${address}`);
    
    if (!storedNonce) {
      throw new UnauthorizedError('Nonce expired or not found');
    }
    
    // Verify SIWE message
    const siweMessage = new SiweMessage(data.message);
    
    try {
      await siweMessage.verify({ signature: data.signature });
    } catch {
      throw new UnauthorizedError('Invalid signature');
    }
    
    // Delete used nonce
    await cacheDelete(`nonce:${address}`);
    
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: address },
      include: {
        freelancerProfile: true,
        clientProfile: true,
      },
    });
    
    const isNewUser = !user;
    
    if (!user) {
      // Create new user with wallet
      user = await prisma.user.create({
        data: {
          walletAddress: address,
          role: 'FREELANCER', // Default role, can be changed during onboarding
        },
        include: {
          freelancerProfile: true,
          clientProfile: true,
        },
      });
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    
    // Generate tokens
    const tokens = this.generateTokens(user);
    
    return {
      user,
      ...tokens,
      isNewUser,
    };
  }
  
  /**
   * Setup 2FA
   */
  async setup2FA(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    if (user.twoFactorEnabled) {
      throw new AppError('2FA is already enabled', 400);
    }
    
    // Generate secret
    const secret = authenticator.generateSecret();
    
    // Generate QR code
    const otpauth = authenticator.keyuri(
      user.email || user.walletAddress || userId,
      'DeTrust',
      secret
    );
    const qrCodeUrl = await QRCode.toDataURL(otpauth);
    
    // Store secret temporarily (user must verify before enabling)
    await cacheSet(`2fa:setup:${userId}`, secret, 600); // 10 minutes
    
    return {
      secret,
      qrCodeUrl,
    };
  }
  
  /**
   * Verify and enable 2FA
   */
  async verify2FA(userId: string, code: string) {
    // Get temporary secret
    const secret = await cacheGet<string>(`2fa:setup:${userId}`);
    
    if (!secret) {
      throw new AppError('2FA setup expired, please start again', 400);
    }
    
    // Verify code
    const isValid = authenticator.verify({ token: code, secret });
    
    if (!isValid) {
      throw new UnauthorizedError('Invalid 2FA code');
    }
    
    // Enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      },
    });
    
    // Delete temporary secret
    await cacheDelete(`2fa:setup:${userId}`);
    
    // Generate backup codes using cryptographic randomness
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(5).toString('hex').toUpperCase()
    );
    
    return { success: true, backupCodes };
  }
  
  /**
   * Disable 2FA (requires current 2FA code and password)
   */
  async disable2FA(userId: string, code: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new AppError('2FA is not enabled', 400);
    }
    
    if (!user.passwordHash) {
      throw new AppError('Password not set for this account', 400);
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid password');
    }
    
    // Verify current 2FA code
    const isValidCode = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });
    
    if (!isValidCode) {
      throw new UnauthorizedError('Invalid 2FA code');
    }
    
    // Disable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });
    
    return { success: true };
  }
  
  /**
   * Generate password reset token
   */
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true };
    }
    
    // Generate reset token
    const resetToken = uuidv4();
    
    // Store token in Redis
    await cacheSet(`reset:${resetToken}`, user.id, RESET_TOKEN_TTL);
    
    // Send password reset email
    await sendEmail({
      to: email,
      subject: 'Reset Your Password — DeTrust',
      html: emailTemplates.passwordReset(resetToken),
    });
    
    return { success: true };
  }
  
  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordInput) {
    // Get user ID from token
    const userId = await cacheGet<string>(`reset:${data.token}`);
    
    if (!userId) {
      throw new AppError('Invalid or expired reset token', 400);
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    
    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    
    // Delete used token
    await cacheDelete(`reset:${data.token}`);
    
    return { success: true };
  }
  
  /**
   * Change password (authenticated user)
   */
  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user || !user.passwordHash) {
      throw new AppError('User not found or no password set', 400);
    }
    
    // Verify current password
    const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);
    
    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    
    return { success: true };
  }
  
  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshTokenValue: string) {
    const jwtSecret = config.jwt.secret as Secret;

    let payload: { userId: string };
    try {
      payload = jwt.verify(refreshTokenValue, jwtSecret) as { userId: string };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { freelancerProfile: true, clientProfile: true },
    });

    if (!user || user.status === 'SUSPENDED') {
      throw new UnauthorizedError('User not found or suspended');
    }

    return this.generateTokens(user);
  }

  /**
   * Generate JWT tokens
   */
  private generateTokens(user: { id: string; role: string; walletAddress?: string | null; email?: string | null }) {
    const payload = {
      userId: user.id,
      role: user.role,
      walletAddress: user.walletAddress,
      email: user.email,
    };
    
    const jwtSecret = config.jwt.secret as Secret;
    type ExpiresInValue = SignOptions['expiresIn'];
    const expiresIn = config.jwt.expiresIn as ExpiresInValue;
    const refreshExpiresIn = config.jwt.refreshExpiresIn as ExpiresInValue;
    const accessTokenOptions: SignOptions = {
      expiresIn,
    };
    const token = jwt.sign(payload, jwtSecret, accessTokenOptions);
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: refreshExpiresIn }
    );
    
    return {
      token,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };
  }
}

export const authService = new AuthService();
export default authService;
