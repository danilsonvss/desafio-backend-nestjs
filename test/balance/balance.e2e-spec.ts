import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/shared/infrastructure/prisma/prisma.service';
import { UserRole } from '../../src/shared/domain/enums/user-role.enum';

const getData = (response: any) => response.body.data || response.body;

describe('BalanceController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

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
    await prisma.client.balance.deleteMany();
    await prisma.client.user.deleteMany();
    await prisma.onModuleDestroy();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.client.balance.deleteMany();
    await prisma.client.user.deleteMany();

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'balance@example.com',
        password: 'password123',
        name: 'Balance User',
        role: UserRole.PRODUCER,
      });

    if (registerResponse.status !== 201) {
      throw new Error(`Failed to register user: ${JSON.stringify(registerResponse.body)}`);
    }

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'balance@example.com',
        password: 'password123',
      });

    if (loginResponse.status !== 200) {
      throw new Error(`Failed to login: ${JSON.stringify(loginResponse.body)}`);
    }

    const loginData = getData(loginResponse);
    
    if (!loginData || !loginData.accessToken) {
      throw new Error(`Invalid login response: ${JSON.stringify(loginData)}`);
    }

    authToken = loginData.accessToken;
    userId = loginData.user.id;

    if (!authToken || !userId) {
      throw new Error(`Token or userId not set. Token: ${authToken}, UserId: ${userId}`);
    }
  });

  describe('/balance (GET)', () => {
    it('should return 404 when balance does not exist', () => {
      return request(app.getHttpServer())
        .get('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return balance after credit operation', async () => {
      await request(app.getHttpServer())
        .patch('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100.50,
          operation: 'credit',
        })
        .expect(200);

      return request(app.getHttpServer())
        .get('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          const data = getData(res);
          expect(data).toHaveProperty('id');
          expect(data.userId).toBe(userId);
          expect(data.amount).toBe(100.50);
          expect(data).toHaveProperty('createdAt');
          expect(data).toHaveProperty('updatedAt');
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/balance')
        .expect(401);
    });
  });

  describe('/balance (PATCH)', () => {
    it('should create balance and credit amount', () => {
      return request(app.getHttpServer())
        .patch('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 250.00,
          operation: 'credit',
        })
        .expect(200)
        .expect((res) => {
          const data = getData(res);
          expect(data.userId).toBe(userId);
          expect(data.amount).toBe(250);
        });
    });

    it('should debit amount from existing balance', async () => {
      await request(app.getHttpServer())
        .patch('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 200,
          operation: 'credit',
        });

      return request(app.getHttpServer())
        .patch('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 50,
          operation: 'debit',
        })
        .expect(200)
        .expect((res) => {
          const data = getData(res);
          expect(data.amount).toBe(150);
        });
    });

    it('should fail to debit with insufficient balance', async () => {
      await request(app.getHttpServer())
        .patch('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 50,
          operation: 'credit',
        });

      return request(app.getHttpServer())
        .patch('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100,
          operation: 'debit',
        })
        .expect(400);
    });

    it('should validate amount is positive', () => {
      return request(app.getHttpServer())
        .patch('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: -10,
          operation: 'credit',
        })
        .expect(400);
    });

    it('should validate operation is credit or debit', () => {
      return request(app.getHttpServer())
        .patch('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 10,
          operation: 'invalid',
        })
        .expect(400);
    });

    it('should require amount field', () => {
      return request(app.getHttpServer())
        .patch('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operation: 'credit',
        })
        .expect(400);
    });

    it('should require operation field', () => {
      return request(app.getHttpServer())
        .patch('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100,
        })
        .expect(400);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .patch('/balance')
        .send({
          amount: 100,
          operation: 'credit',
        })
        .expect(401);
    });

    it('should handle decimal amounts correctly', () => {
      return request(app.getHttpServer())
        .patch('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 99.99,
          operation: 'credit',
        })
        .expect(200)
        .expect((res) => {
          const data = getData(res);
          expect(data.amount).toBe(99.99);
        });
    });
  });

  describe('Balance Operations Flow', () => {
    it('should handle multiple credit operations', async () => {
      await request(app.getHttpServer())
        .patch('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 100, operation: 'credit' });

      await request(app.getHttpServer())
        .patch('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 50, operation: 'credit' });

      return request(app.getHttpServer())
        .get('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          const data = getData(res);
          expect(data.amount).toBe(150);
        });
    });

    it('should handle mixed credit and debit operations', async () => {
      await request(app.getHttpServer())
        .patch('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 200, operation: 'credit' });

      await request(app.getHttpServer())
        .patch('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 75, operation: 'debit' });

      await request(app.getHttpServer())
        .patch('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 25, operation: 'credit' });

      return request(app.getHttpServer())
        .get('/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          const data = getData(res);
          expect(data.amount).toBe(150);
        });
    });
  });
});
