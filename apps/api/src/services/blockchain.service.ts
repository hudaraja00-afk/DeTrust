import { ethers } from 'ethers';

import { provider, isBlockchainConfigured, getContractAddresses } from '../config/blockchain';

/**
 * Blockchain Service — interacts with ReputationRegistry smart contract.
 *
 * Used by reviewService to record review content hashes on-chain (SRS FR-J7.8).
 *
 * NOTE: In production, transactions are signed by a backend hot-wallet (relayer pattern).
 * The relayer private key is loaded from RELAYER_PRIVATE_KEY env var.
 * In development, falls back gracefully when blockchain is not configured.
 */

// Minimal ABI for the ReputationRegistry contract (only functions we call)
const REPUTATION_REGISTRY_ABI = [
  'function recordFeedback(bytes32 jobId, address reviewed, bytes32 contentHash, uint8 rating) external',
  'event FeedbackRecorded(bytes32 indexed jobId, address indexed reviewer, address indexed reviewed, bytes32 contentHash, uint8 rating)',
  'function getFeedbackCount(address user) external view returns (uint256)',
  'function getAverageRating(address user) external view returns (uint256 averageTimes100, uint256 count)',
];

export class BlockchainService {
  private contract: ethers.Contract | null = null;
  private signer: ethers.Wallet | null = null;

  /**
   * Whether blockchain integration is available.
   */
  get isAvailable(): boolean {
    return isBlockchainConfigured() && !!process.env.RELAYER_PRIVATE_KEY;
  }

  /**
   * Lazily initialize the contract instance + signer.
   */
  private getContract(): ethers.Contract | null {
    if (this.contract) return this.contract;

    if (!isBlockchainConfigured()) {
      console.warn('[BlockchainService] Contracts not configured — skipping on-chain operations');
      return null;
    }

    const relayerKey = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerKey) {
      console.warn('[BlockchainService] RELAYER_PRIVATE_KEY not set — skipping on-chain operations');
      return null;
    }

    const addresses = getContractAddresses();
    this.signer = new ethers.Wallet(relayerKey, provider);
    this.contract = new ethers.Contract(
      addresses.reputation!,
      REPUTATION_REGISTRY_ABI,
      this.signer,
    );

    return this.contract;
  }

  /**
   * Record a review feedback hash on the ReputationRegistry contract.
   *
   * @param contractId - The DeTrust contract ID (hashed to bytes32)
   * @param reviewerAddress - Wallet address of the reviewer
   * @param reviewedAddress - Wallet address of the reviewed party
   * @param contentHash - IPFS CID or SHA-256 hash (converted to bytes32)
   * @param rating - Overall rating (1-5, integer)
   * @returns Transaction hash if successful, null if blockchain not available
   */
  async recordFeedback(
    contractId: string,
    reviewedAddress: string,
    contentHash: string,
    rating: number,
  ): Promise<string | null> {
    const contract = this.getContract();
    if (!contract) return null;

    try {
      // Convert contract ID to bytes32
      const jobIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(contractId));

      // Convert content hash to bytes32
      const contentHashBytes32 = ethers.keccak256(ethers.toUtf8Bytes(contentHash));

      // Clamp rating to integer 1-5
      const ratingInt = Math.max(1, Math.min(5, Math.round(rating)));

      const tx = await contract.recordFeedback(
        jobIdBytes32,
        reviewedAddress,
        contentHashBytes32,
        ratingInt,
      );

      const receipt = await tx.wait();
      console.log(`[BlockchainService] Feedback recorded: tx=${receipt.hash}`);

      return receipt.hash;
    } catch (error) {
      console.error('[BlockchainService] Failed to record feedback:', error);
      return null;
    }
  }

  /**
   * Get the on-chain feedback count for a user address.
   */
  async getFeedbackCount(userAddress: string): Promise<number> {
    const contract = this.getContract();
    if (!contract) return 0;

    try {
      const count = await contract.getFeedbackCount(userAddress);
      return Number(count);
    } catch (error) {
      console.error('[BlockchainService] Failed to get feedback count:', error);
      return 0;
    }
  }
}

export const blockchainService = new BlockchainService();
export default blockchainService;