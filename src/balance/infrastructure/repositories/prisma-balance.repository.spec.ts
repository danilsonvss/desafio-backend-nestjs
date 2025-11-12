import { Test, TestingModule } from '@nestjs/testing';
import { PrismaBalanceRepository } from './prisma-balance.repository';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { BalanceEntity } from '../../domain/entities/balance.entity';

describe('PrismaBalanceRepository', () => {
  let repository: PrismaBalanceRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaBalance = {
    id: 'balance-id',
    userId: 'user-id',
    amount: 100.50,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  beforeEach(async () => {
    const mockPrismaClient = {
      balance: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaBalanceRepository,
        {
          provide: PrismaService,
          useValue: {
            client: mockPrismaClient,
          },
        },
      ],
    }).compile();

    repository = module.get<PrismaBalanceRepository>(PrismaBalanceRepository);
    prismaService = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a new balance', async () => {
      const balance = BalanceEntity.create('user-id');
      (prismaService.client.balance.create as jest.Mock).mockResolvedValue(mockPrismaBalance);

      const result = await repository.create(balance);

      expect(prismaService.client.balance.create).toHaveBeenCalledWith({
        data: {
          id: balance.id,
          userId: balance.userId,
          amount: balance.amount,
        },
      });
      expect(result).toBeInstanceOf(BalanceEntity);
      expect(result.userId).toBe('user-id');
    });
  });

  describe('findByUserId', () => {
    it('should find balance by user id', async () => {
      (prismaService.client.balance.findUnique as jest.Mock).mockResolvedValue(mockPrismaBalance);

      const result = await repository.findByUserId('user-id');

      expect(prismaService.client.balance.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
      });
      expect(result).toBeInstanceOf(BalanceEntity);
      expect(result?.userId).toBe('user-id');
    });

    it('should return null when balance not found', async () => {
      (prismaService.client.balance.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByUserId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find balance by id', async () => {
      (prismaService.client.balance.findUnique as jest.Mock).mockResolvedValue(mockPrismaBalance);

      const result = await repository.findById('balance-id');

      expect(prismaService.client.balance.findUnique).toHaveBeenCalledWith({
        where: { id: 'balance-id' },
      });
      expect(result).toBeInstanceOf(BalanceEntity);
    });

    it('should return null when balance not found', async () => {
      (prismaService.client.balance.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update balance', async () => {
      const balance = BalanceEntity.fromPrisma(mockPrismaBalance).credit(50);
      (prismaService.client.balance.update as jest.Mock).mockResolvedValue({
        ...mockPrismaBalance,
        amount: 150.50,
      });

      const result = await repository.update(balance);

      expect(prismaService.client.balance.update).toHaveBeenCalledWith({
        where: { id: balance.id },
        data: {
          amount: balance.amount,
          updatedAt: balance.updatedAt,
        },
      });
      expect(result).toBeInstanceOf(BalanceEntity);
    });
  });

  describe('existsByUserId', () => {
    it('should return true when balance exists', async () => {
      (prismaService.client.balance.count as jest.Mock).mockResolvedValue(1);

      const result = await repository.existsByUserId('user-id');

      expect(result).toBe(true);
    });

    it('should return false when balance does not exist', async () => {
      (prismaService.client.balance.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.existsByUserId('user-id');

      expect(result).toBe(false);
    });
  });
});

