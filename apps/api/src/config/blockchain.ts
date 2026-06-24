import { ethers } from 'ethers';

import { config } from './index';

// JSON-RPC Provider
export const provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);

// Check if contracts are configured
export const isBlockchainConfigured = (): boolean => {
  return !!(
    config.blockchain.contracts.escrow &&
    config.blockchain.contracts.reputation &&
    config.blockchain.contracts.dispute
  );
};

// Get contract addresses
export const getContractAddresses = () => ({
  escrow: config.blockchain.contracts.escrow,
  reputation: config.blockchain.contracts.reputation,
  dispute: config.blockchain.contracts.dispute,
});

// Verify connection
export const verifyBlockchainConnection = async (): Promise<boolean> => {
  try {
    const network = await provider.getNetwork();
    console.log(`✅ Blockchain connected: Chain ID ${network.chainId}`);
    return true;
  } catch (error) {
    console.error('❌ Blockchain connection failed:', error);
    return false;
  }
};

export default provider;
