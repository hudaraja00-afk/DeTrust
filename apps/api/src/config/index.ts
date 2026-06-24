import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000'),
  API_URL: z.string().default('http://localhost:4000'),
  
  // Database
  DATABASE_URL: z.string(),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  // Blockchain
  RPC_URL: z.string().default('http://localhost:8545'),
  CHAIN_ID: z.string().default('31337'),
  ESCROW_ADDRESS: z.string().optional(),
  REPUTATION_ADDRESS: z.string().optional(),
  DISPUTE_ADDRESS: z.string().optional(),
  
  // IPFS
  PINATA_API_KEY: z.string().optional(),
  PINATA_SECRET_KEY: z.string().optional(),
  IPFS_GATEWAY: z.string().default('https://gateway.pinata.cloud/ipfs'),
  LIGHTHOUSE_API_KEY: z.string(),
  LIGHTHOUSE_UPLOAD_URL: z.string().default('https://upload.lighthouse.storage/api/v0'),
  LIGHTHOUSE_GATEWAY_URL: z.string().default('https://gateway.lighthouse.storage'),
  FILE_ENCRYPTION_SECRET: z.string().min(32),
  FILE_ENCRYPTION_SECRET_FALLBACKS: z.string().optional(),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('noreply@detrust.local'),
  
  // AI Service
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),
  
  // Frontend
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  
  // Support
  SUPPORT_ADMIN_USER_ID: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  
  // File Upload
  MAX_FILE_SIZE: z.string().default('10485760'),
  
  // Logging
  LOG_LEVEL: z.string().default('debug'),
});

// Parse and validate environment
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;

// Config object for easy access
export const config = {
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  server: {
    port: parseInt(env.PORT, 10),
    apiUrl: env.API_URL,
    frontendUrl: env.FRONTEND_URL,
  },
  
  database: {
    url: env.DATABASE_URL,
  },
  
  redis: {
    url: env.REDIS_URL,
  },
  
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  blockchain: {
    rpcUrl: env.RPC_URL,
    chainId: parseInt(env.CHAIN_ID, 10),
    contracts: {
      escrow: env.ESCROW_ADDRESS,
      reputation: env.REPUTATION_ADDRESS,
      dispute: env.DISPUTE_ADDRESS,
    },
  },
  
  ipfs: {
    pinataApiKey: env.PINATA_API_KEY,
    pinataSecretKey: env.PINATA_SECRET_KEY,
    gateway: env.IPFS_GATEWAY,
  },

  storage: {
    lighthouse: {
      apiKey: env.LIGHTHOUSE_API_KEY,
      uploadUrl: env.LIGHTHOUSE_UPLOAD_URL.replace(/\/$/, ''),
      gatewayUrl: env.LIGHTHOUSE_GATEWAY_URL.replace(/\/$/, ''),
    },
    encryption: {
      masterKey: env.FILE_ENCRYPTION_SECRET,
      fallbackKeys: env.FILE_ENCRYPTION_SECRET_FALLBACKS
        ? env.FILE_ENCRYPTION_SECRET_FALLBACKS.split(',').map((key) => key.trim()).filter(Boolean)
        : [],
    },
  },
  
  email: {
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT, 10),
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM,
  },
  
  ai: {
    serviceUrl: env.AI_SERVICE_URL,
  },

  support: {
    adminUserId: env.SUPPORT_ADMIN_USER_ID,
  },
  
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    max: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
  },
  
  upload: {
    maxFileSize: parseInt(env.MAX_FILE_SIZE, 10),
  },
  
  logging: {
    level: env.LOG_LEVEL,
  },
};

export default config;
