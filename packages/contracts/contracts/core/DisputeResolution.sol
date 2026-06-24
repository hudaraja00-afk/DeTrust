// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract DisputeResolution is Ownable {
	enum DisputeStatus {
		Open,
		Voting,
		Resolved
	}

	enum DisputeOutcome {
		Pending,
		ClientWins,
		FreelancerWins,
		Split
	}

	struct Dispute {
		bytes32 jobId;
		address client;
		address freelancer;
		uint256 escrowAmount;
		string evidenceHashClient;
		string evidenceHashFreelancer;
		DisputeStatus status;
		DisputeOutcome outcome;
		uint256 votingDeadline;
		uint256 clientVotes;
		uint256 freelancerVotes;
		uint256 createdAt;
	}

	struct Vote {
		address juror;
		DisputeOutcome vote;
		uint256 weight;
		uint256 timestamp;
	}

	uint256 public minJurorTrustScore = 50;
	uint256 public votingPeriod = 7 days;
	uint256 public minJurors = 3;

	mapping(bytes32 => Dispute) public disputes;
	mapping(bytes32 => Vote[]) private disputeVotes;
	mapping(bytes32 => mapping(address => bool)) public hasVoted;
	mapping(address => uint256) public jurorTrustScores;
	mapping(address => bool) public disputeCreators;

	event DisputeCreated(bytes32 indexed disputeId, bytes32 indexed jobId, address client, address freelancer);
	event EvidenceSubmitted(bytes32 indexed disputeId, address submitter, string evidenceHash);
	event VotingStarted(bytes32 indexed disputeId, uint256 deadline);
	event VoteCast(bytes32 indexed disputeId, address juror, DisputeOutcome vote, uint256 weight);
	event DisputeResolved(bytes32 indexed disputeId, DisputeOutcome outcome);

	modifier onlyCreator() {
		require(disputeCreators[_msgSender()] || _msgSender() == owner(), "Not authorized");
		_;
	}

	constructor() Ownable(msg.sender) {
		disputeCreators[_msgSender()] = true;
	}

	function createDispute(
		bytes32 disputeId,
		bytes32 jobId,
		address client,
		address freelancer,
		uint256 escrowAmount
	) external onlyCreator {
		require(disputeId != bytes32(0) && disputes[disputeId].createdAt == 0, "Dispute exists");
		require(jobId != bytes32(0), "Invalid jobId");
		require(client != address(0) && freelancer != address(0), "Invalid party");
		require(escrowAmount > 0, "Invalid escrow");

		disputes[disputeId] = Dispute({
			jobId: jobId,
			client: client,
			freelancer: freelancer,
			escrowAmount: escrowAmount,
			evidenceHashClient: "",
			evidenceHashFreelancer: "",
			status: DisputeStatus.Open,
			outcome: DisputeOutcome.Pending,
			votingDeadline: 0,
			clientVotes: 0,
			freelancerVotes: 0,
			createdAt: block.timestamp
		});

		emit DisputeCreated(disputeId, jobId, client, freelancer);
	}

	function submitEvidence(bytes32 disputeId, string calldata evidenceHash) external {
		Dispute storage dispute = _requireDispute(disputeId);
		require(dispute.status == DisputeStatus.Open, "Not open");
		require(_msgSender() == dispute.client || _msgSender() == dispute.freelancer, "Not party");

		if (_msgSender() == dispute.client) {
			dispute.evidenceHashClient = evidenceHash;
		} else {
			dispute.evidenceHashFreelancer = evidenceHash;
		}

		emit EvidenceSubmitted(disputeId, _msgSender(), evidenceHash);
	}

	function startVoting(bytes32 disputeId) external onlyOwner {
		Dispute storage dispute = _requireDispute(disputeId);
		require(dispute.status == DisputeStatus.Open, "Already started");

		dispute.status = DisputeStatus.Voting;
		dispute.votingDeadline = block.timestamp + votingPeriod;

		emit VotingStarted(disputeId, dispute.votingDeadline);
	}

	function castVote(bytes32 disputeId, DisputeOutcome vote) external {
		Dispute storage dispute = _requireDispute(disputeId);
		require(dispute.status == DisputeStatus.Voting, "Voting closed");
		require(block.timestamp <= dispute.votingDeadline, "Deadline passed");
		require(!hasVoted[disputeId][_msgSender()], "Already voted");
		require(_msgSender() != dispute.client && _msgSender() != dispute.freelancer, "Party cannot vote");
		require(vote == DisputeOutcome.ClientWins || vote == DisputeOutcome.FreelancerWins, "Invalid vote");

		uint256 weight = jurorTrustScores[_msgSender()];
		require(weight >= minJurorTrustScore, "Low trust score");

		hasVoted[disputeId][_msgSender()] = true;

		if (vote == DisputeOutcome.ClientWins) {
			dispute.clientVotes += weight;
		} else {
			dispute.freelancerVotes += weight;
		}

		disputeVotes[disputeId].push(
			Vote({juror: _msgSender(), vote: vote, weight: weight, timestamp: block.timestamp})
		);

		emit VoteCast(disputeId, _msgSender(), vote, weight);
	}

	function resolveDispute(bytes32 disputeId) external {
		Dispute storage dispute = _requireDispute(disputeId);
		require(dispute.status == DisputeStatus.Voting, "Not voting");
		require(block.timestamp > dispute.votingDeadline, "Voting active");
		require(disputeVotes[disputeId].length >= minJurors, "Not enough jurors");

		if (dispute.clientVotes > dispute.freelancerVotes) {
			dispute.outcome = DisputeOutcome.ClientWins;
		} else if (dispute.freelancerVotes > dispute.clientVotes) {
			dispute.outcome = DisputeOutcome.FreelancerWins;
		} else {
			dispute.outcome = DisputeOutcome.Split;
		}

		dispute.status = DisputeStatus.Resolved;

		emit DisputeResolved(disputeId, dispute.outcome);
	}

	function setJurorTrustScore(address juror, uint256 score) external onlyOwner {
		jurorTrustScores[juror] = score;
	}

	function setMinJurorTrustScore(uint256 score) external onlyOwner {
		minJurorTrustScore = score;
	}

	function setVotingPeriod(uint256 period) external onlyOwner {
		require(period >= 1 days, "Too short");
		votingPeriod = period;
	}

	function setMinJurors(uint256 count) external onlyOwner {
		require(count > 0, "Invalid count");
		minJurors = count;
	}

	function setDisputeCreator(address creator, bool allowed) external onlyOwner {
		disputeCreators[creator] = allowed;
	}

	function getVotes(bytes32 disputeId) external view returns (Vote[] memory) {
		return disputeVotes[disputeId];
	}

	function _requireDispute(bytes32 disputeId) private view returns (Dispute storage dispute) {
		dispute = disputes[disputeId];
		require(dispute.createdAt != 0, "Dispute missing");
	}
}
