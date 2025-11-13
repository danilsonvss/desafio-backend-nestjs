import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Verificar se a coluna já existe
    const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' AND column_name = 'buyerId';
    `;

    if (result.length > 0) {
      console.log('Coluna buyerId já existe');
      return;
    }

    console.log('Adicionando coluna buyerId...');
    
    // Adiciona coluna como nullable primeiro
    await prisma.$executeRaw`ALTER TABLE "payments" ADD COLUMN "buyerId" TEXT;`;

    // Atualiza pagamentos existentes
    await prisma.$executeRaw`UPDATE "payments" SET "buyerId" = "producerId" WHERE "buyerId" IS NULL;`;

    // Torna NOT NULL
    await prisma.$executeRaw`ALTER TABLE "payments" ALTER COLUMN "buyerId" SET NOT NULL;`;

    // Adiciona foreign key
    await prisma.$executeRaw`
      ALTER TABLE "payments" 
      ADD CONSTRAINT "payments_buyerId_fkey" 
      FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;

    console.log('Migration aplicada com sucesso!');
  } catch (error) {
    console.error('Erro ao aplicar migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

