-- Secure file infrastructure for encrypted Lighthouse uploads
-- Runs safely even if enums/table already exist

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SecureFileCategory') THEN
    CREATE TYPE "SecureFileCategory" AS ENUM ('AVATAR', 'RESUME', 'CERTIFICATION');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SecureFileVisibility') THEN
    CREATE TYPE "SecureFileVisibility" AS ENUM ('PRIVATE', 'AUTHENTICATED', 'PUBLIC');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SecureFileResourceType') THEN
    CREATE TYPE "SecureFileResourceType" AS ENUM ('USER', 'FREELANCER_PROFILE', 'CERTIFICATION');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "SecureFile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "category" "SecureFileCategory" NOT NULL,
  "visibility" "SecureFileVisibility" NOT NULL DEFAULT 'PRIVATE',
  "storageProvider" TEXT NOT NULL DEFAULT 'LIGHTHOUSE',
  "cid" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "checksum" TEXT,
  "encryptionAlgorithm" TEXT NOT NULL DEFAULT 'AES-256-GCM',
  "encryptionSalt" TEXT NOT NULL,
  "encryptionIv" TEXT NOT NULL,
  "encryptionAuthTag" TEXT NOT NULL,
  "resourceType" "SecureFileResourceType",
  "resourceId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecureFile_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SecureFile_userId_fkey'
  ) THEN
    ALTER TABLE "SecureFile"
      ADD CONSTRAINT "SecureFile_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "SecureFile_userId_category_idx" ON "SecureFile" ("userId", "category");
CREATE INDEX IF NOT EXISTS "SecureFile_resource_lookup_idx" ON "SecureFile" ("resourceType", "resourceId");
