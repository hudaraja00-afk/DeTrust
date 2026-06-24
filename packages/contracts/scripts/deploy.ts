import { mkdirSync, writeFileSync } from "fs";
import * as path from "path";

import { ethers, network } from "hardhat";
import type { Contract } from "ethers";

type DeploymentRecord = {
	address: string;
	blockNumber: number;
	txHash: string;
};

type DeploymentResult<T extends Contract = Contract> = {
	name: string;
	address: string;
	contract: T;
	txHash: string;
	blockNumber: number;
};

async function deployContract<T extends Contract = Contract>(name: string, args: unknown[] = []) {
	const contract = (await ethers.deployContract(name, args)) as T;
	await contract.waitForDeployment();
	const address = await contract.getAddress();
	const deploymentTx = contract.deploymentTransaction();
	const receipt = await deploymentTx?.wait();

	console.log(`✅ ${name} deployed to ${address}`);

	const result: DeploymentResult<T> = {
		name,
		address,
		contract,
		txHash: deploymentTx?.hash ?? "",
		blockNumber: receipt?.blockNumber ?? 0,
	};

	return result;
}

async function main() {
	const signers = await ethers.getSigners();
	const [deployer, ...others] = signers;
	const feeRecipient = process.env.FEE_RECIPIENT ?? deployer.address;
	const admin = process.env.CORE_OWNER ?? deployer.address;
	const networkInfo = await deployer.provider!.getNetwork();

	console.log(`\n🚀 Deploying contracts to ${network.name} (chainId ${networkInfo.chainId})`);
	console.log(`Deployer: ${deployer.address}`);
	const stablecoinInitialSupply = 1_000_000_000_000; // 1,000,000 dUSD with 6 decimals

	const stablecoin = await deployContract("DeTrustUSD", [deployer.address, stablecoinInitialSupply]);
	const stablecoinContract = stablecoin.contract.connect(deployer);
	const localFaucetAmount = 100_000_000_000; // 100,000 dUSD with 6 decimals

	for (const signer of others.slice(0, 5)) {
		await (await stablecoinContract.getFunction("mint")(signer.address, localFaucetAmount)).wait();
	}

	const reputation = await deployContract("ReputationRegistry");
	const dispute = await deployContract("DisputeResolution");
	const jobEscrow = await deployContract("JobEscrow", [stablecoin.address, feeRecipient]);

	// Wire contracts together
	const disputeContract = dispute.contract.connect(deployer);
	const jobEscrowAddress = jobEscrow.address;
	const adminAddress = admin;

	const setDisputeCreator = disputeContract.getFunction("setDisputeCreator");
	await (await setDisputeCreator(jobEscrowAddress, true)).wait();

	if (adminAddress !== deployer.address) {
		await (await setDisputeCreator(adminAddress, true)).wait();
	}

	if (adminAddress !== deployer.address) {
		await (await jobEscrow.contract.getFunction("transferOwnership")(adminAddress)).wait();
		await (await reputation.contract.getFunction("transferOwnership")(adminAddress)).wait();
		await (await dispute.contract.getFunction("transferOwnership")(adminAddress)).wait();
	}

	const deploymentData: Record<string, DeploymentRecord> = {
		DeTrustUSD: {
			address: stablecoin.address,
			blockNumber: stablecoin.blockNumber,
			txHash: stablecoin.txHash,
		},
		JobEscrow: {
			address: jobEscrow.address,
			blockNumber: jobEscrow.blockNumber,
			txHash: jobEscrow.txHash,
		},
		ReputationRegistry: {
			address: reputation.address,
			blockNumber: reputation.blockNumber,
			txHash: reputation.txHash,
		},
		DisputeResolution: {
			address: dispute.address,
			blockNumber: dispute.blockNumber,
			txHash: dispute.txHash,
		},
	};

	const payload = {
		network: network.name,
		chainId: Number(networkInfo.chainId),
		timestamp: Math.floor(Date.now() / 1000),
		deployer: deployer.address,
		feeRecipient,
		contracts: deploymentData,
	};

	const deploymentsDir = path.join(__dirname, "..", "deployments");
	mkdirSync(deploymentsDir, { recursive: true });

	const latestPath = path.join(deploymentsDir, "latest.json");
	const networkPath = path.join(deploymentsDir, `${network.name}.json`);

	writeFileSync(latestPath, JSON.stringify(payload, null, 2));
	writeFileSync(networkPath, JSON.stringify(payload, null, 2));

	console.log(`\n📝 Deployment data saved to ${latestPath}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
