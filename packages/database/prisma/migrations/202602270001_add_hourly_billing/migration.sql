-- AlterTable: Add billing fields to Contract
ALTER TABLE "Contract" ADD COLUMN "billingType" TEXT NOT NULL DEFAULT 'FIXED';
ALTER TABLE "Contract" ADD COLUMN "hourlyRate" DECIMAL(10,2);
ALTER TABLE "Contract" ADD COLUMN "weeklyHourLimit" INTEGER;

-- CreateTable: TimeEntry for hourly time tracking
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hours" DECIMAL(4,2) NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimeEntry_milestoneId_idx" ON "TimeEntry"("milestoneId");

-- CreateIndex: Unique constraint on milestoneId + date
CREATE UNIQUE INDEX "TimeEntry_milestoneId_date_key" ON "TimeEntry"("milestoneId", "date");

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
