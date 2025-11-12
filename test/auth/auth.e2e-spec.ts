import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/shared/infrastructure/prisma/prisma.service';
import { UserRole } from '../../src/shared/domain/enums/user-role.enum';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
    await prisma.client.user.deleteMany();
    await prisma.onModuleDestroy();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.client.user.deleteMany();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          role: UserRole.PRODUCER,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe('test@example.com');
          expect(res.body.name).toBe('Test User');
          expect(res.body.role).toBe(UserRole.PRODUCER);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should not register user with duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'First User',
          role: UserRole.PRODUCER,
        })
        .expect(201);

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Second User',
          role: UserRole.AFFILIATE,
        })
        .expect(409);
    });

    it('should validate email format', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
          role: UserRole.PRODUCER,
        })
        .expect(400);
    });

    it('should validate password minimum length', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: '12345',
          name: 'Test User',
          role: UserRole.PRODUCER,
        })
        .expect(400);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });

    it('should validate role enum', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          role: 'INVALID_ROLE',
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'login@example.com',
          password: 'password123',
          name: 'Login User',
          role: UserRole.AFFILIATE,
        });
    });

    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe('login@example.com');
          expect(res.body.user.name).toBe('Login User');
          expect(res.body.user.role).toBe(UserRole.AFFILIATE);
        });
    });

    it('should not login with invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should not login with invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should validate email format', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
        })
        .expect(400);
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before storing', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'hashed@example.com',
          password: 'password123',
          name: 'Hashed User',
          role: UserRole.COPRODUCER,
        })
        .expect(201);

      const user = await prisma.client.user.findUnique({
        where: { email: 'hashed@example.com' },
      });

      expect(user).toBeDefined();
      expect(user?.password).not.toBe('password123');
      expect(user?.password.length).toBeGreaterThan(20); // bcrypt hash length
    });
  });

  describe('JWT Token', () => {
    it('should return valid JWT token on login', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'jwt@example.com',
          password: 'password123',
          name: 'JWT User',
          role: UserRole.PLATFORM,
        });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'jwt@example.com',
          password: 'password123',
        })
        .expect(200);

      const token = response.body.accessToken;
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });
});

