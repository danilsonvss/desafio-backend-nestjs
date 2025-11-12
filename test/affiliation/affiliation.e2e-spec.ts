import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/shared/infrastructure/prisma/prisma.service';
import { UserRole } from '../../src/shared/domain/enums/user-role.enum';

const getData = (response: any) => response.body.data || response.body;

describe('AffiliationController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let producerId: string;
  let affiliateId: string;

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
    await prisma.client.affiliation.deleteMany();
    await prisma.client.user.deleteMany();
    await prisma.onModuleDestroy();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.client.affiliation.deleteMany();
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

    producerId = getData(producerResponse).id;
    affiliateId = getData(affiliateResponse).id;

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

  describe('POST /affiliations', () => {
    it('should create a new affiliation', () => {
      return request(app.getHttpServer())
        .post('/affiliations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          affiliateId,
          percentage: 10.5,
        })
        .expect(201)
        .expect((res) => {
          const data = getData(res);
          expect(data).toHaveProperty('id');
          expect(data.producerId).toBe(producerId);
          expect(data.affiliateId).toBe(affiliateId);
          expect(data.percentage).toBe(10.5);
          expect(data).toHaveProperty('createdAt');
          expect(data).toHaveProperty('updatedAt');
        });
    });

    it('should not create duplicate affiliation', async () => {
      await request(app.getHttpServer())
        .post('/affiliations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          affiliateId,
          percentage: 10.5,
        })
        .expect(201);

      return request(app.getHttpServer())
        .post('/affiliations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          affiliateId,
          percentage: 15.0,
        })
        .expect(409);
    });

    it('should validate percentage range', () => {
      return request(app.getHttpServer())
        .post('/affiliations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          affiliateId,
          percentage: 101,
        })
        .expect(400);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/affiliations')
        .send({
          producerId,
          affiliateId,
          percentage: 10.5,
        })
        .expect(401);
    });
  });

  describe('GET /affiliations/producer/:producerId', () => {
    it('should return affiliations by producer', async () => {
      await request(app.getHttpServer())
        .post('/affiliations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producerId,
          affiliateId,
          percentage: 10.5,
        })
        .expect(201);

      return request(app.getHttpServer())
        .get(`/affiliations/producer/${producerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          const data = getData(res);
          expect(Array.isArray(data)).toBe(true);
          expect(data.length).toBe(1);
          expect(data[0].producerId).toBe(producerId);
          expect(data[0].affiliateId).toBe(affiliateId);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get(`/affiliations/producer/${producerId}`)
        .expect(401);
    });
  });
});

