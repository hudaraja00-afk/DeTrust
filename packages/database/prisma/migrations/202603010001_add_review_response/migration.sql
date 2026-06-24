-- AlterTable: Add rebuttal response fields to Review (SRS M3-I6)
ALTER TABLE "Review" ADD COLUMN "responseText" TEXT;
ALTER TABLE "Review" ADD COLUMN "responseAt" TIMESTAMP(3);
