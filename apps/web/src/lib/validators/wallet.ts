/**
 * validateWalletAddress — Validates Ethereum wallet addresses.
 *
 * Uses viem's `isAddress` under the hood for robust validation
 * including EIP-55 checksum support.
 *
 * @param address - The string to validate
 * @returns true if the address is a valid Ethereum address
 */
import { isAddress } from 'viem';

export function validateWalletAddress(address: unknown): boolean {
  if (typeof address !== 'string') return false;
  if (address.length === 0) return false;
  return isAddress(address);
}

/**
 * Re-export as alias for Chapter 5 naming convention compatibility
 */
export { validateWalletAddress as isValidEthAddress };
