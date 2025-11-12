import { Test, TestingModule } from '@nestjs/testing';
import { PrismaTaxRepository } from './prisma-tax.repository';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { TaxEntity } from '../../domain/entities/tax.entity';
import { TaxType } from '../../../shared/domain/enums/tax-type.enum';

describe('PrismaTaxRepository', () => {
  let repository: PrismaTaxRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaTax = {
    id: 'tax-id',
    country: 'BR',
    type: TaxType.TRANSACTION,
    percentage: 5.5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  beforeEach(async () => {
    const mockPrismaClient = {
      tax: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaTaxRepository,
        {
          provide: PrismaService,
          useValue: {
            client: mockPrismaClient,
          },
        },
      ],
    }).compile();

    repository = module.get<PrismaTaxRepository>(PrismaTaxRepository);
    prismaService = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a new tax', async () => {
      const tax = TaxEntity.create('BR', TaxType.TRANSACTION, 5.5);
      (prismaService.client.tax.create as jest.Mock).mockResolvedValue(mockPrismaTax);

      const result = await repository.create(tax);

      expect(prismaService.client.tax.create).toHaveBeenCalledWith({
        data: {
          id: tax.id,
          country: tax.country,
          type: tax.type,
          percentage: tax.percentage,
        },
      });
      expect(result).toBeInstanceOf(TaxEntity);
      expect(result.country).toBe('BR');
    });
  });

  describe('findByCountryAndType', () => {
    it('should find tax by country and type', async () => {
      (prismaService.client.tax.findUnique as jest.Mock).mockResolvedValue(mockPrismaTax);

      const result = await repository.findByCountryAndType('BR', TaxType.TRANSACTION);

      expect(prismaService.client.tax.findUnique).toHaveBeenCalledWith({
        where: {
          country_type: {
            country: 'BR',
            type: TaxType.TRANSACTION,
          },
        },
      });
      expect(result).toBeInstanceOf(TaxEntity);
      expect(result?.country).toBe('BR');
    });

    it('should return null when tax not found', async () => {
      (prismaService.client.tax.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByCountryAndType('US', TaxType.PLATFORM);

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find tax by id', async () => {
      (prismaService.client.tax.findUnique as jest.Mock).mockResolvedValue(mockPrismaTax);

      const result = await repository.findById('tax-id');

      expect(prismaService.client.tax.findUnique).toHaveBeenCalledWith({
        where: { id: 'tax-id' },
      });
      expect(result).toBeInstanceOf(TaxEntity);
    });

    it('should return null when tax not found', async () => {
      (prismaService.client.tax.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all taxes', async () => {
      (prismaService.client.tax.findMany as jest.Mock).mockResolvedValue([mockPrismaTax]);

      const result = await repository.findAll();

      expect(prismaService.client.tax.findMany).toHaveBeenCalledWith({
        orderBy: [{ country: 'asc' }, { type: 'asc' }],
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(TaxEntity);
    });
  });

  describe('findByCountry', () => {
    it('should find taxes by country', async () => {
      (prismaService.client.tax.findMany as jest.Mock).mockResolvedValue([mockPrismaTax]);

      const result = await repository.findByCountry('BR');

      expect(prismaService.client.tax.findMany).toHaveBeenCalledWith({
        where: { country: 'BR' },
        orderBy: { type: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(TaxEntity);
    });
  });

  describe('update', () => {
    it('should update tax', async () => {
      const tax = TaxEntity.fromPrisma(mockPrismaTax).updatePercentage(7.5);
      (prismaService.client.tax.update as jest.Mock).mockResolvedValue({
        ...mockPrismaTax,
        percentage: 7.5,
      });

      const result = await repository.update(tax);

      expect(prismaService.client.tax.update).toHaveBeenCalledWith({
        where: { id: tax.id },
        data: {
          percentage: tax.percentage,
          updatedAt: tax.updatedAt,
        },
      });
      expect(result).toBeInstanceOf(TaxEntity);
    });
  });

  describe('delete', () => {
    it('should delete tax', async () => {
      (prismaService.client.tax.delete as jest.Mock).mockResolvedValue(mockPrismaTax);

      await repository.delete('tax-id');

      expect(prismaService.client.tax.delete).toHaveBeenCalledWith({
        where: { id: 'tax-id' },
      });
    });
  });

  describe('existsByCountryAndType', () => {
    it('should return true when tax exists', async () => {
      (prismaService.client.tax.count as jest.Mock).mockResolvedValue(1);

      const result = await repository.existsByCountryAndType('BR', TaxType.TRANSACTION);

      expect(result).toBe(true);
    });

    it('should return false when tax does not exist', async () => {
      (prismaService.client.tax.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.existsByCountryAndType('US', TaxType.PLATFORM);

      expect(result).toBe(false);
    });
  });
});

