-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NONE', 'PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "kycStatus" "KycStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN "kycDocumentType" TEXT,
ADD COLUMN "kycIdNumber" TEXT,
ADD COLUMN "kycCountry" TEXT;
