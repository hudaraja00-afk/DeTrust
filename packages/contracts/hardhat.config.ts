import * as dotenv from 'dotenv';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-gas-reporter';
import '@typechain/hardhat';

dotenv.config();

const {
	PRIVATE_KEY,
	LOCALHOST_RPC_URL,
	POLYGON_MUMBAI_RPC_URL,
	POLYGON_RPC_URL,
	POLYGONSCAN_API_KEY,
	ETHERSCAN_API_KEY,
	REPORT_GAS,
	COINMARKETCAP_API_KEY,
} = process.env;

const sharedAccounts = PRIVATE_KEY ? [PRIVATE_KEY] : undefined;

const config: HardhatUserConfig = {
	solidity: {
		version: '0.8.24',
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	defaultNetwork: 'hardhat',
	networks: {
		hardhat: {
			chainId: 31337,
		},
		localhost: {
			url: LOCALHOST_RPC_URL || 'http://127.0.0.1:8545',
			chainId: 31337,
			accounts: sharedAccounts,
		},
		polygonMumbai: {
			url: POLYGON_MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
			chainId: 80001,
			accounts: sharedAccounts,
		},
		polygon: {
			url: POLYGON_RPC_URL || 'https://polygon-rpc.com',
			chainId: 137,
			accounts: sharedAccounts,
		},
	},
	gasReporter: {
		enabled: REPORT_GAS?.toLowerCase() === 'true',
		currency: 'USD',
		coinmarketcap: COINMARKETCAP_API_KEY || undefined,
	},
	etherscan: {
		apiKey: {
			polygonMumbai: POLYGONSCAN_API_KEY || '',
			polygon: POLYGONSCAN_API_KEY || ETHERSCAN_API_KEY || '',
		},
	},
	typechain: {
		outDir: 'typechain-types',
		target: 'ethers-v6',
	},
	paths: {
		sources: './contracts',
		tests: './test',
		cache: './cache',
		artifacts: './artifacts',
	},
};

export default config;
