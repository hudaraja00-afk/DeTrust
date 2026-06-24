import { Job, Worker } from 'bullmq';

import { prisma } from '../../config/database';
import { ipfsService } from '../../services/ipfs.service';
import { blockchainService } from '../../services/blockchain.service';
import { bullmqConnection } from '../connection';
import { QUEUE_NAMES } from '../queue-names';

/**
 * Retry failed IPFS uploads for reviews missing an IPFS hash.
 */
async function retryIpfsUploads(): Promise<void> {
  console.log('[BlockchainRetryWorker] Checking for reviews missing IPFS hash...');

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
          communicationRating: review.communicationRating
            ? Number(review.communicationRating)
            : null,
          qualityRating: review.qualityRating ? Number(review.qualityRating) : null,
          timelinessRating: review.timelinessRating ? Number(review.timelinessRating) : null,
          professionalismRating: review.professionalismRating
            ? Number(review.professionalismRating)
            : null,
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
      console.error(`[BlockchainRetryWorker] IPFS retry failed for review ${review.id}:`, err);
    }
  }

  console.log(`[BlockchainRetryWorker] IPFS: ${successCount}/${pendingReviews.length} uploaded`);
}

/**
 * Retry recording review hashes on the ReputationRegistry.
 */
async function retryBlockchainWrites(): Promise<void> {
  if (!blockchainService.isAvailable) return;

  console.log('[BlockchainRetryWorker] Checking for reviews missing blockchain tx...');

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
    take: 50,
  });

  if (pendingReviews.length === 0) {
    console.log('[BlockchainRetryWorker] No pending reviews to process');
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
      console.error(`[BlockchainRetryWorker] Failed for review ${review.id}:`, err);
    }
  }

  console.log(
    `[BlockchainRetryWorker] Processed ${pendingReviews.length} reviews, ${successCount} succeeded`,
  );
}

/**
 * Combined worker: IPFS upload retry + blockchain write retry.
 */
async function processBlockchainRetry(_job: Job): Promise<void> {
  await retryIpfsUploads();
  await retryBlockchainWrites();
}

export function createBlockchainRetryWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.BLOCKCHAIN_RETRY,
    processBlockchainRetry,
    {
      connection: bullmqConnection,
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    console.log(`[BlockchainRetryWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[BlockchainRetryWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
