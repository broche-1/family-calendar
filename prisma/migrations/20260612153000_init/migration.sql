CREATE TYPE "AvailabilityStatus" AS ENUM ('UNKNOWN', 'FREE', 'BUSY', 'MAYBE');

CREATE TABLE "FamilyMember" (
  "id" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "color" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isOrganizer" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Season" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "mostFreeThreshold" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Weekend" (
  "id" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "label" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  CONSTRAINT "Weekend_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Availability" (
  "id" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "weekendId" TEXT NOT NULL,
  "familyMemberId" TEXT NOT NULL,
  "status" "AvailabilityStatus" NOT NULL DEFAULT 'UNKNOWN',
  "note" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "familyMemberId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FamilyMember_firstName_key" ON "FamilyMember"("firstName");
CREATE UNIQUE INDEX "Season_name_key" ON "Season"("name");
CREATE INDEX "Season_isActive_idx" ON "Season"("isActive");
CREATE UNIQUE INDEX "Weekend_seasonId_startDate_key" ON "Weekend"("seasonId", "startDate");
CREATE INDEX "Weekend_seasonId_sortOrder_idx" ON "Weekend"("seasonId", "sortOrder");
CREATE UNIQUE INDEX "Availability_weekendId_familyMemberId_key" ON "Availability"("weekendId", "familyMemberId");
CREATE INDEX "Availability_seasonId_idx" ON "Availability"("seasonId");
CREATE INDEX "Availability_familyMemberId_idx" ON "Availability"("familyMemberId");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_familyMemberId_idx" ON "Session"("familyMemberId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

ALTER TABLE "Weekend" ADD CONSTRAINT "Weekend_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_weekendId_fkey" FOREIGN KEY ("weekendId") REFERENCES "Weekend"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
