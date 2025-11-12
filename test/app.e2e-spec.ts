import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

const getData = (response: any) => response.body.data || response.body;

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        const data = getData(res);
        expect(data).toHaveProperty('status', 'ok');
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('uptime');
        expect(data).toHaveProperty('environment');
      });
  });
});
