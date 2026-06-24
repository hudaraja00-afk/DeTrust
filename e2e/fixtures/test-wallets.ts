/**
 * E2E Test Fixtures: Test wallet addresses for Playwright
 *
 * These addresses are derived from Hardhat's default accounts:
 * - Account #0 (deployer) → used for admin actions
 * - Account #1 → client wallet
 * - Account #2 → freelancer wallet
 */

/** Hardhat default account #1 (client) */
export const TEST_CLIENT_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

/** Hardhat default account #2 (freelancer) */
export const TEST_FREELANCER_ADDRESS = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

/** Hardhat default account #3 (juror) */
export const TEST_JUROR_ADDRESS = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';

/** Base URL from playwright config */
export const BASE_URL = 'http://localhost:3000';

/** API base */
export const API_URL = 'http://localhost:4000/api';
