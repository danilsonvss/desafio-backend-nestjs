import { Test, TestingModule } from '@nestjs/testing';
import { PrismaPaymentRepository } from './prisma-payment.repository';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { PaymentEntity } from '../../domain/entities/payment.entity';
import { PaymentStatus } from '../../../shared/domain/enums/payment-status.enum';

describe('PrismaPaymentRepository', () => {
  let repository: PrismaPaymentRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaPayment = {
    id: 'payment-id',
    amount: 1000,
    country: 'BR',
    status: PaymentStatus.APPROVED,
    producerId: 'producer-id',
    affiliateId: 'affiliate-id',
    coproducerId: null,
    transactionTax: 50,
    platformTax: 20,
    producerCommission: 700,
    affiliateCommission: 100,
    coproducerCommission: null,
    platformCommission: 130,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  beforeEach(async () => {
    const mockPrismaClient = {
      payment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaPaymentRepository,
        {
          provide: PrismaService,
          useValue: {
            client: mockPrismaClient,
          },
        },
      ],
    }).compile();

    repository = module.get<PrismaPaymentRepository>(PrismaPaymentRepository);
    prismaService = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a new payment', async () => {
      const payment = PaymentEntity.create(
        1000,
        'BR',
        'producer-id',
        'affiliate-id',
        null,
        50,
        20,
        700,
        100,
        null,
        130,
      );
      (prismaService.client.payment.create as jest.Mock).mockResolvedValue(mockPrismaPayment);

      const result = await repository.create(payment);

      expect(prismaService.client.payment.create).toHaveBeenCalled();
      expect(result).toBeInstanceOf(PaymentEntity);
      expect(result.amount).toBe(1000);
    });
  });

  describe('findById', () => {
    it('should find payment by id', async () => {
      (prismaService.client.payment.findUnique as jest.Mock).mockResolvedValue(mockPrismaPayment);

      const result = await repository.findById('payment-id');

      expect(prismaService.client.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 'payment-id' },
      });
      expect(result).toBeInstanceOf(PaymentEntity);
    });

    it('should return null when payment not found', async () => {
      (prismaService.client.payment.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByProducer', () => {
    it('should find payments by producer', async () => {
      (prismaService.client.payment.findMany as jest.Mock).mockResolvedValue([mockPrismaPayment]);

      const result = await repository.findByProducer('producer-id');

      expect(prismaService.client.payment.findMany).toHaveBeenCalledWith({
        where: { producerId: 'producer-id' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PaymentEntity);
    });
  });

  describe('findByAffiliate', () => {
    it('should find payments by affiliate', async () => {
      (prismaService.client.payment.findMany as jest.Mock).mockResolvedValue([mockPrismaPayment]);

      const result = await repository.findByAffiliate('affiliate-id');

      expect(prismaService.client.payment.findMany).toHaveBeenCalledWith({
        where: { affiliateId: 'affiliate-id' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PaymentEntity);
    });
  });
});

