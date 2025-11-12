import { Test, TestingModule } from '@nestjs/testing';
import { SharedModule } from './shared.module';
import { PrismaService } from './infrastructure/prisma/prisma.service';

jest.mock('./infrastructure/prisma/prisma.service');

describe('SharedModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [SharedModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide PrismaService', () => {
    const prismaService = module.get<PrismaService>(PrismaService);
    expect(prismaService).toBeDefined();
  });

  it('should export PrismaService', () => {
    const exports = Reflect.getMetadata('exports', SharedModule);
    expect(exports).toContain(PrismaService);
  });

  it('should be global module', () => {
    const metadata = Reflect.getMetadata('__module:global__', SharedModule);
    expect(metadata).toBe(true);
  });
});

