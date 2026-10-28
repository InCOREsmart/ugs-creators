CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'CREATOR');
CREATE TYPE "CampaignStatus" AS ENUM ('SEARCH', 'NEGOTIATION', 'BRIEF_ACCEPTED', 'CONTRACT', 'CONTENT_CREATION', 'APPROVAL', 'PUBLICATION', 'PAYMENT', 'COMPLETED', 'CANCELLED');
CREATE TYPE "CreatorTaxStatus" AS ENUM ('SELF_EMPLOYED', 'IP', 'INDIVIDUAL');

CREATE TABLE "User" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'MANAGER',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "refreshHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Organization" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "legalName" TEXT,
  "inn" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Campaign" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "status" "CampaignStatus" NOT NULL DEFAULT 'SEARCH',
  "budgetKopecks" BIGINT NOT NULL DEFAULT 0,
  "deadline" TIMESTAMP(3),
  "createdBy" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Campaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Campaign_organizationId_status_idx" ON "Campaign"("organizationId", "status");

CREATE TABLE "Creator" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "displayName" TEXT NOT NULL,
  "taxStatus" "CreatorTaxStatus" NOT NULL DEFAULT 'INDIVIDUAL',
  "priceList" JSONB NOT NULL DEFAULT '{}',
  "audienceMetrics" JSONB NOT NULL DEFAULT '{}',
  "engagementRate" DECIMAL(7,4),
  "fraudScore" DECIMAL(5,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Creator_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Creator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Creator_userId_key" ON "Creator"("userId");
CREATE INDEX "Creator_displayName_idx" ON "Creator"("displayName");
