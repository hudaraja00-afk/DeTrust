import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import type { JobEscrow, DeTrustUSD } from '../typechain-types';
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('JobEscrow', () => {
  const DECIMALS = 6;
  const parse = (n: number | string) => ethers.parseUnits(String(n), DECIMALS);

  // -- Fixture --------------------------------------------------
  async function deployFixture() {
    const [owner, client, freelancer, other] = await ethers.getSigners();

    // Deploy dUSD token — owner gets initial supply
    const tokenFactory = await ethers.getContractFactory('DeTrustUSD');
    const initialSupply = parse(1_000_000);
    const token = (await tokenFactory.deploy(owner.address, initialSupply)) as unknown as DeTrustUSD;
    await token.waitForDeployment();

    // Transfer tokens to client so they can fund escrow
    await token.transfer(client.address, parse(100_000));

    // Deploy JobEscrow
    const escrowFactory = await ethers.getContractFactory('JobEscrow');
    const escrow = (await escrowFactory.deploy(
      await token.getAddress(),
      owner.address, // feeRecipient
    )) as unknown as JobEscrow;
    await escrow.waitForDeployment();

    const jobId = ethers.id('job-001');
    const milestoneAmounts = [parse(500), parse(300), parse(200)]; // total = 1000
    const totalAmount = parse(1000);

    return {
      token,
      escrow,
      owner,
      client,
      freelancer,
      other,
      jobId,
      milestoneAmounts,
      totalAmount,
    };
  }

  /**
   * Fixture where a job is already created & funded.
   * platformFee = 3% of 1000 = 30 dUSD
   * Client approves escrow to spend 1030 dUSD, then calls createJob.
   */
  async function fundedJobFixture() {
    const f = await loadFixture(deployFixture);
    const fee = (f.totalAmount * 3n) / 100n; // 30 dUSD
    const required = f.totalAmount + fee; // 1030 dUSD

    // Client approves escrow contract to pull tokens
    await f.token.connect(f.client).approve(await f.escrow.getAddress(), required);

    // Create the job (pulls tokens from client)
    await f.escrow.connect(f.client).createJob(f.jobId, f.freelancer.address, f.milestoneAmounts);

    return { ...f, fee, required };
  }

  /** Job where a dispute has been raised. */
  async function disputedJobFixture() {
    const f = await loadFixture(fundedJobFixture);
    await f.escrow.connect(f.client).raiseDispute(f.jobId);
    return f;
  }

  /** Job in progress — milestone 0 submitted by freelancer. */
  async function inProgressFixture() {
    const f = await loadFixture(fundedJobFixture);
    await f.escrow.connect(f.freelancer).submitMilestone(f.jobId, 0, 'ipfs://Qm-deliverable-0');
    return f;
  }

  // -- Helpers --------------------------------------------------
  const tokenBalance = async (token: DeTrustUSD, addr: string) => token.balanceOf(addr);

  // =============================================================
  //  Deployment
  // =============================================================
  describe('Deployment', () => {
    it('sets payment token', async () => {
      const { escrow, token } = await loadFixture(deployFixture);
      expect(await escrow.paymentToken()).to.equal(await token.getAddress());
    });

    it('sets fee recipient', async () => {
      const { escrow, owner } = await loadFixture(deployFixture);
      expect(await escrow.feeRecipient()).to.equal(owner.address);
    });

    it('sets default platformFeePercent=3', async () => {
      const { escrow } = await loadFixture(deployFixture);
      expect(await escrow.platformFeePercent()).to.equal(3);
    });
  });

  // =============================================================
  //  createJob
  // =============================================================
  describe('createJob', () => {
    it('creates job, pulls tokens, stores milestones, emits events', async () => {
      const { escrow, token, client, freelancer, jobId, milestoneAmounts, totalAmount } =
        await loadFixture(fundedJobFixture);

      const job = await escrow.jobs(jobId);
      expect(job.client).to.equal(client.address);
      expect(job.freelancer).to.equal(freelancer.address);
      expect(job.totalAmount).to.equal(totalAmount);
      expect(job.status).to.equal(1); // Funded
      expect(job.platformFee).to.equal(parse(30)); // 3% of 1000

      // Escrow holds the tokens
      const escrowBalance = await token.balanceOf(await escrow.getAddress());
      expect(escrowBalance).to.equal(totalAmount + parse(30));

      // Milestones stored
      const milestones = await escrow.getMilestones(jobId);
      expect(milestones).to.have.lengthOf(3);
      expect(milestones[0].amount).to.equal(parse(500));
      expect(milestones[1].amount).to.equal(parse(300));
      expect(milestones[2].amount).to.equal(parse(200));
    });

    it('reverts if job already exists', async () => {
      const { escrow, token, client, freelancer, jobId, milestoneAmounts, totalAmount } =
        await loadFixture(fundedJobFixture);

      // Approve again
      const required = totalAmount + (totalAmount * 3n) / 100n;
      await token.connect(client).approve(await escrow.getAddress(), required);

      await expect(
        escrow.connect(client).createJob(jobId, freelancer.address, milestoneAmounts),
      ).to.be.revertedWith('Job exists');
    });

    it('reverts with no milestones', async () => {
      const { escrow, client, freelancer } = await loadFixture(deployFixture);

      await expect(
        escrow.connect(client).createJob(ethers.id('j-no-ms'), freelancer.address, []),
      ).to.be.revertedWith('Milestones required');
    });
  });

  // =============================================================
  //  submitMilestone
  // =============================================================
  describe('submitMilestone', () => {
    it('freelancer can submit milestone and transition to InProgress', async () => {
      const { escrow, freelancer, jobId } = await loadFixture(fundedJobFixture);

      await escrow.connect(freelancer).submitMilestone(jobId, 0, 'ipfs://Qm-hash');

      const milestones = await escrow.getMilestones(jobId);
      expect(milestones[0].status).to.equal(2); // Submitted
      expect(milestones[0].deliverableHash).to.equal('ipfs://Qm-hash');

      const job = await escrow.jobs(jobId);
      expect(job.status).to.equal(2); // InProgress
    });

    it('reverts for non-freelancer', async () => {
      const { escrow, client, jobId } = await loadFixture(fundedJobFixture);

      await expect(
        escrow.connect(client).submitMilestone(jobId, 0, 'ipfs://Qm'),
      ).to.be.revertedWith('Not freelancer');
    });
  });

  // =============================================================
  //  approveMilestone
  // =============================================================
  describe('approveMilestone', () => {
    it('client approves and freelancer receives payment', async () => {
      const { escrow, token, client, freelancer, jobId } = await loadFixture(inProgressFixture);

      const before = await token.balanceOf(freelancer.address);
      await escrow.connect(client).approveMilestone(jobId, 0);
      const after = await token.balanceOf(freelancer.address);

      expect(after - before).to.equal(parse(500));

      const milestones = await escrow.getMilestones(jobId);
      expect(milestones[0].status).to.equal(4); // Paid
    });

    it('completing all milestones triggers job completion + platform fee payout', async () => {
      const { escrow, token, client, freelancer, owner, jobId, totalAmount } =
        await loadFixture(fundedJobFixture);

      // Submit and approve all 3 milestones
      for (let i = 0; i < 3; i++) {
        await escrow.connect(freelancer).submitMilestone(jobId, i, `ipfs://Qm-${i}`);
        await escrow.connect(client).approveMilestone(jobId, i);
      }

      const job = await escrow.jobs(jobId);
      expect(job.status).to.equal(3); // Completed
      expect(job.paidAmount).to.equal(totalAmount);

      // Freelancer got all milestone payments
      expect(await token.balanceOf(freelancer.address)).to.equal(totalAmount);

      // Fee recipient (owner) got the platform fee
      // Owner started with 1M - 100K = 900K. Plus fee = 900030
      const ownerBal = await token.balanceOf(owner.address);
      expect(ownerBal).to.equal(parse(900_000) + parse(30));
    });

    it('reverts for non-client', async () => {
      const { escrow, freelancer, jobId } = await loadFixture(inProgressFixture);

      await expect(
        escrow.connect(freelancer).approveMilestone(jobId, 0),
      ).to.be.revertedWith('Not client');
    });
  });

  // =============================================================
  //  raiseDispute
  // =============================================================
  describe('raiseDispute', () => {
    it('transitions job to Disputed status', async () => {
      const { escrow, client, jobId } = await loadFixture(fundedJobFixture);

      await expect(escrow.connect(client).raiseDispute(jobId))
        .to.emit(escrow, 'DisputeRaised')
        .withArgs(jobId, client.address);

      const job = await escrow.jobs(jobId);
      expect(job.status).to.equal(4); // Disputed
    });

    it('freelancer can also raise dispute', async () => {
      const { escrow, freelancer, jobId } = await loadFixture(fundedJobFixture);

      await escrow.connect(freelancer).raiseDispute(jobId);
      const job = await escrow.jobs(jobId);
      expect(job.status).to.equal(4); // Disputed
    });

    it('reverts for unauthorized caller', async () => {
      const { escrow, other, jobId } = await loadFixture(fundedJobFixture);

      await expect(
        escrow.connect(other).raiseDispute(jobId),
      ).to.be.revertedWith('Unauthorized');
    });
  });

  // =============================================================
  //  resolveDispute — NEW (Module 5 implementation)
  // =============================================================
  describe('resolveDispute', () => {
    describe('CLIENT_WINS (outcome=0)', () => {
      it('refunds remaining + platform fee to client', async () => {
        const { escrow, token, client, freelancer, jobId, totalAmount } =
          await loadFixture(disputedJobFixture);

        const clientBefore = await token.balanceOf(client.address);

        await expect(escrow.resolveDispute(jobId, 0))
          .to.emit(escrow, 'DisputeResolved')
          .withArgs(jobId, 0, totalAmount + parse(30), 0n);

        const clientAfter = await token.balanceOf(client.address);
        expect(clientAfter - clientBefore).to.equal(totalAmount + parse(30));

        // Freelancer gets nothing
        expect(await token.balanceOf(freelancer.address)).to.equal(0);

        const job = await escrow.jobs(jobId);
        expect(job.status).to.equal(5); // Cancelled
        expect(job.platformFee).to.equal(0);
        expect(job.paidAmount).to.equal(totalAmount);
      });
    });

    describe('FREELANCER_WINS (outcome=1)', () => {
      it('releases remaining to freelancer + platform fee to feeRecipient', async () => {
        const { escrow, token, client, freelancer, owner, jobId, totalAmount } =
          await loadFixture(disputedJobFixture);

        const freelancerBefore = await token.balanceOf(freelancer.address);
        const feeRecipientBefore = await token.balanceOf(owner.address);

        await expect(escrow.resolveDispute(jobId, 1))
          .to.emit(escrow, 'DisputeResolved')
          .withArgs(jobId, 1, 0n, totalAmount);

        const freelancerAfter = await token.balanceOf(freelancer.address);
        expect(freelancerAfter - freelancerBefore).to.equal(totalAmount);

        // Platform fee paid to feeRecipient
        const feeRecipientAfter = await token.balanceOf(owner.address);
        expect(feeRecipientAfter - feeRecipientBefore).to.equal(parse(30));

        const job = await escrow.jobs(jobId);
        expect(job.status).to.equal(3); // Completed
      });
    });

    describe('SPLIT (outcome=2)', () => {
      it('splits remaining 50/50, platform fee returned to client', async () => {
        const { escrow, token, client, freelancer, jobId, totalAmount } =
          await loadFixture(disputedJobFixture);

        const clientBefore = await token.balanceOf(client.address);
        const freelancerBefore = await token.balanceOf(freelancer.address);

        // remaining=1000, half=500, clientAmount=500+30(fee)=530, freelancerAmount=500
        await expect(escrow.resolveDispute(jobId, 2))
          .to.emit(escrow, 'DisputeResolved')
          .withArgs(jobId, 2, parse(500) + parse(30), parse(500));

        const clientAfter = await token.balanceOf(client.address);
        const freelancerAfter = await token.balanceOf(freelancer.address);

        expect(clientAfter - clientBefore).to.equal(parse(530));
        expect(freelancerAfter - freelancerBefore).to.equal(parse(500));

        const job = await escrow.jobs(jobId);
        expect(job.status).to.equal(5); // Cancelled
        expect(job.platformFee).to.equal(0);
      });
    });

    describe('partial payment before dispute', () => {
      it('only distributes unpaid remainder', async () => {
        const { escrow, token, client, freelancer, jobId, totalAmount } =
          await loadFixture(fundedJobFixture);

        // Freelancer submits milestone 0 (500 dUSD), client approves → freelancer gets 500
        await escrow.connect(freelancer).submitMilestone(jobId, 0, 'ipfs://Qm0');
        await escrow.connect(client).approveMilestone(jobId, 0);

        const freelancerAfterMs = await token.balanceOf(freelancer.address);
        expect(freelancerAfterMs).to.equal(parse(500));

        // Client raises dispute on remaining 500 dUSD
        await escrow.connect(client).raiseDispute(jobId);

        const clientBefore = await token.balanceOf(client.address);

        // Resolve: CLIENT_WINS → remaining 500 + 30 fee to client
        await escrow.resolveDispute(jobId, 0);

        const clientAfter = await token.balanceOf(client.address);
        expect(clientAfter - clientBefore).to.equal(parse(500) + parse(30));

        const job = await escrow.jobs(jobId);
        expect(job.paidAmount).to.equal(totalAmount); // fully accounted
      });
    });

    describe('access control', () => {
      it('reverts if non-owner calls', async () => {
        const { escrow, client, jobId } = await loadFixture(disputedJobFixture);

        await expect(
          escrow.connect(client).resolveDispute(jobId, 0),
        ).to.be.revertedWithCustomError(escrow, 'OwnableUnauthorizedAccount');
      });

      it('reverts if job is not in Disputed status', async () => {
        const { escrow, jobId } = await loadFixture(fundedJobFixture);

        await expect(escrow.resolveDispute(jobId, 0)).to.be.revertedWith('Not disputed');
      });

      it('reverts with invalid outcome > 2', async () => {
        const { escrow, jobId } = await loadFixture(disputedJobFixture);

        await expect(escrow.resolveDispute(jobId, 3)).to.be.revertedWith('Invalid outcome');
      });
    });
  });

  // =============================================================
  //  Configuration
  // =============================================================
  describe('Configuration', () => {
    it('owner can update platformFeePercent', async () => {
      const { escrow } = await loadFixture(deployFixture);
      await escrow.setPlatformFee(1);
      expect(await escrow.platformFeePercent()).to.equal(1);
    });

    it('reverts if platformFeePercent > MAX_PLATFORM_FEE', async () => {
      const { escrow } = await loadFixture(deployFixture);
      await expect(escrow.setPlatformFee(11)).to.be.revertedWith('Fee too high');
    });

    it('owner can update feeRecipient', async () => {
      const { escrow, other } = await loadFixture(deployFixture);
      await escrow.setFeeRecipient(other.address);
      expect(await escrow.feeRecipient()).to.equal(other.address);
    });

    it('owner can pause/unpause', async () => {
      const { escrow } = await loadFixture(deployFixture);
      await escrow.pause();
      expect(await escrow.paused()).to.be.true;
      await escrow.unpause();
      expect(await escrow.paused()).to.be.false;
    });
  });

  // =============================================================
  //  emergencyWithdraw
  // =============================================================
  describe('emergencyWithdraw', () => {
    it('owner can emergency-withdraw to a recipient', async () => {
      const { escrow, token, other, jobId, totalAmount } = await loadFixture(fundedJobFixture);

      const beforeBal = await token.balanceOf(other.address);

      await escrow.emergencyWithdraw(jobId, other.address, totalAmount);

      const afterBal = await token.balanceOf(other.address);
      // remaining(1000) + platformFee(30)
      expect(afterBal - beforeBal).to.equal(totalAmount + parse(30));

      const job = await escrow.jobs(jobId);
      expect(job.status).to.equal(5); // Cancelled
    });
  });
});