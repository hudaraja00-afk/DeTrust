/**
 * Jest Global Setup — DeTrust API Tests
 *
 * Mocks external dependencies so unit & integration tests run without
 * live Postgres, Redis, or blockchain connections.
 */
import { PrismaClient } from '@prisma/client';

// ─── Mock Config (must be before any service imports) ─────────
jest.mock('../src/config', () => ({
  config: {
    isDev: false,
    isProd: false,
    isTest: true,
    server: {
      port: 4000,
      apiUrl: 'http://localhost:4000',
      frontendUrl: 'http://localhost:3000',
    },
    database: { url: 'mock://db' },
    redis: { url: 'mock://redis' },
    jwt: {
      secret: 'test-secret-32chars-abcdefghijklmn',
      expiresIn: '7d',
      refreshExpiresIn: '30d',
    },
    blockchain: {
      rpcUrl: 'http://localhost:8545',
      chainId: 31337,
      contracts: { escrow: '0x0', reputation: '0x0', dispute: '0x0' },
    },
    ipfs: { pinataApiKey: '', pinataSecretKey: '', gateway: '' },
    storage: {
      lighthouse: { apiKey: 'test', uploadUrl: 'http://localhost', gatewayUrl: 'http://localhost' },
      encryption: { masterKey: 'a'.repeat(32), fallbackKeys: [] },
    },
    email: { host: '', port: 587, user: '', pass: '', from: 'test@test.com' },
    ai: { serviceUrl: 'http://localhost:8000' },
    support: { adminUserId: 'admin-001' },
    rateLimit: { windowMs: 900000, max: 100 },
    upload: { maxFileSize: 10485760 },
    logging: { level: 'silent' },
  },
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'mock://db',
    JWT_SECRET: 'test-secret-32chars-abcdefghijklmn',
    LIGHTHOUSE_API_KEY: 'test',
    FILE_ENCRYPTION_SECRET: 'a'.repeat(32),
  },
  default: undefined,
}));

// ─── Mock Prisma ──────────────────────────────────────────────
// We create a deep mock of PrismaClient.  Every Prisma model method
// (findUnique, create, update, count, aggregate, $transaction …)
// becomes a jest.fn() that individual tests can configure with
// mockResolvedValue / mockImplementation.
const mockPrismaModels = [
  'user', 'job', 'proposal', 'contract', 'milestone',
  'review', 'dispute', 'disputeVote', 'disputeEvidence',
  'notification', 'freelancerProfile', 'clientProfile',
  'trustScoreHistory', 'secureFile',
] as const;

type MockModel = Record<string, jest.Mock>;
type MockPrisma = Record<string, MockModel | jest.Mock>;

function buildPrismaMock(): MockPrisma {
  const mock: MockPrisma = {};
  for (const model of mockPrismaModels) {
    mock[model] = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      upsert: jest.fn(),
    } satisfies MockModel;
  }
  mock.$transaction = jest.fn().mockImplementation((cb: (tx: MockPrisma) => Promise<unknown>) => {
    // By default, $transaction just runs the callback with the same mock
    return cb(mock as unknown as MockPrisma);
  });
  mock.$connect = jest.fn();
  mock.$disconnect = jest.fn();
  return mock;
}

export const prismaMock = buildPrismaMock() as unknown as jest.Mocked<PrismaClient> & MockPrisma;

// Mock the database config module so `import { prisma } from '../config/database'` resolves to our mock
jest.mock('../src/config/database', () => ({
  prisma: prismaMock,
  connectDatabase: jest.fn(),
  disconnectDatabase: jest.fn(),
}));

// Also mock the direct @detrust/database import
jest.mock('@detrust/database', () => ({
  prisma: prismaMock,
}));

// ─── Mock Redis ───────────────────────────────────────────────
export const redisMock = {
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(undefined),
  cacheDelete: jest.fn().mockResolvedValue(undefined),
  cacheDeletePattern: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../src/config/redis', () => ({
  redis: { status: 'ready' },
  connectRedis: jest.fn(),
  disconnectRedis: jest.fn(),
  ...redisMock,
}));

// ─── Mock Events (Socket.IO emitters) ─────────────────────────
jest.mock('../src/events/trustScore.events', () => ({
  emitTrustScoreUpdated: jest.fn(),
}));

jest.mock('../src/events/dispute.events', () => ({
  emitDisputeOpened: jest.fn(),
  emitDisputeVotingStarted: jest.fn(),
  emitDisputeResolved: jest.fn(),
}));

// ─── Mock queues (BullMQ) ─────────────────────────────────────
jest.mock('../src/queues', () => ({
  jurorNotificationQueue: { add: jest.fn() },
  trustScoreUserQueue: { add: jest.fn() },
}));

// ─── Mock external services ───────────────────────────────────
jest.mock('../src/services/notification.service', () => ({
  notificationService: {
    createNotification: jest.fn().mockResolvedValue(undefined),
    createBulkNotifications: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../src/services/ipfs.service', () => ({
  ipfsService: {
    uploadJSON: jest.fn().mockResolvedValue('QmTestIpfsHash123456789'),
    uploadFile: jest.fn().mockResolvedValue('QmTestFileHash123456789'),
  },
}));

jest.mock('../src/services/blockchain.service', () => ({
  blockchainService: {
    recordFeedback: jest.fn().mockResolvedValue('0xTestTxHash123456'),
  },
}));

jest.mock('../src/services/escrow.service', () => ({
  escrowService: {
    isAvailable: true,
    resolveDisputeOnChain: jest.fn().mockResolvedValue('0xDisputeTxHash789'),
    raiseDisputeOnChain: jest.fn().mockResolvedValue('0xRaiseDisputeTxHash'),
  },
}));

jest.mock('../src/services/storage.service', () => ({
  storageService: {
    uploadFile: jest.fn().mockResolvedValue({ id: 'file-1', cidOrPath: 'QmFileHash' }),
  },
}));

// ─── Reset all mocks between tests ───────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
});
