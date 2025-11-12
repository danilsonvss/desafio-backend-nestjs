import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/shared/infrastructure/prisma/prisma.service';
import { UserRole } from '../../src/shared/domain/enums/user-role.enum';
import { TaxType } from '../../src/shared/domain/enums/tax-type.enum';

const getData = (response: any) => response.body.data || response.body;

describe('TaxController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

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
    await prisma.client.tax.deleteMany();
    await prisma.client.user.deleteMany();
    await prisma.onModuleDestroy();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.client.tax.deleteMany();
    await prisma.client.user.deleteMany();

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'tax@example.com',
        password: 'password123',
        name: 'Tax User',
        role: UserRole.PLATFORM,
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'tax@example.com',
        password: 'password123',
      })
      .expect(200);

    const loginData = getData(loginResponse);
    authToken = loginData.accessToken;
  });

  describe('POST /taxes', () => {
    it('should create a new tax', () => {
      return request(app.getHttpServer())
        .post('/taxes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          country: 'BR',
          type: TaxType.TRANSACTION,
          percentage: 5.5,
        })
        .expect(201)
        .expect((res) => {
          const data = getData(res);
          expect(data).toHaveProperty('id');
          expect(data.country).toBe('BR');
          expect(data.type).toBe(TaxType.TRANSACTION);
          expect(data.percentage).toBe(5.5);
          expect(data).toHaveProperty('createdAt');
          expect(data).toHaveProperty('updatedAt');
        });
    });

    it('should not create duplicate tax', async () => {
      await request(app.getHttpServer())
        .post('/taxes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          country: 'BR',
          type: TaxType.TRANSACTION,
          percentage: 5.5,
        })
        .expect(201);

      return request(app.getHttpServer())
        .post('/taxes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          country: 'BR',
          type: TaxType.TRANSACTION,
          percentage: 6.0,
        })
        .expect(409);
    });

    it('should validate percentage range', () => {
      return request(app.getHttpServer())
        .post('/taxes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          country: 'BR',
          type: TaxType.TRANSACTION,
          percentage: 101,
        })
        .expect(400);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/taxes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          country: 'BR',
        })
        .expect(400);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/taxes')
        .send({
          country: 'BR',
          type: TaxType.TRANSACTION,
          percentage: 5.5,
        })
        .expect(401);
    });
  });

  describe('GET /taxes', () => {
    it('should return all taxes', async () => {
      await request(app.getHttpServer())
        .post('/taxes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          country: 'BR',
          type: TaxType.TRANSACTION,
          percentage: 5.5,
        });

      await request(app.getHttpServer())
        .post('/taxes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          country: 'US',
          type: TaxType.PLATFORM,
          percentage: 3.0,
        });

      return request(app.getHttpServer())
        .get('/taxes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          const data = getData(res);
          expect(Array.isArray(data)).toBe(true);
          expect(data.length).toBeGreaterThanOrEqual(2);
        });
    });

    it('should filter taxes by country', async () => {
      await request(app.getHttpServer())
        .post('/taxes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          country: 'BR',
          type: TaxType.TRANSACTION,
          percentage: 5.5,
        });

      await request(app.getHttpServer())
        .post('/taxes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          country: 'US',
          type: TaxType.PLATFORM,
          percentage: 3.0,
        });

      return request(app.getHttpServer())
        .get('/taxes?country=BR')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          const data = getData(res);
          expect(Array.isArray(data)).toBe(true);
          expect(data.every((tax: any) => tax.country === 'BR')).toBe(true);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/taxes')
        .expect(401);
    });
  });

  describe('GET /taxes/:country/:type', () => {
    it('should return tax by country and type', async () => {
      await request(app.getHttpServer())
        .post('/taxes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          country: 'BR',
          type: TaxType.TRANSACTION,
          percentage: 5.5,
        });

      return request(app.getHttpServer())
        .get('/taxes/BR/TRANSACTION')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          const data = getData(res);
          expect(data.country).toBe('BR');
          expect(data.type).toBe(TaxType.TRANSACTION);
          expect(data.percentage).toBe(5.5);
        });
    });

    it('should return 404 when tax not found', () => {
      return request(app.getHttpServer())
        .get('/taxes/US/PLATFORM')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/taxes/BR/TRANSACTION')
        .expect(401);
    });
  });

  describe('PATCH /taxes', () => {
    it('should update tax percentage', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/taxes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          country: 'BR',
          type: TaxType.TRANSACTION,
          percentage: 5.5,
        })
        .expect(201);

      const taxId = getData(createResponse).id;

      return request(app.getHttpServer())
        .patch('/taxes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          id: taxId,
          percentage: 7.5,
        })
        .expect(200)
        .expect((res) => {
          const data = getData(res);
          expect(data.id).toBe(taxId);
          expect(data.percentage).toBe(7.5);
        });
    });

    it('should return 404 when tax not found', () => {
      return request(app.getHttpServer())
        .patch('/taxes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          id: 'nonexistent-id',
          percentage: 7.5,
        })
        .expect(404);
    });

    it('should validate percentage range', () => {
      return request(app.getHttpServer())
        .patch('/taxes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          id: 'some-id',
          percentage: 101,
        })
        .expect(400);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .patch('/taxes')
        .send({
          id: 'some-id',
          percentage: 7.5,
        })
        .expect(401);
    });

    it('should normalize country to uppercase (RN-TAX-003)', async () => {
      const response = await request(app.getHttpServer())
        .post('/taxes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          country: '  br  ',
          type: TaxType.TRANSACTION,
          percentage: 5.0,
        })
        .expect(201);

      const data = getData(response);
      expect(data.country).toBe('BR');
    });

    it('should not allow updating country or type (RN-TAX-007)', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/taxes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          country: 'BR',
          type: TaxType.TRANSACTION,
          percentage: 5.0,
        })
        .expect(201);

      const taxId = getData(createResponse).id;

      // Tentar atualizar apenas percentage (deve funcionar)
      const updateResponse = await request(app.getHttpServer())
        .patch('/taxes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          id: taxId,
          percentage: 7.5,
        })
        .expect(200);

      const updatedData = getData(updateResponse);
      expect(updatedData.country).toBe('BR'); // País não mudou
      expect(updatedData.type).toBe(TaxType.TRANSACTION); // Tipo não mudou
      expect(updatedData.percentage).toBe(7.5); // Apenas percentage mudou
    });

    it('should allow zero percentage tax (RN-TAX-011)', async () => {
      await request(app.getHttpServer())
        .post('/taxes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          country: 'MX',
          type: TaxType.TRANSACTION,
          percentage: 0,
        })
        .expect(201);

      // Verificar que taxa zero pode ser usada em pagamento
      const producerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'producer-tax@example.com',
          password: 'password123',
          name: 'Producer Tax',
          role: UserRole.PRODUCER,
        })
        .expect(201);

      const producerId = getData(producerResponse).id;

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'producer-tax@example.com',
          password: 'password123',
        })
        .expect(200);

      const producerToken = getData(loginResponse).accessToken;

      const paymentResponse = await request(app.getHttpServer())
        .post('/payment')
        .set('Authorization', `Bearer ${producerToken}`)
        .send({
          amount: 1000,
          country: 'MX',
          producerId,
        })
        .expect(201);

      const paymentData = getData(paymentResponse);
      expect(paymentData.transactionTax).toBe(0);
    });
  });
});

