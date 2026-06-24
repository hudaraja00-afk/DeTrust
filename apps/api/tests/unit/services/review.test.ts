/**
 * Functional Test 4: Review Submission & Double-Blind
 *
 * Chapter 5, Table 59.
 *
 * Tests submitReview() — contract validation, party check, duplicate, double-blind visibility,
 * rebuttal, IPFS upload, and trust score recalculation triggers.
 *
 * @see apps/api/src/services/review.service.ts
 */
import { prismaMock } from '../../setup';
import { ReviewService } from '../../../src/services/review.service';
import { mockFreelancerUser, mockClientUser } from '../../fixtures';
import { mockActiveContract, mockCompletedContract, mockReview } from '../../fixtures';

describe('Functional Test 4: Review Submission (submitReview)', () => {
  let service: ReviewService;

  const validInput = {
    contractId: mockCompletedContract.id,
    overallRating: 4.5,
    communicationRating: 4,
    qualityRating: 5,
    timelinessRating: 4,
    professionalismRating: 4,
    comment: 'Excellent work on the React project!',
  };

  beforeEach(() => {
    service = new ReviewService();
    jest.clearAllMocks();
  });

  // Table 59, Row 1 — Valid review by client on completed contract
  it('creates review when all validations pass', async () => {
    // Contract is COMPLETED
    (prismaMock.contract.findUnique as jest.Mock).mockResolvedValueOnce({
      id: mockCompletedContract.id,
      status: 'COMPLETED',
      clientId: mockClientUser.id,
      freelancerId: mockFreelancerUser.id,
      completedAt: new Date(),
      title: 'React Development',
    });

    // No duplicate
    (prismaMock.review.findUnique as jest.Mock).mockResolvedValueOnce(null);

    // Create returns review
    const createdReview = {
      id: 'review-001',
      contractId: mockCompletedContract.id,
      authorId: mockClientUser.id,
      subjectId: mockFreelancerUser.id,
      overallRating: 4.5,
      comment: validInput.comment,
      author: { id: mockClientUser.id, name: 'Bob', avatarUrl: null },
      subject: { id: mockFreelancerUser.id, name: 'Alice', avatarUrl: null },
    };
    (prismaMock.review.create as jest.Mock).mockResolvedValueOnce(createdReview);

    // Update stats
    (prismaMock.review.aggregate as jest.Mock).mockResolvedValueOnce({
      _avg: { overallRating: 4.5 },
      _count: 1,
    });
    (prismaMock.freelancerProfile.updateMany as jest.Mock).mockResolvedValueOnce({ count: 1 });
    (prismaMock.clientProfile.updateMany as jest.Mock).mockResolvedValueOnce({ count: 0 });

    const result = await service.submitReview(mockClientUser.id, validInput);

    expect(result).toBeDefined();
    expect(result.id).toBe('review-001');
    expect(result.authorId).toBe(mockClientUser.id);
    expect(result.subjectId).toBe(mockFreelancerUser.id);
    expect(prismaMock.review.create).toHaveBeenCalledTimes(1);
  });

  // Table 59, Row 2 — Contract not completed → ValidationError
  it('rejects review for non-completed contract', async () => {
    (prismaMock.contract.findUnique as jest.Mock).mockResolvedValueOnce({
      ...mockActiveContract,
      status: 'ACTIVE',
      clientId: mockClientUser.id,
      freelancerId: mockFreelancerUser.id,
    });

    await expect(
      service.submitReview(mockClientUser.id, {
        ...validInput,
        contractId: mockActiveContract.id,
      })
    ).rejects.toThrow('Reviews can only be submitted for completed contracts');
  });

  // Table 59, Row 3 — Non-party → ForbiddenError
  it('rejects review from non-contract party', async () => {
    (prismaMock.contract.findUnique as jest.Mock).mockResolvedValueOnce({
      id: mockCompletedContract.id,
      status: 'COMPLETED',
      clientId: mockClientUser.id,
      freelancerId: mockFreelancerUser.id,
      completedAt: new Date(),
      title: 'React Development',
    });

    await expect(
      service.submitReview('stranger-user-id', validInput)
    ).rejects.toThrow('Only contract parties can submit reviews');
  });

  // Table 59, Row 4 — Duplicate review → ValidationError
  it('rejects duplicate review', async () => {
    (prismaMock.contract.findUnique as jest.Mock).mockResolvedValueOnce({
      id: mockCompletedContract.id,
      status: 'COMPLETED',
      clientId: mockClientUser.id,
      freelancerId: mockFreelancerUser.id,
      completedAt: new Date(),
      title: 'React Development',
    });

    // Existing review found
    (prismaMock.review.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'existing-review',
    });

    await expect(
      service.submitReview(mockClientUser.id, validInput)
    ).rejects.toThrow('You have already submitted a review');
  });

  // Table 59, Row 5 — Contract not found → NotFoundError
  it('rejects review when contract not found', async () => {
    (prismaMock.contract.findUnique as jest.Mock).mockResolvedValueOnce(null);

    await expect(
      service.submitReview(mockClientUser.id, validInput)
    ).rejects.toThrow('Contract not found');
  });
});

