/**
 * Unit Testing 2: validateWalletAddress() Utility Function Testing
 *
 * Chapter 5, Table 47 — Validates Ethereum addresses before submission.
 *
 * @see apps/web/src/lib/validators/wallet.ts
 */
import { validateWalletAddress } from '../lib/validators/wallet';

describe('Unit Test 2: validateWalletAddress()', () => {
  // Table 47, Row 1 — Valid correct address
  it('returns true for a valid Ethereum address', () => {
    expect(validateWalletAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F')).toBe(true);
  });

  // Table 47, Row 2 — Short address
  it('returns false for a short address ("0x123")', () => {
    expect(validateWalletAddress('0x123')).toBe(false);
  });

  // Table 47, Row 3 — Non-hex string
  it('returns false for a non-hex string ("Hello World")', () => {
    expect(validateWalletAddress('Hello World')).toBe(false);
  });

  // Edge cases
  it('returns false for an empty string', () => {
    expect(validateWalletAddress('')).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(validateWalletAddress(null)).toBe(false);
    expect(validateWalletAddress(undefined)).toBe(false);
  });

  it('returns false for address missing 0x prefix', () => {
    expect(validateWalletAddress('71C7656EC7ab88b098defB751B7401B5f6d8976F')).toBe(false);
  });

  it('returns true for a valid lowercase address', () => {
    expect(validateWalletAddress('0x71c7656ec7ab88b098defb751b7401b5f6d8976f')).toBe(true);
  });

  it('returns true for a valid checksummed address', () => {
    // EIP-55 mixed case
    expect(validateWalletAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(true);
  });
});
