-- AlterTable
ALTER TABLE "ClientProfile" ADD COLUMN "completenessScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ClientProfile" ADD COLUMN "profileComplete" BOOLEAN NOT NULL DEFAULT false;
