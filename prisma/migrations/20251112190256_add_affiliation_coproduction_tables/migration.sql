-- CreateTable
CREATE TABLE "affiliations" (
    "id" TEXT NOT NULL,
    "producerId" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coproductions" (
    "id" TEXT NOT NULL,
    "producerId" TEXT NOT NULL,
    "coproducerId" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coproductions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affiliations_producerId_affiliateId_key" ON "affiliations"("producerId", "affiliateId");

-- CreateIndex
CREATE UNIQUE INDEX "coproductions_producerId_coproducerId_key" ON "coproductions"("producerId", "coproducerId");

-- AddForeignKey
ALTER TABLE "affiliations" ADD CONSTRAINT "affiliations_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliations" ADD CONSTRAINT "affiliations_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coproductions" ADD CONSTRAINT "coproductions_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coproductions" ADD CONSTRAINT "coproductions_coproducerId_fkey" FOREIGN KEY ("coproducerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

