-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "country" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'APPROVED',
    "producerId" TEXT NOT NULL,
    "affiliateId" TEXT,
    "coproducerId" TEXT,
    "transactionTax" DECIMAL(10,2) NOT NULL,
    "platformTax" DECIMAL(10,2) NOT NULL,
    "producerCommission" DECIMAL(10,2) NOT NULL,
    "affiliateCommission" DECIMAL(10,2),
    "coproducerCommission" DECIMAL(10,2),
    "platformCommission" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

