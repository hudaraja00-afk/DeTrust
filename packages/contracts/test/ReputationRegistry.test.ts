import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import type { ReputationRegistry } from '../typechain-types';
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('ReputationRegistry', () => {
  // -- Fixture --------------------------------------------------
  async function deployFixture() {
    const [owner, reviewer, reviewed, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory('ReputationRegistry');
    const registry = (await factory.deploy()) as unknown as ReputationRegistry;
    await registry.waitForDeployment();

    const jobId = ethers.id('job-001');
    const contentHash = ethers.id('ipfs://Qm…reviewHash');

    return { registry, owner, reviewer, reviewed, other, jobId, contentHash };
  }

  // -- Helpers --------------------------------------------------
  const toJobId = (name: string) => ethers.id(name);
  const toHash = (name: string) => ethers.id(name);

  // =============================================================
  //  Deployment
  // =============================================================
  describe('Deployment', () => {
    it('sets deployer as owner', async () => {
      const { registry, owner } = await loadFixture(deployFixture);
      expect(await registry.owner()).to.equal(owner.address);
    });

    it('starts unpaused', async () => {
      const { registry } = await loadFixture(deployFixture);
      expect(await registry.paused()).to.equal(false);
    });
  });

  // =============================================================
  //  recordFeedback — Happy Path
  // =============================================================
  describe('recordFeedback', () => {
    it('records feedback and emits FeedbackRecorded', async () => {
      const { registry, reviewer, reviewed, jobId, contentHash } =
        await loadFixture(deployFixture);

      await expect(
        registry.connect(reviewer).recordFeedback(jobId, reviewed.address, contentHash, 4)
      )
        .to.emit(registry, 'FeedbackRecorded')
        .withArgs(jobId, reviewer.address, reviewed.address, contentHash, 4);
    });

    it('increments feedback count for reviewed user', async () => {
      const { registry, reviewer, reviewed, jobId, contentHash } =
        await loadFixture(deployFixture);

      expect(await registry.getFeedbackCount(reviewed.address)).to.equal(0);

      await registry.connect(reviewer).recordFeedback(jobId, reviewed.address, contentHash, 5);

      expect(await registry.getFeedbackCount(reviewed.address)).to.equal(1);
    });

    it('stores correct feedback data', async () => {
      const { registry, reviewer, reviewed, jobId, contentHash } =
        await loadFixture(deployFixture);

      await registry.connect(reviewer).recordFeedback(jobId, reviewed.address, contentHash, 3);

      const feedbacks = await registry.getUserFeedback(reviewed.address);
      expect(feedbacks).to.have.lengthOf(1);

      const fb = feedbacks[0];
      expect(fb.jobId).to.equal(jobId);
      expect(fb.reviewer).to.equal(reviewer.address);
      expect(fb.reviewed).to.equal(reviewed.address);
      expect(fb.contentHash).to.equal(contentHash);
      expect(fb.rating).to.equal(3);
      expect(fb.timestamp).to.be.gt(0);
    });

    it('allows multiple feedbacks for the same user from different jobs', async () => {
      const { registry, reviewer, reviewed, other } = await loadFixture(deployFixture);

      await registry
        .connect(reviewer)
        .recordFeedback(toJobId('job-A'), reviewed.address, toHash('hashA'), 5);

      await registry
        .connect(other)
        .recordFeedback(toJobId('job-B'), reviewed.address, toHash('hashB'), 3);

      expect(await registry.getFeedbackCount(reviewed.address)).to.equal(2);
    });
  });

  // =============================================================
  //  recordFeedback — Reverts
  // =============================================================
  describe('recordFeedback — reverts', () => {
    it('reverts on duplicate submission (same job + same reviewer)', async () => {
      const { registry, reviewer, reviewed, jobId, contentHash } =
        await loadFixture(deployFixture);

      await registry.connect(reviewer).recordFeedback(jobId, reviewed.address, contentHash, 4);

      await expect(
        registry.connect(reviewer).recordFeedback(jobId, reviewed.address, contentHash, 5)
      ).to.be.revertedWith('Already submitted');
    });

    it('reverts when jobId is bytes32(0)', async () => {
      const { registry, reviewer, reviewed, contentHash } =
        await loadFixture(deployFixture);

      await expect(
        registry
          .connect(reviewer)
          .recordFeedback(ethers.ZeroHash, reviewed.address, contentHash, 4)
      ).to.be.revertedWith('Invalid jobId');
    });

    it('reverts when reviewed is address(0)', async () => {
      const { registry, reviewer, jobId, contentHash } =
        await loadFixture(deployFixture);

      await expect(
        registry
          .connect(reviewer)
          .recordFeedback(jobId, ethers.ZeroAddress, contentHash, 4)
      ).to.be.revertedWith('Invalid reviewed');
    });

    it('reverts on self-review', async () => {
      const { registry, reviewer, jobId, contentHash } =
        await loadFixture(deployFixture);

      await expect(
        registry
          .connect(reviewer)
          .recordFeedback(jobId, reviewer.address, contentHash, 4)
      ).to.be.revertedWith('Invalid reviewed');
    });

    it('reverts when rating < 1', async () => {
      const { registry, reviewer, reviewed, jobId, contentHash } =
        await loadFixture(deployFixture);

      await expect(
        registry.connect(reviewer).recordFeedback(jobId, reviewed.address, contentHash, 0)
      ).to.be.revertedWith('Rating out of range');
    });

    it('reverts when rating > 5', async () => {
      const { registry, reviewer, reviewed, jobId, contentHash } =
        await loadFixture(deployFixture);

      await expect(
        registry.connect(reviewer).recordFeedback(jobId, reviewed.address, contentHash, 6)
      ).to.be.revertedWith('Rating out of range');
    });
  });

  // =============================================================
  //  View functions
  // =============================================================
  describe('getUserFeedback', () => {
    it('returns empty array for user with no feedback', async () => {
      const { registry, other } = await loadFixture(deployFixture);
      const feedbacks = await registry.getUserFeedback(other.address);
      expect(feedbacks).to.have.lengthOf(0);
    });
  });

  describe('getFeedbackCount', () => {
    it('returns 0 for user with no feedback', async () => {
      const { registry, other } = await loadFixture(deployFixture);
      expect(await registry.getFeedbackCount(other.address)).to.equal(0);
    });
  });

  describe('getAverageRating', () => {
    it('returns (0, 0) when no feedback exists', async () => {
      const { registry, other } = await loadFixture(deployFixture);
      const [avg, count] = await registry.getAverageRating(other.address);
      expect(avg).to.equal(0);
      expect(count).to.equal(0);
    });

    it('returns correct average × 100 for single feedback', async () => {
      const { registry, reviewer, reviewed, jobId, contentHash } =
        await loadFixture(deployFixture);

      await registry.connect(reviewer).recordFeedback(jobId, reviewed.address, contentHash, 4);

      const [avg, count] = await registry.getAverageRating(reviewed.address);
      expect(count).to.equal(1);
      expect(avg).to.equal(400); // 4 * 100
    });

    it('returns correct average × 100 for multiple feedbacks', async () => {
      const { registry, reviewer, reviewed, other } = await loadFixture(deployFixture);

      // Two reviews: 5 and 3 → average 4.00 → 400
      await registry
        .connect(reviewer)
        .recordFeedback(toJobId('j1'), reviewed.address, toHash('h1'), 5);
      await registry
        .connect(other)
        .recordFeedback(toJobId('j2'), reviewed.address, toHash('h2'), 3);

      const [avg, count] = await registry.getAverageRating(reviewed.address);
      expect(count).to.equal(2);
      expect(avg).to.equal(400);
    });

    it('handles non-integer average correctly (averageTimes100)', async () => {
      const { registry, reviewer, reviewed, other, owner } =
        await loadFixture(deployFixture);

      // Three reviews: 5 + 4 + 3 = 12 / 3 = 4.00 → 400
      await registry
        .connect(reviewer)
        .recordFeedback(toJobId('j1'), reviewed.address, toHash('h1'), 5);
      await registry
        .connect(other)
        .recordFeedback(toJobId('j2'), reviewed.address, toHash('h2'), 4);
      await registry
        .connect(owner)
        .recordFeedback(toJobId('j3'), reviewed.address, toHash('h3'), 3);

      const [avg, count] = await registry.getAverageRating(reviewed.address);
      expect(count).to.equal(3);
      expect(avg).to.equal(400);
    });
  });

  // =============================================================
  //  Pause / Unpause
  // =============================================================
  describe('Pausable', () => {
    it('owner can pause and unpause', async () => {
      const { registry, owner } = await loadFixture(deployFixture);

      await registry.connect(owner).pause();
      expect(await registry.paused()).to.equal(true);

      await registry.connect(owner).unpause();
      expect(await registry.paused()).to.equal(false);
    });

    it('recordFeedback reverts when paused', async () => {
      const { registry, owner, reviewer, reviewed, jobId, contentHash } =
        await loadFixture(deployFixture);

      await registry.connect(owner).pause();

      await expect(
        registry.connect(reviewer).recordFeedback(jobId, reviewed.address, contentHash, 4)
      ).to.be.revertedWithCustomError(registry, 'EnforcedPause');
    });

    it('non-owner cannot pause', async () => {
      const { registry, reviewer } = await loadFixture(deployFixture);

      await expect(
        registry.connect(reviewer).pause()
      ).to.be.revertedWithCustomError(registry, 'OwnableUnauthorizedAccount');
    });

    it('non-owner cannot unpause', async () => {
      const { registry, owner, reviewer } = await loadFixture(deployFixture);

      await registry.connect(owner).pause();

      await expect(
        registry.connect(reviewer).unpause()
      ).to.be.revertedWithCustomError(registry, 'OwnableUnauthorizedAccount');
    });
  });
});
