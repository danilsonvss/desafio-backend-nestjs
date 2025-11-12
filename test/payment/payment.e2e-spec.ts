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
  });
});

