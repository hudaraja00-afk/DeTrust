/**
 * Integration Test 1: Wallet Authentication Flow
 *
 * Chapter 5, Table 66.
 *
 * Tests the full auth flow: nonce request → wallet signature → token issuance.
 * Mocks are used at the boundary (database, redis) but the service is tested
 * as a composed unit with real business logic.
 *
 * @see apps/api/src/services/auth.service.ts
 */
import { prismaMock, redisMock } from '../setup';
import { AuthService } from '../../src/services/auth.service';
import { mockFreelancerUser, mockNewWalletAddress } from '../fixtures';

jest.mock('siwe', () => ({
  SiweMessage: jest.fn().mockImplementation(() => ({
    verify: jest.fn().mockResolvedValue({
      success: true,
      data: { address: '0x1234567890abcdef1234567890abcdef12345678' },
    }),
  })),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
}));

describe('Integration Test 1: Wallet Authentication Flow (Table 66)', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
  });

  // IT 1, Row 1 — Full flow: nonce → signature → token for existing user
  it('authenticates existing user: returns user + JWT tokens', async () => {
    const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';

    // Redis has valid nonce
    (redisMock.cacheGet as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({
        nonce: 'test-nonce-123',
        walletAddress,
        createdAt: Date.now(),
      })
    );

    // Redis delete nonce succeeds
    (redisMock.cacheDelete as jest.Mock).mockResolvedValueOnce(true);

    // User exists (service uses findUnique)
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      ...mockFreelancerUser,
      walletAddress,
    });

    // Update lastLoginAt
    (prismaMock.user.update as jest.Mock).mockResolvedValueOnce({
      ...mockFreelancerUser,
      walletAddress,
      lastLoginAt: new Date(),
    });

    const result = await service.verifyWallet({
      address: walletAddress,
      message: 'Sign in to DeTrust',
      signature: '0xmocksignature',
    });

    expect(result.user).toBeDefined();
    expect(result.user.walletAddress).toBe(walletAddress);
    expect(result.token).toBe('mock-jwt-token');
    expect(result.isNewUser).toBe(false);
  });

  // IT 1, Row 2 — New wallet → creates user
  it('creates new user for unregistered wallet', async () => {
    const walletAddress = mockNewWalletAddress.toLowerCase();

    (redisMock.cacheGet as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({
        nonce: 'nonce-new',
        walletAddress,
        createdAt: Date.now(),
      })
    );

    (redisMock.cacheDelete as jest.Mock).mockResolvedValueOnce(true);

    // No existing user
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

    // Create user
    const newUser = {
      id: 'new-user-001',
      walletAddress,
      name: null,
      role: 'FREELANCER',
      freelancerProfile: null,
      clientProfile: null,
    };
    (prismaMock.user.create as jest.Mock).mockResolvedValueOnce(newUser);

    // Update lastLoginAt
    (prismaMock.user.update as jest.Mock).mockResolvedValueOnce({
      ...newUser,
      lastLoginAt: new Date(),
    });

    const result = await service.verifyWallet({
      address: walletAddress,
      message: 'Sign in to DeTrust',
      signature: '0xmocksignature',
    });

    expect(result.isNewUser).toBe(true);
    expect(result.user.walletAddress).toBe(walletAddress);
    expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
  });

  // IT 1, Row 3 — Expired/invalid nonce → rejected
  it('rejects authentication with invalid nonce', async () => {
    (redisMock.cacheGet as jest.Mock).mockResolvedValueOnce(null); // no nonce in Redis

    await expect(
      service.verifyWallet({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        message: 'Sign in to DeTrust',
        signature: '0xmocksignature',
      })
    ).rejects.toThrow();
  });
});
