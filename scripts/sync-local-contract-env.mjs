import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const deploymentPath = path.join(rootDir, 'packages', 'contracts', 'deployments', 'latest.json');

if (!existsSync(deploymentPath)) {
  throw new Error('Deployment file not found. Run `pnpm contracts:deploy:local` first.');
}

const deploymentRaw = readFileSync(deploymentPath, 'utf-8');
const deployment = JSON.parse(deploymentRaw);

if (deployment.chainId !== 31337) {
  throw new Error(`Expected local chainId 31337, got ${deployment.chainId}.`);
}

const contracts = deployment.contracts ?? {};
const escrowAddress = contracts.JobEscrow?.address;
const reputationAddress = contracts.ReputationRegistry?.address;
const disputeAddress = contracts.DisputeResolution?.address;
const stableTokenAddress = contracts.DeTrustUSD?.address;

if (!escrowAddress || !reputationAddress || !disputeAddress || !stableTokenAddress) {
  throw new Error('Missing one or more contract addresses in deployments/latest.json');
}

const updateEnvContent = (content, updates) => {
  const lines = content.split(/\r?\n/);
  const existingKeys = new Set();

  const updatedLines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (!match) return line;

    const key = match[1];
    if (!(key in updates)) return line;

    existingKeys.add(key);
    return `${key}=${updates[key]}`;
  });

  Object.entries(updates).forEach(([key, value]) => {
    if (!existingKeys.has(key)) {
      updatedLines.push(`${key}=${value}`);
    }
  });

  return updatedLines.join('\n').replace(/\n?$/, '\n');
};

const ensureEnvFile = (filePath, fallbackExamplePath) => {
  if (existsSync(filePath)) return;
  if (existsSync(fallbackExamplePath)) {
    writeFileSync(filePath, readFileSync(fallbackExamplePath, 'utf-8'), 'utf-8');
    return;
  }
  writeFileSync(filePath, '', 'utf-8');
};

const webEnvPath = path.join(rootDir, 'apps', 'web', '.env.local');
const webExamplePath = path.join(rootDir, 'apps', 'web', '.env.example');
ensureEnvFile(webEnvPath, webExamplePath);

const apiEnvPath = path.join(rootDir, 'apps', 'api', '.env');
const apiExamplePath = path.join(rootDir, 'apps', 'api', '.env.example');
ensureEnvFile(apiEnvPath, apiExamplePath);

const webEnvContent = readFileSync(webEnvPath, 'utf-8');
const updatedWebEnv = updateEnvContent(webEnvContent, {
  NEXT_PUBLIC_CHAIN_ID: '31337',
  NEXT_PUBLIC_ESCROW_ADDRESS: escrowAddress,
  NEXT_PUBLIC_STABLE_TOKEN_ADDRESS: stableTokenAddress,
  NEXT_PUBLIC_REPUTATION_ADDRESS: reputationAddress,
  NEXT_PUBLIC_DISPUTE_ADDRESS: disputeAddress,
});
writeFileSync(webEnvPath, updatedWebEnv, 'utf-8');

const apiEnvContent = readFileSync(apiEnvPath, 'utf-8');
const updatedApiEnv = updateEnvContent(apiEnvContent, {
  CHAIN_ID: '31337',
  ESCROW_ADDRESS: escrowAddress,
  REPUTATION_ADDRESS: reputationAddress,
  DISPUTE_ADDRESS: disputeAddress,
});
writeFileSync(apiEnvPath, updatedApiEnv, 'utf-8');

console.log('Synced local contract addresses:');
console.log(`- JobEscrow: ${escrowAddress}`);
console.log(`- DeTrustUSD: ${stableTokenAddress}`);
console.log(`- ReputationRegistry: ${reputationAddress}`);
console.log(`- DisputeResolution: ${disputeAddress}`);
console.log(`Updated: ${webEnvPath}`);
console.log(`Updated: ${apiEnvPath}`);