import { Job, Worker } from 'bullmq';

import { prisma } from '../../config/database';
import { ipfsService } from '../../services/ipfs.service';
import { blockchainService } from '../../services/blockchain.service';
import { bullmqConnection } from '../connection';
import { QUEUE_NAMES } from '../queue-names';

export interface ReviewIpfsUploadData {
  reviewId: string;
  contractId: string;
  subjectId: string;
  overallRating: number;
  communicationRating?: number | null;
  qualityRating?: number | null;
  timelinessRating?: number | null;
  professionalismRating?: number | null;
  comment?: string | null;
}

/**
 * Upload a review to IPFS and record on blockchain.
 * Replaces the fire-and-forget `uploadToIpfsAndBlockchain()` in ReviewService.
 */
async function processReviewIpfsUpload(job: Job<ReviewIpfsUploadData>): Promise<void> {
  const {
    reviewId,
    contractId,
    subjectId,
    overallRating,
    communicationRating,
    qualityRating,
    timelinessRating,
    professionalismRating,
    comment,
  } = job.data;

  console.log(`[ReviewIpfsWorker] Processing review ${reviewId}...`);

  // 1. Upload to IPFS
  const ipfsContent = {
    contractId,
    overallRating,
    communicationRating: communicationRating ?? null,
    qualityRating: qualityRating ?? null,
    timelinessRating: timelinessRating ?? null,
    professionalismRating: professionalismRating ?? null,
    comment: comment ?? null,
    timestamp: new Date().toISOString(),
  };

  const ipfsHash = await ipfsService.uploadJSON(ipfsContent, `review-${reviewId}`);

  // 2. Record on blockchain
  let blockchainTxHash: string | null = null;
  const subjectUser = await prisma.user.findUnique({
    where: { id: subjectId },
    select: { walletAddress: true },
  });

  if (subjectUser?.walletAddress) {
    blockchainTxHash = await blockchainService.recordFeedback(
      contractId,
      subjectUser.walletAddress,
      ipfsHash,
      Math.round(overallRating),
    );
  }

  // 3. Update review with hashes
  await prisma.review.update({
    where: { id: reviewId },
    data: {
      ipfsHash,
      ...(blockchainTxHash ? { blockchainTxHash } : {}),
    },
  });

  console.log(`[ReviewIpfsWorker] Review ${reviewId} → IPFS: ${ipfsHash}, Blockchain: ${blockchainTxHash ?? 'N/A'}`);
}

export function createReviewIpfsUploadWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.REVIEW_IPFS_UPLOAD,
    processReviewIpfsUpload,
    {
      connection: bullmqConnection,
      concurrency: 3, // Allow parallel IPFS uploads
      limiter: { max: 10, duration: 60_000 }, // Max 10/min to avoid rate limits
    },
  );

  worker.on('completed', (job) => {
    console.log(`[ReviewIpfsWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[ReviewIpfsWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
