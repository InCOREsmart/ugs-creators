CREATE TYPE "CreatorAssignmentStatus" AS ENUM ('ASSIGNED', 'ACCEPTED', 'DECLINED');

CREATE TABLE "CreatorAssignment" (
  "id" UUID NOT NULL,
  "campaignId" UUID NOT NULL,
  "creatorId" UUID NOT NULL,
  "status" "CreatorAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CreatorAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreatorAssignment_campaignId_creatorId_key" ON "CreatorAssignment"("campaignId", "creatorId");
CREATE INDEX "CreatorAssignment_creatorId_status_idx" ON "CreatorAssignment"("creatorId", "status");

ALTER TABLE "CreatorAssignment" ADD CONSTRAINT "CreatorAssignment_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreatorAssignment" ADD CONSTRAINT "CreatorAssignment_creatorId_fkey"
  FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
