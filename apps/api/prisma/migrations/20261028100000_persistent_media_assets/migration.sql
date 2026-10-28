CREATE TYPE "MediaAssetStatus" AS ENUM ('UPLOAD_PENDING', 'QUEUED', 'PROCESSING', 'READY', 'FAILED');
CREATE TABLE "MediaAsset" (
  "id" UUID NOT NULL,
  "campaignId" UUID NOT NULL,
  "createdBy" UUID NOT NULL,
  "objectKey" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "originalBytes" BIGINT NOT NULL,
  "status" "MediaAssetStatus" NOT NULL DEFAULT 'UPLOAD_PENDING',
  "jobId" TEXT,
  "durationSeconds" DOUBLE PRECISION,
  "width" INTEGER,
  "height" INTEGER,
  "variants" JSONB,
  "thumbnailKey" TEXT,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MediaAsset_objectKey_key" ON "MediaAsset"("objectKey");
CREATE INDEX "MediaAsset_campaignId_status_idx" ON "MediaAsset"("campaignId", "status");
CREATE INDEX "MediaAsset_createdBy_createdAt_idx" ON "MediaAsset"("createdBy", "createdAt");
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
