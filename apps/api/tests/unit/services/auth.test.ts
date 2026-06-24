/**
 * Unit Testing 5: verifyWallet() Backend Service Testing
 *
 * Chapter 5, Table 50 — SIWE signature verification and session tokens.
 *
 * @see apps/api/src/services/auth.service.ts
 */
import { prismaMock, redisMock } from '../../setup';
import { mockFreelancerUser, mockNewWalletAddress } from '../../fixtures';

// Mock siwe before importing AuthService
jest.mock('siwe', () => ({
  SiweMessage: jest.fn().mockImplementation((msg: string) => ({
    prepareMessage: jest.fn().mockReturnValue(msg),
    verify: jest.fn().mockResolvedValue({ success: true }),
  })),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn(),
}));

// Mock config
jest.mock('../../../src/config', () => ({
  config: {
    server: {
      frontendUrl: 'http://localhost:3000',
      apiUrl: 'http://localhost:4000',
    },
    jwt: {
      secret: 'test-secret-32chars-abcdefghijklmn',
      expiresIn: '7d',
      refreshExpiresIn: '30d',
    },
    blockchain: {
      chainId: 31337,
    },
    redis: {
      url: 'redis://localhost:6379',
    },
  },
}));

import { AuthService } from '../../../src/services/auth.service';
import { SiweMessage } from 'siwe';

describe('Unit Test 5: verifyWallet() Backend Service', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  // Table 50, Row 1 — Valid signature → Returns User object + JWT Token
  it('returns User object and JWT Token for a valid signature', async () => {
    const address = mockFreelancerUser.walletAddress;
    const mockNonce = 'valid-nonce-123';

    // Redis returns a valid nonce
    redisMock.cacheGet.mockResolvedValueOnce(mockNonce);

    // SiweMessage.verify succeeds
    (SiweMessage as unknown as jest.Mock).mockImplementationOnce(() => ({
      verify: jest.fn().mockResolvedValue({ success: true }),
    }));

    // Prisma finds existing user
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      ...mockFreelancerUser,
    });

    // Prisma updates lastLoginAt
    (prismaMock.user.update as jest.Mock).mockResolvedValueOnce({
      ...mockFreelancerUser,
      lastLoginAt: new Date(),
    });

    const result = await authService.verifyWallet({
      address,
      message: 'Sign in to DeTrust',
      signature: '0xValidSignature',
    });

    expect(result).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.walletAddress).toBe(address);
    expect(result).toHaveProperty('token');
    expect(result.isNewUser).toBe(false);

    // Verify nonce was deleted after use
    expect(redisMock.cacheDelete).toHaveBeenCalledWith(`nonce:${address}`);
  });

  // Table 50, Row 2 — Expired nonce → Throws "Nonce expired" error
  it('throws "Nonce expired" for expired or missing nonce', async () => {
    const address = '0x71c7656ec7ab88b098defb751b7401b5f6d8976f';

    // Redis returns null (nonce expired/not found)
    redisMock.cacheGet.mockResolvedValueOnce(null);

    await expect(
      authService.verifyWallet({
        address,
        message: 'Sign in to DeTrust',
        signature: '0xSomeSignature',
      }),
    ).rejects.toThrow('Nonce expired or not found');
  });

  // Table 50, Row 3 — Invalid signature → Throws "Invalid signature" error
  it('throws "Invalid signature" for a random/invalid signature', async () => {
    const address = '0x71c7656ec7ab88b098defb751b7401b5f6d8976f';
    const mockNonce = 'valid-nonce-456';

    // Redis returns a valid nonce
    redisMock.cacheGet.mockResolvedValueOnce(mockNonce);

    // SiweMessage.verify rejects (invalid signature)
    (SiweMessage as unknown as jest.Mock).mockImplementationOnce(() => ({
      verify: jest.fn().mockRejectedValue(new Error('Signature does not match')),
    }));

    await expect(
      authService.verifyWallet({
        address,
        message: 'Sign in to DeTrust',
        signature: 'RandomInvalidString',
      }),
    ).rejects.toThrow('Invalid signature');
  });

  // Additional: new wallet creates user
  it('creates a new user when wallet is not registered', async () => {
    const address = mockNewWalletAddress.toLowerCase();
    const mockNonce = 'valid-nonce-789';

    redisMock.cacheGet.mockResolvedValueOnce(mockNonce);

    (SiweMessage as unknown as jest.Mock).mockImplementationOnce(() => ({
      verify: jest.fn().mockResolvedValue({ success: true }),
    }));

    // No existing user
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const newUser = {
      id: 'new-user-id',
      walletAddress: address,
      role: 'FREELANCER',
      freelancerProfile: null,
      clientProfile: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create returns new user
    (prismaMock.user.create as jest.Mock).mockResolvedValueOnce(newUser);
    (prismaMock.user.update as jest.Mock).mockResolvedValueOnce({ ...newUser, lastLoginAt: new Date() });

    const result = await authService.verifyWallet({
      address,
      message: 'Sign in to DeTrust',
      signature: '0xNewWalletSignature',
    });

    expect(result.isNewUser).toBe(true);
    expect(prismaMock.user.create).toHaveBeenCalled();
  });
});
