-- CreateTable: DisputeEvidence
-- Stores per-file evidence metadata with party attribution for disputes

CREATE TABLE IF NOT EXISTS "DisputeEvidence" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "cid" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DisputeEvidence_disputeId_idx" ON "DisputeEvidence"("disputeId");

-- AddForeignKey
ALTER TABLE "DisputeEvidence"
    ADD CONSTRAINT "DisputeEvidence_disputeId_fkey"
    FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DisputeEvidence"
    ADD CONSTRAINT "DisputeEvidence_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
