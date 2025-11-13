import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/shared/infrastructure/prisma/prisma.service';
import { UserRole } from '../../src/shared/domain/enums/user-role.enum';

const getData = (response: any) => response.body.data || response.body;

describe('CoproductionController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let producerId: string;
  let coproducerId: string;

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
    await prisma.client.coproduction.deleteMany();
    await prisma.client.user.deleteMany();
    await prisma.onModuleDestroy();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.client.coproduction.deleteMany();
    await prisma.client.user.deleteMany();
    
    // Aguardar um pouco para garantir que a limpeza foi concluída
    await new Promise((resolve) => setTimeout(resolve, 50));

    const producerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'producer@example.com',
        password: 'password123',
        name: 'Producer User',
        role: UserRole.PRODUCER,
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

    producerId = getData(producerResponse).id;
    coproducerId = getData(coproducerResponse).id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'producer@example.com',
        password: 'password123',
      })
      .expect(200);

    const loginData = getData(loginResponse);
    authToken = loginData.accessToken;
  });

  describe('POST /coproductions', () => {
    it('should create a new coproduction', () => {
      return request(app.getHttpServer())
        .post('/coproductions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          coproducerId,
          percentage: 20.5,
        })
        .expect(201)
        .expect((res) => {
          const data = getData(res);
          expect(data).toHaveProperty('id');
          expect(data.producerId).toBe(producerId);
          expect(data.coproducerId).toBe(coproducerId);
          expect(data.percentage).toBe(20.5);
          expect(data).toHaveProperty('createdAt');
          expect(data).toHaveProperty('updatedAt');
        });
    });

    it('should not create duplicate coproduction', async () => {
      await request(app.getHttpServer())
        .post('/coproductions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          coproducerId,
          percentage: 20.5,
        })
        .expect(201);

      return request(app.getHttpServer())
        .post('/coproductions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          coproducerId,
          percentage: 25.0,
        })
        .expect(409);
    });

    it('should validate percentage range', () => {
      return request(app.getHttpServer())
        .post('/coproductions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          coproducerId,
          percentage: 101,
        })
        .expect(400);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/coproductions')
        .send({
          producerId,
          coproducerId,
          percentage: 20.5,
        })
        .expect(401);
    });
  });

  describe('GET /coproductions/producer/:producerId', () => {
    it('should return coproductions by producer', async () => {
      await request(app.getHttpServer())
        .post('/coproductions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          coproducerId,
          percentage: 20.5,
        })
        .expect(201);

      return request(app.getHttpServer())
        .get(`/coproductions/producer/${producerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          const data = getData(res);
          expect(Array.isArray(data)).toBe(true);
          expect(data.length).toBe(1);
          expect(data[0].producerId).toBe(producerId);
          expect(data[0].coproducerId).toBe(coproducerId);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get(`/coproductions/producer/${producerId}`)
        .expect(401);
    });

    it('should reject coproduction when producer and coproducer are the same (RN-COP-004)', () => {
      return request(app.getHttpServer())
        .post('/coproductions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          coproducerId: producerId, // Mesmo ID
          percentage: 15.0,
        })
        .expect(400);
    });

    it('should allow multiple coproducers for same producer (RN-COP-005)', async () => {
      const secondCoproducerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'coproducer2@example.com',
          password: 'password123',
          name: 'Second Coproducer',
          role: UserRole.COPRODUCER,
        })
        .expect(201);

      const secondCoproducerId = getData(secondCoproducerResponse).id;

      await request(app.getHttpServer())
        .post('/coproductions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          coproducerId,
          percentage: 15.0,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/coproductions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          coproducerId: secondCoproducerId,
          percentage: 20.0,
        })
        .expect(201);

      const listResponse = await request(app.getHttpServer())
        .get(`/coproductions/producer/${producerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const data = getData(listResponse);
      expect(data.length).toBe(2);
      expect(data.some((c: any) => c.coproducerId === coproducerId)).toBe(true);
      expect(data.some((c: any) => c.coproducerId === secondCoproducerId)).toBe(true);
    });
  });
});