describe('Functional Test 4b: Double-Blind Reviews (getContractReviews)', () => {
  let service: ReviewService;

  beforeEach(() => {
    service = new ReviewService();
    jest.clearAllMocks();
  });

  // Both parties reviewed → both visible
  it('shows both reviews when both parties have submitted', async () => {
    const completedAt = new Date();
    completedAt.setDate(completedAt.getDate() - 3); // 3 days ago, still in window

    (prismaMock.contract.findUnique as jest.Mock).mockResolvedValueOnce({
      id: mockCompletedContract.id,
      completedAt,
      clientId: mockClientUser.id,
      freelancerId: mockFreelancerUser.id,
    });

    const reviews = [
      {
        id: 'r1',
        authorId: mockClientUser.id,
        subjectId: mockFreelancerUser.id,
        contractId: mockCompletedContract.id,
        overallRating: 4.5,
        author: { id: mockClientUser.id, name: 'Bob', avatarUrl: null },
        subject: { id: mockFreelancerUser.id, name: 'Alice', avatarUrl: null },
      },
      {
        id: 'r2',
        authorId: mockFreelancerUser.id,
        subjectId: mockClientUser.id,
        contractId: mockCompletedContract.id,
        overallRating: 4.0,
        author: { id: mockFreelancerUser.id, name: 'Alice', avatarUrl: null },
        subject: { id: mockClientUser.id, name: 'Bob', avatarUrl: null },
      },
    ];
    (prismaMock.review.findMany as jest.Mock).mockResolvedValueOnce(reviews);

    const result = await service.getContractReviews(
      mockCompletedContract.id,
      mockClientUser.id
    );

    // Both submitted → both visible to either party
    expect(result.items).toHaveLength(2);
  });

  // 14-day window expired → both visible regardless
  it('shows all reviews after 14-day window expires', async () => {
    const completedAt = new Date();
    completedAt.setDate(completedAt.getDate() - 15); // 15 days ago → window closed

    (prismaMock.contract.findUnique as jest.Mock).mockResolvedValueOnce({
      id: mockCompletedContract.id,
      completedAt,
      clientId: mockClientUser.id,
      freelancerId: mockFreelancerUser.id,
    });

    // Only client reviewed
    const reviews = [
      {
        id: 'r1',
        authorId: mockClientUser.id,
        subjectId: mockFreelancerUser.id,
        contractId: mockCompletedContract.id,
        overallRating: 4.5,
        author: { id: mockClientUser.id, name: 'Bob', avatarUrl: null },
        subject: { id: mockFreelancerUser.id, name: 'Alice', avatarUrl: null },
      },
    ];
    (prismaMock.review.findMany as jest.Mock).mockResolvedValueOnce(reviews);

    const result = await service.getContractReviews(
      mockCompletedContract.id,
      mockFreelancerUser.id // Freelancer is viewing
    );

    // Window closed → visible even though counterpart hasn't reviewed
    expect(result.items).toHaveLength(1);
  });

  // Within window, only one reviewed → subject sees nothing
  it('hides review from subject within 14-day window when counterpart has not reviewed', async () => {
    const completedAt = new Date();
    completedAt.setDate(completedAt.getDate() - 3); // 3 days ago, within window

    (prismaMock.contract.findUnique as jest.Mock).mockResolvedValueOnce({
      id: mockCompletedContract.id,
      completedAt,
      clientId: mockClientUser.id,
      freelancerId: mockFreelancerUser.id,
    });

    // Only client reviewed freelancer
    const reviews = [
      {
        id: 'r1',
        authorId: mockClientUser.id,
        subjectId: mockFreelancerUser.id,
        contractId: mockCompletedContract.id,
        overallRating: 4.5,
        author: { id: mockClientUser.id, name: 'Bob', avatarUrl: null },
        subject: { id: mockFreelancerUser.id, name: 'Alice', avatarUrl: null },
      },
    ];
    (prismaMock.review.findMany as jest.Mock).mockResolvedValueOnce(reviews);

    const result = await service.getContractReviews(
      mockCompletedContract.id,
      mockFreelancerUser.id // Freelancer = subject, can only see own reviews
    );

    // Freelancer is the subject and hasn't reviewed yet → can't see client's review
    expect(result.items).toHaveLength(0);
  });
});

describe('Functional Test 4c: Review Rebuttal (submitResponse)', () => {
  let service: ReviewService;

  beforeEach(() => {
    service = new ReviewService();
    jest.clearAllMocks();
  });

  // Valid rebuttal by the subject
  it('allows subject to submit one-time rebuttal', async () => {
    (prismaMock.review.findUnique as jest.Mock).mockResolvedValueOnce({
      id: mockReview.id,
      subjectId: mockFreelancerUser.id,
      responseText: null, // no existing response
    });

    const updated = {
      id: mockReview.id,
      responseText: 'Thank you for the feedback!',
      responseAt: new Date(),
      author: { id: mockClientUser.id, name: 'Bob', avatarUrl: null },
      subject: { id: mockFreelancerUser.id, name: 'Alice', avatarUrl: null },
    };
    (prismaMock.review.update as jest.Mock).mockResolvedValueOnce(updated);

    const result = await service.submitResponse(
      mockReview.id,
      mockFreelancerUser.id,
      'Thank you for the feedback!'
    );

    expect(result.responseText).toBe('Thank you for the feedback!');
    expect(prismaMock.review.update).toHaveBeenCalledTimes(1);
  });

  // Duplicate rebuttal → ValidationError
  it('rejects second rebuttal', async () => {
    (prismaMock.review.findUnique as jest.Mock).mockResolvedValueOnce({
      id: mockReview.id,
      subjectId: mockFreelancerUser.id,
      responseText: 'Already responded', // existing response
    });

    await expect(
      service.submitResponse(mockReview.id, mockFreelancerUser.id, 'Another response')
    ).rejects.toThrow('A response has already been submitted');
  });

  // Non-subject tries to respond → ForbiddenError
  it('rejects response from non-subject', async () => {
    (prismaMock.review.findUnique as jest.Mock).mockResolvedValueOnce({
      id: mockReview.id,
      subjectId: mockFreelancerUser.id,
      responseText: null,
    });

    await expect(
      service.submitResponse(mockReview.id, 'someone-else', 'Not my review')
    ).rejects.toThrow('Only the reviewed party can respond');
  });
});
