// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {JobEscrow} from "./JobEscrow.sol";
import {ReputationRegistry} from "./ReputationRegistry.sol";
import {DisputeResolution} from "./DisputeResolution.sol";

contract DeTrustFactory is Ownable {
	struct CoreDeployment {
		address jobEscrow;
		address reputationRegistry;
		address disputeResolution;
		uint256 deployedAt;
	}

	CoreDeployment[] private deployments;

	event CoreContractsDeployed(
		uint256 indexed deploymentId,
		address jobEscrow,
		address reputationRegistry,
		address disputeResolution
	);

	constructor() Ownable(msg.sender) {}

	function deployCoreContracts(address paymentToken, address feeRecipient, address admin)
		external
		onlyOwner
		returns (CoreDeployment memory deployment)
	{
		require(admin != address(0), "Invalid admin");
		require(paymentToken != address(0), "Invalid payment token");
		JobEscrow jobEscrow = new JobEscrow(paymentToken, feeRecipient);
		ReputationRegistry reputation = new ReputationRegistry();
		DisputeResolution dispute = new DisputeResolution();

		dispute.setDisputeCreator(address(jobEscrow), true);
		dispute.setDisputeCreator(admin, true);

		jobEscrow.transferOwnership(admin);
		reputation.transferOwnership(admin);
		dispute.transferOwnership(admin);

		deployment = CoreDeployment({
			jobEscrow: address(jobEscrow),
			reputationRegistry: address(reputation),
			disputeResolution: address(dispute),
			deployedAt: block.timestamp
		});

		deployments.push(deployment);

		emit CoreContractsDeployed(
			deployments.length - 1,
			deployment.jobEscrow,
			deployment.reputationRegistry,
			deployment.disputeResolution
		);
	}

	function latestDeployment() external view returns (CoreDeployment memory) {
		require(deployments.length > 0, "No deployments");
		return deployments[deployments.length - 1];
	}

	function deploymentsCount() external view returns (uint256) {
		return deployments.length;
	}

	function getDeployment(uint256 index) external view returns (CoreDeployment memory) {
		require(index < deployments.length, "Out of bounds");
		return deployments[index];
	}
}
