import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import type { DisputeResolution } from '../typechain-types';
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('DisputeResolution', () => {
  // -- Fixture --------------------------------------------------
  async function deployFixture() {
    const [owner, client, freelancer, juror1, juror2, juror3, outsider] =
      await ethers.getSigners();

    const factory = await ethers.getContractFactory('DisputeResolution');
    const contract = (await factory.deploy()) as unknown as DisputeResolution;
    await contract.waitForDeployment();

    // Set juror trust scores (>= 50 required by default)
    await contract.setJurorTrustScore(juror1.address, 80);
    await contract.setJurorTrustScore(juror2.address, 60);
    await contract.setJurorTrustScore(juror3.address, 90);
    await contract.setJurorTrustScore(outsider.address, 30); // below threshold

    const disputeId = ethers.id('dispute-001');
    const jobId = ethers.id('job-001');
    const escrowAmount = ethers.parseUnits('1000', 6);

    return {
      contract,
      owner,
      client,
      freelancer,
      juror1,
      juror2,
      juror3,
      outsider,
      disputeId,
      jobId,
      escrowAmount,
    };
  }

  async function createdDisputeFixture() {
    const f = await loadFixture(deployFixture);
    await f.contract.createDispute(
      f.disputeId,
      f.jobId,
      f.client.address,
      f.freelancer.address,
      f.escrowAmount,
    );
    return f;
  }

  async function votingFixture() {
    const f = await loadFixture(createdDisputeFixture);
    await f.contract.startVoting(f.disputeId);
    return f;
  }

  // =============================================================
  //  Deployment
  // =============================================================
  describe('Deployment', () => {
    it('sets deployer as owner', async () => {
      const { contract, owner } = await loadFixture(deployFixture);
      expect(await contract.owner()).to.equal(owner.address);
    });

    it('owner is registered as dispute creator', async () => {
      const { contract, owner } = await loadFixture(deployFixture);
      expect(await contract.disputeCreators(owner.address)).to.be.true;
    });

    it('has defaults: minJurorTrustScore=50, votingPeriod=7d, minJurors=3', async () => {
      const { contract } = await loadFixture(deployFixture);
      expect(await contract.minJurorTrustScore()).to.equal(50);
      expect(await contract.votingPeriod()).to.equal(7 * 24 * 3600);
      expect(await contract.minJurors()).to.equal(3);
    });
  });

  // =============================================================
  //  createDispute
  // =============================================================
  describe('createDispute', () => {
    it('stores dispute with correct data', async () => {
      const { contract, disputeId, jobId, client, freelancer, escrowAmount } =
        await loadFixture(createdDisputeFixture);

      const d = await contract.disputes(disputeId);
      expect(d.jobId).to.equal(jobId);
      expect(d.client).to.equal(client.address);
      expect(d.freelancer).to.equal(freelancer.address);
      expect(d.escrowAmount).to.equal(escrowAmount);
      expect(d.status).to.equal(0); // Open
      expect(d.outcome).to.equal(0); // Pending
      expect(d.createdAt).to.be.gt(0);
    });

    it('emits DisputeCreated event', async () => {
      const { contract, jobId, client, freelancer, escrowAmount } =
        await loadFixture(deployFixture);

      const id = ethers.id('dispute-emit');
      await expect(
        contract.createDispute(id, jobId, client.address, freelancer.address, escrowAmount),
      )
        .to.emit(contract, 'DisputeCreated')
        .withArgs(id, jobId, client.address, freelancer.address);
    });

    it('reverts if dispute already exists', async () => {
      const { contract, disputeId, jobId, client, freelancer, escrowAmount } =
        await loadFixture(createdDisputeFixture);

      await expect(
        contract.createDispute(disputeId, jobId, client.address, freelancer.address, escrowAmount),
      ).to.be.revertedWith('Dispute exists');
    });

    it('reverts if called by non-creator', async () => {
      const { contract, jobId, client, freelancer, escrowAmount, outsider } =
        await loadFixture(deployFixture);

      await expect(
        contract
          .connect(outsider)
          .createDispute(ethers.id('d-x'), jobId, client.address, freelancer.address, escrowAmount),
      ).to.be.revertedWith('Not authorized');
    });

    it('reverts with zero disputeId', async () => {
      const { contract, jobId, client, freelancer, escrowAmount } =
        await loadFixture(deployFixture);

      await expect(
        contract.createDispute(
          ethers.ZeroHash,
          jobId,
          client.address,
          freelancer.address,
          escrowAmount,
        ),
      ).to.be.revertedWith('Dispute exists');
    });

    it('reverts with zero jobId', async () => {
      const { contract, client, freelancer, escrowAmount } =
        await loadFixture(deployFixture);

      await expect(
        contract.createDispute(
          ethers.id('d-z'),
          ethers.ZeroHash,
          client.address,
          freelancer.address,
          escrowAmount,
        ),
      ).to.be.revertedWith('Invalid jobId');
    });

    it('reverts with zero-address party', async () => {
      const { contract, jobId, freelancer, escrowAmount } =
        await loadFixture(deployFixture);

      await expect(
        contract.createDispute(
          ethers.id('d-z2'),
          jobId,
          ethers.ZeroAddress,
          freelancer.address,
          escrowAmount,
        ),
      ).to.be.revertedWith('Invalid party');
    });

    it('reverts with zero escrowAmount', async () => {
      const { contract, jobId, client, freelancer } =
        await loadFixture(deployFixture);

      await expect(
        contract.createDispute(ethers.id('d-z3'), jobId, client.address, freelancer.address, 0),
      ).to.be.revertedWith('Invalid escrow');
    });
  });

  // =============================================================
  //  submitEvidence
  // =============================================================
  describe('submitEvidence', () => {
    it('client can submit evidence and emit event', async () => {
      const { contract, disputeId, client } = await loadFixture(createdDisputeFixture);

      await expect(
        contract.connect(client).submitEvidence(disputeId, 'ipfs://QmClient'),
      )
        .to.emit(contract, 'EvidenceSubmitted')
        .withArgs(disputeId, client.address, 'ipfs://QmClient');

      const d = await contract.disputes(disputeId);
      expect(d.evidenceHashClient).to.equal('ipfs://QmClient');
    });

    it('freelancer can submit evidence', async () => {
      const { contract, disputeId, freelancer } = await loadFixture(createdDisputeFixture);

      await contract.connect(freelancer).submitEvidence(disputeId, 'ipfs://QmFreelancer');
      const d = await contract.disputes(disputeId);
      expect(d.evidenceHashFreelancer).to.equal('ipfs://QmFreelancer');
    });

    it('reverts for non-party', async () => {
      const { contract, disputeId, outsider } = await loadFixture(createdDisputeFixture);

      await expect(
        contract.connect(outsider).submitEvidence(disputeId, 'ipfs://Qm'),
      ).to.be.revertedWith('Not party');
    });

    it('reverts when dispute is in Voting status', async () => {
      const { contract, disputeId, client } = await loadFixture(votingFixture);

      await expect(
        contract.connect(client).submitEvidence(disputeId, 'ipfs://Qm'),
      ).to.be.revertedWith('Not open');
    });
  });

  // =============================================================
  //  startVoting
  // =============================================================
  describe('startVoting', () => {
    it('transitions to Voting and sets deadline', async () => {
      const { contract, disputeId } = await loadFixture(createdDisputeFixture);

      const tx = await contract.startVoting(disputeId);
      await expect(tx).to.emit(contract, 'VotingStarted');

      const d = await contract.disputes(disputeId);
      expect(d.status).to.equal(1); // Voting
      expect(d.votingDeadline).to.be.gt(0);
    });

    it('reverts if non-owner calls', async () => {
      const { contract, disputeId, juror1 } = await loadFixture(createdDisputeFixture);

      await expect(
        contract.connect(juror1).startVoting(disputeId),
      ).to.be.revertedWithCustomError(contract, 'OwnableUnauthorizedAccount');
    });

    it('reverts if already in Voting', async () => {
      const { contract, disputeId } = await loadFixture(votingFixture);

      await expect(
        contract.startVoting(disputeId),
      ).to.be.revertedWith('Already started');
    });
  });

  // =============================================================
  //  castVote
  // =============================================================
  describe('castVote', () => {
    it('eligible juror can vote for ClientWins', async () => {
      const { contract, disputeId, juror1 } = await loadFixture(votingFixture);

      await expect(contract.connect(juror1).castVote(disputeId, 1))
        .to.emit(contract, 'VoteCast')
        .withArgs(disputeId, juror1.address, 1, 80);
    });

    it('eligible juror can vote for FreelancerWins', async () => {
      const { contract, disputeId, juror2 } = await loadFixture(votingFixture);

      await expect(contract.connect(juror2).castVote(disputeId, 2))
        .to.emit(contract, 'VoteCast')
        .withArgs(disputeId, juror2.address, 2, 60);
    });

    it('reverts for juror with low trust score', async () => {
      const { contract, disputeId, outsider } = await loadFixture(votingFixture);

      await expect(
        contract.connect(outsider).castVote(disputeId, 1),
      ).to.be.revertedWith('Low trust score');
    });

    it('reverts for duplicate vote', async () => {
      const { contract, disputeId, juror1 } = await loadFixture(votingFixture);

      await contract.connect(juror1).castVote(disputeId, 1);
      await expect(
        contract.connect(juror1).castVote(disputeId, 2),
      ).to.be.revertedWith('Already voted');
    });

    it('reverts if client tries to vote', async () => {
      const { contract, disputeId, client } = await loadFixture(votingFixture);

      await contract.setJurorTrustScore(client.address, 100);
      await expect(
        contract.connect(client).castVote(disputeId, 1),
      ).to.be.revertedWith('Party cannot vote');
    });

    it('reverts if freelancer tries to vote', async () => {
      const { contract, disputeId, freelancer } = await loadFixture(votingFixture);

      await contract.setJurorTrustScore(freelancer.address, 100);
      await expect(
        contract.connect(freelancer).castVote(disputeId, 2),
      ).to.be.revertedWith('Party cannot vote');
    });

    it('reverts for invalid vote option (Pending)', async () => {
      const { contract, disputeId, juror1 } = await loadFixture(votingFixture);

      await expect(
        contract.connect(juror1).castVote(disputeId, 0), // Pending
      ).to.be.revertedWith('Invalid vote');
    });

    it('reverts for invalid vote option (Split)', async () => {
      const { contract, disputeId, juror1 } = await loadFixture(votingFixture);

      await expect(
        contract.connect(juror1).castVote(disputeId, 3), // Split
      ).to.be.revertedWith('Invalid vote');
    });

    it('reverts after deadline passes', async () => {
      const { contract, disputeId, juror1 } = await loadFixture(votingFixture);

      await time.increase(7 * 24 * 3600 + 1);
      await expect(
        contract.connect(juror1).castVote(disputeId, 1),
      ).to.be.revertedWith('Deadline passed');
    });

    it('accumulates weighted vote tallies', async () => {
      const { contract, disputeId, juror1, juror2, juror3 } = await loadFixture(votingFixture);

      await contract.connect(juror1).castVote(disputeId, 1); // Client +80
      await contract.connect(juror2).castVote(disputeId, 2); // Freelancer +60
      await contract.connect(juror3).castVote(disputeId, 1); // Client +90

      const d = await contract.disputes(disputeId);
      expect(d.clientVotes).to.equal(170);
      expect(d.freelancerVotes).to.equal(60);
    });
  });

  // =============================================================
  //  resolveDispute
  // =============================================================
  describe('resolveDispute', () => {
    it('CLIENT_WINS when client votes > freelancer votes', async () => {
      const { contract, disputeId, juror1, juror2, juror3 } = await loadFixture(votingFixture);

      await contract.connect(juror1).castVote(disputeId, 1); // 80
      await contract.connect(juror2).castVote(disputeId, 1); // 60
      await contract.connect(juror3).castVote(disputeId, 1); // 90

      await time.increase(7 * 24 * 3600 + 1);

      await expect(contract.resolveDispute(disputeId))
        .to.emit(contract, 'DisputeResolved')
        .withArgs(disputeId, 1); // ClientWins

      const d = await contract.disputes(disputeId);
      expect(d.status).to.equal(2); // Resolved
      expect(d.outcome).to.equal(1); // ClientWins
    });

    it('FREELANCER_WINS when freelancer votes > client votes', async () => {
      const { contract, disputeId, juror1, juror2, juror3 } = await loadFixture(votingFixture);

      await contract.connect(juror1).castVote(disputeId, 2); // 80
      await contract.connect(juror2).castVote(disputeId, 2); // 60
      await contract.connect(juror3).castVote(disputeId, 2); // 90

      await time.increase(7 * 24 * 3600 + 1);

      await contract.resolveDispute(disputeId);

      const d = await contract.disputes(disputeId);
      expect(d.status).to.equal(2);
      expect(d.outcome).to.equal(2); // FreelancerWins
    });

    it('SPLIT when votes are tied', async () => {
      const { contract, disputeId, juror1, juror2 } = await loadFixture(votingFixture);

      // Reduce minJurors to 2 so we can create a perfect tie
      await contract.setMinJurors(2);
      await contract.setJurorTrustScore(juror1.address, 75);
      await contract.setJurorTrustScore(juror2.address, 75);

      await contract.connect(juror1).castVote(disputeId, 1); // Client +75
      await contract.connect(juror2).castVote(disputeId, 2); // Freelancer +75

      await time.increase(7 * 24 * 3600 + 1);

      await contract.resolveDispute(disputeId);

      const d = await contract.disputes(disputeId);
      expect(d.outcome).to.equal(3); // Split
    });

    it('reverts while voting is still active (before deadline)', async () => {
      const { contract, disputeId, juror1, juror2, juror3 } = await loadFixture(votingFixture);

      await contract.connect(juror1).castVote(disputeId, 1);
      await contract.connect(juror2).castVote(disputeId, 1);
      await contract.connect(juror3).castVote(disputeId, 1);

      await expect(contract.resolveDispute(disputeId)).to.be.revertedWith('Voting active');
    });

    it('reverts when fewer than minJurors voted', async () => {
      const { contract, disputeId, juror1 } = await loadFixture(votingFixture);

      await contract.connect(juror1).castVote(disputeId, 1);
      await time.increase(7 * 24 * 3600 + 1);

      await expect(contract.resolveDispute(disputeId)).to.be.revertedWith('Not enough jurors');
    });

    it('reverts if dispute is not in Voting status', async () => {
      const { contract, disputeId } = await loadFixture(createdDisputeFixture);

      await expect(contract.resolveDispute(disputeId)).to.be.revertedWith('Not voting');
    });
  });

  // =============================================================
  //  getVotes
  // =============================================================
  describe('getVotes', () => {
    it('returns all votes for a dispute', async () => {
      const { contract, disputeId, juror1, juror2 } = await loadFixture(votingFixture);

      await contract.connect(juror1).castVote(disputeId, 1);
      await contract.connect(juror2).castVote(disputeId, 2);

      const votes = await contract.getVotes(disputeId);
      expect(votes).to.have.lengthOf(2);
      expect(votes[0].juror).to.equal(juror1.address);
      expect(votes[0].vote).to.equal(1);
      expect(votes[0].weight).to.equal(80);
      expect(votes[1].juror).to.equal(juror2.address);
      expect(votes[1].vote).to.equal(2);
      expect(votes[1].weight).to.equal(60);
    });
  });

  // =============================================================
  //  Configuration
  // =============================================================
  describe('Configuration', () => {
    it('owner can update minJurorTrustScore', async () => {
      const { contract } = await loadFixture(deployFixture);
      await contract.setMinJurorTrustScore(75);
      expect(await contract.minJurorTrustScore()).to.equal(75);
    });

    it('owner can update votingPeriod', async () => {
      const { contract } = await loadFixture(deployFixture);
      await contract.setVotingPeriod(14 * 24 * 3600);
      expect(await contract.votingPeriod()).to.equal(14 * 24 * 3600);
    });

    it('reverts if votingPeriod < 1 day', async () => {
      const { contract } = await loadFixture(deployFixture);
      await expect(contract.setVotingPeriod(3600)).to.be.revertedWith('Too short');
    });

    it('owner can update minJurors', async () => {
      const { contract } = await loadFixture(deployFixture);
      await contract.setMinJurors(5);
      expect(await contract.minJurors()).to.equal(5);
    });

    it('reverts if minJurors is zero', async () => {
      const { contract } = await loadFixture(deployFixture);
      await expect(contract.setMinJurors(0)).to.be.revertedWith('Invalid count');
    });

    it('owner can add/remove dispute creators', async () => {
      const { contract, juror1 } = await loadFixture(deployFixture);

      await contract.setDisputeCreator(juror1.address, true);
      expect(await contract.disputeCreators(juror1.address)).to.be.true;

      await contract.setDisputeCreator(juror1.address, false);
      expect(await contract.disputeCreators(juror1.address)).to.be.false;
    });

    it('non-owner cannot change config', async () => {
      const { contract, outsider } = await loadFixture(deployFixture);

      await expect(
        contract.connect(outsider).setMinJurorTrustScore(10),
      ).to.be.revertedWithCustomError(contract, 'OwnableUnauthorizedAccount');

      await expect(
        contract.connect(outsider).setVotingPeriod(14 * 24 * 3600),
      ).to.be.revertedWithCustomError(contract, 'OwnableUnauthorizedAccount');

      await expect(
        contract.connect(outsider).setMinJurors(5),
      ).to.be.revertedWithCustomError(contract, 'OwnableUnauthorizedAccount');

      await expect(
        contract.connect(outsider).setDisputeCreator(outsider.address, true),
      ).to.be.revertedWithCustomError(contract, 'OwnableUnauthorizedAccount');
    });
  });
});
