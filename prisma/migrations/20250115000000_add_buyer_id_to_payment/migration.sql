-- AlterTable: Adiciona coluna buyerId como nullable primeiro
ALTER TABLE "payments" ADD COLUMN "buyerId" TEXT;

-- Atualiza pagamentos existentes: usa producerId como buyerId (assumindo que o produtor era o comprador)
-- Se não houver pagamentos, esta query não faz nada
UPDATE "payments" SET "buyerId" = "producerId" WHERE "buyerId" IS NULL;

-- Torna a coluna NOT NULL
ALTER TABLE "payments" ALTER COLUMN "buyerId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

