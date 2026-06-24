import { prisma } from '../config/database';
import { ipfsService } from '../services/ipfs.service';
import { blockchainService } from '../services/blockchain.service';

/**
 * Blockchain Background Job
 *
 * Retries recording review hashes on the ReputationRegistry for reviews
 * that were created but failed the initial blockchain write.
 * Runs every 6 hours.
 */

let blockchainJobInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Find reviews missing blockchain tx hash and retry recording.
 */
async function retryBlockchainWrites(): Promise<void> {
  if (!blockchainService.isAvailable) {
    return; // Skip if blockchain not configured
  }

  console.log('[BlockchainJob] Checking for reviews missing blockchain tx...');

  try {
    // Find reviews with IPFS hash but no blockchain tx
    const pendingReviews = await prisma.review.findMany({
      where: {
        ipfsHash: { not: null },
        blockchainTxHash: null,
      },
      select: {
        id: true,
        contractId: true,
        subjectId: true,
        ipfsHash: true,
        overallRating: true,
      },
      take: 50, // Process in batches of 50
    });

    if (pendingReviews.length === 0) {
      console.log('[BlockchainJob] No pending reviews to process');
      return;
    }

    let successCount = 0;
    for (const review of pendingReviews) {
      try {
        const subject = await prisma.user.findUnique({
          where: { id: review.subjectId },
          select: { walletAddress: true },
        });

        if (!subject?.walletAddress) continue;

        const txHash = await blockchainService.recordFeedback(
          review.contractId,
          subject.walletAddress,
          review.ipfsHash!,
          Math.round(Number(review.overallRating)),
        );

        if (txHash) {
          await prisma.review.update({
            where: { id: review.id },
            data: { blockchainTxHash: txHash },
          });
          successCount++;
        }
      } catch (err) {
        console.error(`[BlockchainJob] Failed for review ${review.id}:`, err);
      }
    }

    console.log(
      `[BlockchainJob] Processed ${pendingReviews.length} reviews, ${successCount} succeeded`,
    );
  } catch (error) {
    console.error('[BlockchainJob] Retry batch failed:', error);
  }
}

/**
 * Also ensure reviews without IPFS hashes get them.
 */
async function retryIpfsUploads(): Promise<void> {
  console.log('[BlockchainJob] Checking for reviews missing IPFS hash...');

  try {
    const pendingReviews = await prisma.review.findMany({
      where: { ipfsHash: null },
      select: {
        id: true,
        contractId: true,
        overallRating: true,
        communicationRating: true,
        qualityRating: true,
        timelinessRating: true,
        professionalismRating: true,
        comment: true,
        createdAt: true,
      },
      take: 50,
    });

    if (pendingReviews.length === 0) return;

    let successCount = 0;
    for (const review of pendingReviews) {
      try {
        const ipfsHash = await ipfsService.uploadJSON(
          {
            contractId: review.contractId,
            overallRating: Number(review.overallRating),
            communicationRating: review.communicationRating ? Number(review.communicationRating) : null,
            qualityRating: review.qualityRating ? Number(review.qualityRating) : null,
            timelinessRating: review.timelinessRating ? Number(review.timelinessRating) : null,
            professionalismRating: review.professionalismRating ? Number(review.professionalismRating) : null,
            comment: review.comment,
            timestamp: review.createdAt.toISOString(),
          },
          `review-${review.id}`,
        );

        await prisma.review.update({
          where: { id: review.id },
          data: { ipfsHash },
        });
        successCount++;
      } catch (err) {
        console.error(`[BlockchainJob] IPFS retry failed for review ${review.id}:`, err);
      }
    }

    console.log(`[BlockchainJob] IPFS: ${successCount}/${pendingReviews.length} uploaded`);
  } catch (error) {
    console.error('[BlockchainJob] IPFS retry batch failed:', error);
  }
}

/**
 * Start the blockchain retry job. Runs every 6 hours.
 */
export function startBlockchainJob(): void {
  const INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

  // Run immediately (delayed 60s to let services initialize)
  setTimeout(() => {
    retryIpfsUploads().catch(console.error);
    retryBlockchainWrites().catch(console.error);
  }, 60_000);

  blockchainJobInterval = setInterval(() => {
    retryIpfsUploads().catch(console.error);
    retryBlockchainWrites().catch(console.error);
  }, INTERVAL_MS);

  console.log('[BlockchainJob] Scheduled blockchain retry every 6h');
}

/**
 * Stop the blockchain retry job.
 */
export function stopBlockchainJob(): void {
  if (blockchainJobInterval) {
    clearInterval(blockchainJobInterval);
    blockchainJobInterval = null;
    console.log('[BlockchainJob] Stopped');
  }
}