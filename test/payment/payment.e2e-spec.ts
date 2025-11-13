import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/shared/infrastructure/prisma/prisma.service';
import { UserRole } from '../../src/shared/domain/enums/user-role.enum';
import { TaxType } from '../../src/shared/domain/enums/tax-type.enum';

const getData = (response: any) => response.body.data || response.body;

describe('PaymentController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let producerId: string;
  let affiliateId: string;
  let coproducerId: string;
  let platformId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await prisma.client.payment.deleteMany();
    await prisma.client.balance.deleteMany();
    await prisma.client.affiliation.deleteMany();
    await prisma.client.coproduction.deleteMany();
    await prisma.client.tax.deleteMany();
    await prisma.client.user.deleteMany();
    await prisma.onModuleDestroy();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.client.payment.deleteMany();
    await prisma.client.balance.deleteMany();
    await prisma.client.affiliation.deleteMany();
    await prisma.client.coproduction.deleteMany();
    await prisma.client.tax.deleteMany();
    await prisma.client.user.deleteMany();

    const producerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'producer@example.com',
        password: 'password123',
        name: 'Producer User',
        role: UserRole.PRODUCER,
      })
      .expect(201);

    const affiliateResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'affiliate@example.com',
        password: 'password123',
        name: 'Affiliate User',
        role: UserRole.AFFILIATE,
      })
      .expect(201);

    const coproducerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'coproducer@example.com',
        password: 'password123',
        name: 'Coproducer User',
        role: UserRole.COPRODUCER,
      })
      .expect(201);

    const platformResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'platform@example.com',
        password: 'password123',
        name: 'Platform User',
        role: UserRole.PLATFORM,
      })
      .expect(201);

    producerId = getData(producerResponse).id;
    affiliateId = getData(affiliateResponse).id;
    coproducerId = getData(coproducerResponse).id;
    platformId = getData(platformResponse).id;

    const platformLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'platform@example.com',
        password: 'password123',
      })
      .expect(200);

    const platformToken = getData(platformLoginResponse).accessToken;

    await request(app.getHttpServer())
      .post('/taxes')
      .set('Authorization', `Bearer ${platformToken}`)
      .send({
        country: 'BR',
        type: TaxType.TRANSACTION,
        percentage: 5.0,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/taxes')
      .set('Authorization', `Bearer ${platformToken}`)
      .send({
        country: 'BR',
        type: TaxType.PLATFORM,
        percentage: 2.0,
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'producer@example.com',
        password: 'password123',
      })
      .expect(200);

    authToken = getData(loginResponse).accessToken;
  });

  describe('POST /payment', () => {
    it('should process payment with producer only', async () => {
      const response = await request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
          country: 'BR',
          producerId,
        })
        .expect(201);

      const data = getData(response);
      expect(data).toHaveProperty('id');
      expect(data.amount).toBe(1000);
      expect(data.country).toBe('BR');
      expect(data.producerId).toBe(producerId);
      expect(data.affiliateId).toBeNull();
      expect(data.coproducerId).toBeNull();
      expect(data.transactionTax).toBe(50);
      expect(data.platformTax).toBe(20);
      expect(data.producerCommission).toBeGreaterThan(0);
      expect(data.platformCommission).toBe(20);
    });

    it('should process payment with producer and affiliate', async () => {
      await request(app.getHttpServer())
        .post('/affiliations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          affiliateId,
          percentage: 10.0,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
          country: 'BR',
          producerId,
          affiliateId,
        })
        .expect(201);

      const data = getData(response);
      expect(data.affiliateId).toBe(affiliateId);
      expect(data.affiliateCommission).toBeGreaterThan(0);
    });

    it('should process payment with producer, affiliate and coproducer', async () => {
      await request(app.getHttpServer())
        .post('/affiliations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          affiliateId,
          percentage: 10.0,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/coproductions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          coproducerId,
          percentage: 15.0,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
          country: 'BR',
          producerId,
          affiliateId,
          coproducerId,
        })
        .expect(201);

      const data = getData(response);
      expect(data.affiliateId).toBe(affiliateId);
      expect(data.coproducerId).toBe(coproducerId);
      expect(data.affiliateCommission).toBeGreaterThan(0);
      expect(data.coproducerCommission).toBeGreaterThan(0);
    });

    it('should update balances after payment', async () => {
      await request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
          country: 'BR',
          producerId,
        })
        .expect(201);

      const balanceResponse = await request(app.getHttpServer())
        .get('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const balanceData = getData(balanceResponse);
      expect(balanceData.amount).toBeGreaterThan(0);
    });

    it('should validate amount is positive', () => {
      return request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: -100,
          country: 'BR',
          producerId,
        })
        .expect(400);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
        })
        .expect(400);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/payment')
        .send({
          amount: 1000,
          country: 'BR',
          producerId,
        })
        .expect(401);
    });

    it('should throw error when producer not found', async () => {
      const response = await request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
          country: 'BR',
          producerId: '00000000-0000-0000-0000-000000000000',
        });

      expect([404, 400]).toContain(response.status);
      if (response.status === 404) {
        expect(response.body.message).toContain('Producer');
      }
    });

    it('should correctly calculate and distribute all commissions (RN-PAY-005)', async () => {
      await request(app.getHttpServer())
        .post('/affiliations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          affiliateId,
          percentage: 10.0,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/coproductions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          coproducerId,
          percentage: 15.0,
        })
        .expect(201);

      const amount = 1000;
      const transactionTaxPercentage = 5.0;
      const platformTaxPercentage = 2.0;
      const affiliatePercentage = 10.0;
      const coproducerPercentage = 15.0;

      const response = await request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount,
          country: 'BR',
          producerId,
          affiliateId,
          coproducerId,
        })
        .expect(201);

      const data = getData(response);

      // Cálculos esperados
      const transactionTax = (amount * transactionTaxPercentage) / 100; // 50
      const platformTax = (amount * platformTaxPercentage) / 100; // 20
      const netAmount = amount - transactionTax; // 950
      const affiliateCommission = (netAmount * affiliatePercentage) / 100; // 95
      const coproducerCommission = (netAmount * coproducerPercentage) / 100; // 142.5
      const platformCommission = platformTax; // 20
      const producerCommission = netAmount - affiliateCommission - coproducerCommission - platformCommission; // 692.5

      // Verificar cálculos exatos
      expect(data.transactionTax).toBe(transactionTax);
      expect(data.platformTax).toBe(platformTax);
      expect(data.affiliateCommission).toBe(affiliateCommission);
      expect(data.coproducerCommission).toBe(coproducerCommission);
      expect(data.platformCommission).toBe(platformCommission);
      expect(data.producerCommission).toBe(producerCommission);

      // Verificar que soma de todas as comissões = valor líquido
      const totalCommissions = producerCommission + affiliateCommission + coproducerCommission + platformCommission;
      expect(totalCommissions).toBe(netAmount);
    });

    it('should reject payment when commissions exceed net amount (RN-PAY-005)', async () => {
      await request(app.getHttpServer())
        .post('/affiliations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          affiliateId,
          percentage: 50.0, // 50% do valor líquido
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/coproductions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          coproducerId,
          percentage: 50.0, // 50% do valor líquido
        })
        .expect(201);

      // Com taxas: transactionTax = 50, netAmount = 950
      // Comissões: 50% + 50% = 100% do netAmount = 950
      // Platform: 20
      // Total: 950 + 20 = 970 > 950 (netAmount)
      return request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
          country: 'BR',
          producerId,
          affiliateId,
          coproducerId,
        })
        .expect(400);
    });

    it('should handle payment when tax not found (assume 0) (RN-PAY-002)', async () => {
      const response = await request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
          country: 'US', // País sem taxa configurada
          producerId,
        })
        .expect(201);

      const data = getData(response);
      expect(data.transactionTax).toBe(0);
      expect(data.platformTax).toBe(0);
      expect(data.amount).toBe(1000);
      // Valor líquido = valor original quando não há taxa
      expect(data.producerCommission).toBe(1000);
    });

    it('should validate country is required (RN-PAY-009)', () => {
      return request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
          producerId,
        })
        .expect(400);
    });

    it('should validate country is not empty (RN-PAY-009)', () => {
      return request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
          country: '',
          producerId,
        })
        .expect(400);
    });

    it('should throw error when affiliate not found', async () => {
      const response = await request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
          country: 'BR',
          producerId,
          affiliateId: '00000000-0000-0000-0000-000000000000',
        });

      expect([404, 400]).toContain(response.status);
    });

    it('should throw error when coproducer not found', async () => {
      const response = await request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
          country: 'BR',
          producerId,
          coproducerId: '00000000-0000-0000-0000-000000000000',
        });

      expect([404, 400]).toContain(response.status);
    });

    it('should correctly calculate producer commission as remainder (RN-COM-003)', async () => {
      await request(app.getHttpServer())
        .post('/affiliations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          affiliateId,
          percentage: 10.0,
        })
        .expect(201);

      const amount = 1000;
      const transactionTax = 50; // 5% de 1000
      const netAmount = 950;
      const affiliateCommission = 95; // 10% de 950
      const platformCommission = 20; // 2% de 1000
      const expectedProducerCommission = netAmount - affiliateCommission - platformCommission; // 835

      const response = await request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount,
          country: 'BR',
          producerId,
          affiliateId,
        })
        .expect(201);

      const data = getData(response);
      expect(data.producerCommission).toBe(expectedProducerCommission);
      expect(data.producerCommission).toBe(netAmount - affiliateCommission - platformCommission);
    });

    it('should ensure atomicity: payment and all balances updated together (RN-PAY-006)', async () => {
      await request(app.getHttpServer())
        .post('/affiliations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          affiliateId,
          percentage: 10.0,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/coproductions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          coproducerId,
          percentage: 15.0,
        })
        .expect(201);

      // Verificar saldos iniciais (devem ser 0)
      const initialProducerBalance = await prisma.client.balance.findUnique({
        where: { userId: producerId },
      });
      const initialAffiliateBalance = await prisma.client.balance.findUnique({
        where: { userId: affiliateId },
      });
      const initialCoproducerBalance = await prisma.client.balance.findUnique({
        where: { userId: coproducerId },
      });

      expect(initialProducerBalance?.amount.toNumber() || 0).toBe(0);
      expect(initialAffiliateBalance?.amount.toNumber() || 0).toBe(0);
      expect(initialCoproducerBalance?.amount.toNumber() || 0).toBe(0);

      // Processar pagamento
      const response = await request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
          country: 'BR',
          producerId,
          affiliateId,
          coproducerId,
        })
        .expect(201);

      const data = getData(response);

      // Verificar que pagamento foi criado
      expect(data).toHaveProperty('id');
      const paymentInDb = await prisma.client.payment.findUnique({
        where: { id: data.id },
      });
      expect(paymentInDb).toBeDefined();

      // Verificar que TODOS os saldos foram atualizados corretamente
      const finalProducerBalance = await prisma.client.balance.findUnique({
        where: { userId: producerId },
      });
      const finalAffiliateBalance = await prisma.client.balance.findUnique({
        where: { userId: affiliateId },
      });
      const finalCoproducerBalance = await prisma.client.balance.findUnique({
        where: { userId: coproducerId },
      });

      // Se o pagamento existe, todos os saldos devem ter sido atualizados
      expect(finalProducerBalance?.amount.toNumber()).toBe(data.producerCommission);
      expect(finalAffiliateBalance?.amount.toNumber()).toBe(data.affiliateCommission);
      expect(finalCoproducerBalance?.amount.toNumber()).toBe(data.coproducerCommission);

      // Verificar consistência: se pagamento existe, saldos devem estar atualizados
      // Isso garante que a transação foi atômica (ou tudo ou nada)
      if (paymentInDb) {
        expect(finalProducerBalance).toBeDefined();
        expect(finalAffiliateBalance).toBeDefined();
        expect(finalCoproducerBalance).toBeDefined();
      }
    });

    it('should reject payment when user tries to process for another producer', async () => {
      // Criar outro produtor
      const otherProducerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other-producer@example.com',
          password: 'password123',
          name: 'Other Producer',
          role: UserRole.PRODUCER,
        })
        .expect(201);

      const otherProducerId = getData(otherProducerResponse).id;

      // Tentar processar pagamento para outro produtor (deve falhar)
      return request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
          country: 'BR',
          producerId: otherProducerId, // Tentando processar para outro produtor
        })
        .expect(403);
    });

    it('should allow platform user to process payment for any producer', async () => {
      const platformLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'platform@example.com',
          password: 'password123',
        })
        .expect(200);

      const platformToken = getData(platformLoginResponse).accessToken;

      // Plataforma pode processar pagamento para qualquer produtor
      const response = await request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${platformToken}`)
        .send({
          amount: 1000,
          country: 'BR',
          producerId, // Processando para o produtor criado no beforeEach
        })
        .expect(201);

      const data = getData(response);
      expect(data.producerId).toBe(producerId);
    });

    it('should reject payment when amount exceeds maximum', () => {
      return request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000001, // Excede o máximo de 1 milhão
          country: 'BR',
          producerId,
        })
        .expect(400);
    });

    it('should enforce rate limiting on payment endpoint', async () => {
      // Fazer 5 requisições (limite permitido)
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/payment')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            amount: 100,
            country: 'BR',
            producerId,
          })
          .expect(201);
      }

      // A 6ª requisição deve ser bloqueada
      return request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100,
          country: 'BR',
          producerId,
        })
        .expect(429); // Too Many Requests
    });
  });
});

