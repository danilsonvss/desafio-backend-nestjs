import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health check response', () => {
      const result = controller.check();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('environment');
    });

    it('should return status ok', () => {
      const result = controller.check();

      expect(result.status).toBe('ok');
    });

    it('should return valid timestamp', () => {
      const beforeTimestamp = new Date().toISOString();
      const result = controller.check();

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
      expect(new Date(result.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeTimestamp).getTime(),
      );
    });

    it('should return positive uptime', () => {
      const result = controller.check();

      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(typeof result.uptime).toBe('number');
    });

    it('should return environment', () => {
      const result = controller.check();

      expect(result.environment).toBeDefined();
      expect(typeof result.environment).toBe('string');
    });

    it('should return development as default environment', () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      const result = controller.check();

      expect(result.environment).toBe('development');

      if (originalEnv) {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should return correct environment when NODE_ENV is set', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const result = controller.check();

      expect(result.environment).toBe('production');

      if (originalEnv) {
        process.env.NODE_ENV = originalEnv;
      } else {
        delete process.env.NODE_ENV;
      }
    });
  });
});

