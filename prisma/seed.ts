import { PrismaClient, UserRole, TaxType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  const saltRounds = 10;
  const defaultPassword = 'password123';
  const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

  console.log('👤 Creating users...');

  const producer = await prisma.user.upsert({
    where: { email: 'produtor@example.com' },
    update: {},
    create: {
      email: 'produtor@example.com',
      password: hashedPassword,
      name: 'Produtor Teste',
      role: UserRole.PRODUCER,
    },
  });

  const affiliate = await prisma.user.upsert({
    where: { email: 'afiliado@example.com' },
    update: {},
    create: {
      email: 'afiliado@example.com',
      password: hashedPassword,
      name: 'Afiliado Teste',
      role: UserRole.AFFILIATE,
    },
  });

  const coproducer = await prisma.user.upsert({
    where: { email: 'coprodutor@example.com' },
    update: {},
    create: {
      email: 'coprodutor@example.com',
      password: hashedPassword,
      name: 'Coprodutor Teste',
      role: UserRole.COPRODUCER,
    },
  });

  const platform = await prisma.user.upsert({
    where: { email: 'plataforma@example.com' },
    update: {},
    create: {
      email: 'plataforma@example.com',
      password: hashedPassword,
      name: 'Plataforma',
      role: UserRole.PLATFORM,
    },
  });

  console.log('✅ Users created:');
  console.log(`   - Produtor: ${producer.id} (${producer.email})`);
  console.log(`   - Afiliado: ${affiliate.id} (${affiliate.email})`);
  console.log(`   - Coprodutor: ${coproducer.id} (${coproducer.email})`);
  console.log(`   - Plataforma: ${platform.id} (${platform.email})`);

  console.log('🤝 Creating affiliations...');

  const affiliation = await prisma.affiliation.upsert({
    where: {
      producerId_affiliateId: {
        producerId: producer.id,
        affiliateId: affiliate.id,
      },
    },
    update: {},
    create: {
      producerId: producer.id,
      affiliateId: affiliate.id,
      percentage: 10.0,
    },
  });

  console.log(`✅ Affiliation created: ${affiliation.id} (${affiliation.percentage}%)`);

  console.log('🤝 Creating coproductions...');

  const coproduction = await prisma.coproduction.upsert({
    where: {
      producerId_coproducerId: {
        producerId: producer.id,
        coproducerId: coproducer.id,
      },
    },
    update: {},
    create: {
      producerId: producer.id,
      coproducerId: coproducer.id,
      percentage: 15.0,
    },
  });

  console.log(`✅ Coproduction created: ${coproduction.id} (${coproduction.percentage}%)`);

  console.log('💳 Creating taxes...');

  const taxBRTransaction = await prisma.tax.upsert({
    where: {
      country_type: {
        country: 'BR',
        type: TaxType.TRANSACTION,
      },
    },
    update: {},
    create: {
      country: 'BR',
      type: TaxType.TRANSACTION,
      percentage: 5.0,
    },
  });

  const taxBRPlatform = await prisma.tax.upsert({
    where: {
      country_type: {
        country: 'BR',
        type: TaxType.PLATFORM,
      },
    },
    update: {},
    create: {
      country: 'BR',
      type: TaxType.PLATFORM,
      percentage: 2.0,
    },
  });

  const taxUSTransaction = await prisma.tax.upsert({
    where: {
      country_type: {
        country: 'US',
        type: TaxType.TRANSACTION,
      },
    },
    update: {},
    create: {
      country: 'US',
      type: TaxType.TRANSACTION,
      percentage: 3.0,
    },
  });

  const taxUSPlatform = await prisma.tax.upsert({
    where: {
      country_type: {
        country: 'US',
        type: TaxType.PLATFORM,
      },
    },
    update: {},
    create: {
      country: 'US',
      type: TaxType.PLATFORM,
      percentage: 2.0,
    },
  });

  console.log('✅ Taxes created:');
  console.log(`   - BR TRANSACTION: ${taxBRTransaction.percentage}%`);
  console.log(`   - BR PLATFORM: ${taxBRPlatform.percentage}%`);
  console.log(`   - US TRANSACTION: ${taxUSTransaction.percentage}%`);
  console.log(`   - US PLATFORM: ${taxUSPlatform.percentage}%`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Test credentials (password for all: password123):');
  console.log(`   - Produtor: produtor@example.com`);
  console.log(`   - Afiliado: afiliado@example.com`);
  console.log(`   - Coprodutor: coprodutor@example.com`);
  console.log(`   - Plataforma: plataforma@example.com`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

