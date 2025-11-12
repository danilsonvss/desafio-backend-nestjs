-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('TRANSACTION', 'PLATFORM');

-- CreateTable
CREATE TABLE "taxes" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "type" "TaxType" NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "taxes_country_type_key" ON "taxes"("country", "type");

