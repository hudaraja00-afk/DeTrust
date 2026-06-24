-- Add EVIDENCE to SecureFileCategory enum
ALTER TYPE "SecureFileCategory" ADD VALUE IF NOT EXISTS 'EVIDENCE';

-- Add DISPUTE to SecureFileResourceType enum
ALTER TYPE "SecureFileResourceType" ADD VALUE IF NOT EXISTS 'DISPUTE';
