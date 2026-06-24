import { ethers } from 'ethers';

import { provider, isBlockchainConfigured, getContractAddresses } from '../config/blockchain';

/**
 * Escrow Service — interacts with JobEscrow smart contract.
 *
 * Used by disputeService to resolve disputes on-chain (release/refund funds).
 *
 * NOTE: Transactions are signed by a backend hot-wallet (relayer pattern).
 * The relayer private key is loaded from RELAYER_PRIVATE_KEY env var.
 * In development, falls back gracefully when blockchain is not configured.
 */

// Minimal ABI for the JobEscrow contract (dispute resolution + reads)
const JOB_ESCROW_ABI = [
  'function resolveDispute(bytes32 jobId, uint8 outcome) external',
  'function raiseDispute(bytes32 jobId) external',
  'function jobs(bytes32 jobId) external view returns (address client, address freelancer, uint256 totalAmount, uint256 paidAmount, uint256 platformFee, uint8 status, uint256 createdAt)',
  'event DisputeResolved(bytes32 indexed jobId, uint8 outcome, uint256 clientAmount, uint256 freelancerAmount)',
  'event DisputeRaised(bytes32 indexed jobId, address raisedBy)',
];

/** Outcome mapping: matches JobEscrow.sol resolveDispute() parameter values */
const OUTCOME_TO_UINT8: Record<string, number> = {
  CLIENT_WINS: 0,
  FREELANCER_WINS: 1,
  SPLIT: 2,
};

export class EscrowService {
  private contract: ethers.Contract | null = null;
  private signer: ethers.Wallet | null = null;

  /**
   * Whether escrow blockchain integration is available.
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
      console.warn('[EscrowService] Contracts not configured — skipping on-chain operations');
      return null;
    }

    const relayerKey = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerKey) {
      console.warn('[EscrowService] RELAYER_PRIVATE_KEY not set — skipping on-chain operations');
      return null;
    }

    const addresses = getContractAddresses();
    if (!addresses.escrow) {
      console.warn('[EscrowService] ESCROW_ADDRESS not set — skipping on-chain operations');
      return null;
    }

    this.signer = new ethers.Wallet(relayerKey, provider);
    this.contract = new ethers.Contract(
      addresses.escrow,
      JOB_ESCROW_ABI,
      this.signer,
    );

    return this.contract;
  }

  /**
   * Resolve a dispute on-chain by calling JobEscrow.resolveDispute().
   *
   * @param contractId - The DeTrust contract ID (hashed to bytes32 for on-chain jobId)
   * @param outcome    - 'CLIENT_WINS' | 'FREELANCER_WINS' | 'SPLIT'
   * @returns Transaction hash if successful, null if blockchain not available or call fails
   */
  async resolveDisputeOnChain(
    contractId: string,
    outcome: string,
  ): Promise<string | null> {
    const contract = this.getContract();
    if (!contract) {
      console.warn('[EscrowService] Blockchain not available — dispute resolved off-chain only');
      return null;
    }

    const outcomeUint8 = OUTCOME_TO_UINT8[outcome];
    if (outcomeUint8 === undefined) {
      console.error(`[EscrowService] Invalid outcome: ${outcome}`);
      return null;
    }

    try {
      // Convert contract ID to bytes32 (same hashing used during job creation)
      const jobIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(contractId));

      console.log(`[EscrowService] Resolving dispute on-chain: jobId=${contractId}, outcome=${outcome} (${outcomeUint8})`);

      const tx = await contract.resolveDispute(jobIdBytes32, outcomeUint8);
      const receipt = await tx.wait();

      console.log(`[EscrowService] Dispute resolved on-chain: tx=${receipt.hash}`);
      return receipt.hash;
    } catch (error) {
      console.error('[EscrowService] Failed to resolve dispute on-chain:', error);
      return null;
    }
  }

  /**
   * Raise a dispute on-chain by calling JobEscrow.raiseDispute().
   *
   * @param contractId - The DeTrust contract ID
   * @returns Transaction hash if successful, null otherwise
   */
  async raiseDisputeOnChain(contractId: string): Promise<string | null> {
    const contract = this.getContract();
    if (!contract) return null;

    try {
      const jobIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(contractId));
      const tx = await contract.raiseDispute(jobIdBytes32);
      const receipt = await tx.wait();

      console.log(`[EscrowService] Dispute raised on-chain: tx=${receipt.hash}`);
      return receipt.hash;
    } catch (error) {
      console.error('[EscrowService] Failed to raise dispute on-chain:', error);
      return null;
    }
  }

  /**
   * Query on-chain job state (for verification).
   */
  async getJobInfo(contractId: string): Promise<{
    client: string;
    freelancer: string;
    totalAmount: bigint;
    paidAmount: bigint;
    status: number;
  } | null> {
    const contract = this.getContract();
    if (!contract) return null;

    try {
      const jobIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(contractId));
      const info = await contract.jobs(jobIdBytes32);
      return {
        client: info[0],
        freelancer: info[1],
        totalAmount: info[2],
        paidAmount: info[3],
        status: Number(info[5]),
      };
    } catch (error) {
      console.error('[EscrowService] Failed to query job info:', error);
      return null;
    }
  }
}

export const escrowService = new EscrowService();
export default escrowService;
