import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import { ProcessPaymentUseCase } from './process-payment.use-case';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { PaymentEntity } from '../../domain/entities/payment.entity';
import { TaxEntity } from '../../../tax/domain/entities/tax.entity';
import { AffiliationEntity } from '../../../affiliation/domain/entities/affiliation.entity';
import { CoproductionEntity } from '../../../affiliation/domain/entities/coproduction.entity';
import { UserEntity } from '../../../auth/domain/entities/user.entity';
import { BalanceEntity } from '../../../balance/domain/entities/balance.entity';
import { TaxType } from '../../../shared/domain/enums/tax-type.enum';
import { UserRole } from '../../../shared/domain/enums/user-role.enum';
import { PaymentStatus } from '../../../shared/domain/enums/payment-status.enum';

describe('ProcessPaymentUseCase', () => {
  let useCase: ProcessPaymentUseCase;
  let paymentRepository: any;
  let taxRepository: any;
  let balanceRepository: any;
  let affiliationRepository: any;
  let coproductionRepository: any;
  let userRepository: any;
  let mockPrismaService: any;

  const mockProducer = new UserEntity(
    'producer-id',
    'producer@example.com',
    'hashed',
    'Producer',
    UserRole.PRODUCER,
    new Date(),
    new Date(),
  );

  const mockAffiliate = new UserEntity(
    'affiliate-id',
    'affiliate@example.com',
    'hashed',
    'Affiliate',
    UserRole.AFFILIATE,
    new Date(),
    new Date(),
  );

  const mockPlatform = new UserEntity(
    'platform-id',
    'platform@example.com',
    'hashed',
    'Platform',
    UserRole.PLATFORM,
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    paymentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByProducer: jest.fn(),
      findByAffiliate: jest.fn(),
    };

    taxRepository = {
      findByCountryAndType: jest.fn(),
    };

    balanceRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      atomicUpdate: jest.fn(),
    };

    affiliationRepository = {
      findByProducerAndAffiliate: jest.fn(),
    };

    coproductionRepository = {
      findByProducerAndCoproducer: jest.fn(),
    };

    userRepository = {
      findById: jest.fn(),
      findByRole: jest.fn(),
    };

    mockPrismaService = {
      client: {
        $transaction: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessPaymentUseCase,
        {
          provide: INJECTION_TOKENS.PAYMENT_REPOSITORY,
          useValue: paymentRepository,
        },
        {
          provide: INJECTION_TOKENS.TAX_REPOSITORY,
          useValue: taxRepository,
        },
        {
          provide: INJECTION_TOKENS.BALANCE_REPOSITORY,
          useValue: balanceRepository,
        },
        {
          provide: INJECTION_TOKENS.AFFILIATION_REPOSITORY,
          useValue: affiliationRepository,
        },
        {
          provide: INJECTION_TOKENS.COPRODUCTION_REPOSITORY,
          useValue: coproductionRepository,
        },
        {
          provide: INJECTION_TOKENS.USER_REPOSITORY,
          useValue: userRepository,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    useCase = module.get<ProcessPaymentUseCase>(ProcessPaymentUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should process payment with producer only', async () => {
      const dto = {
        amount: 1000,
        country: 'BR',
        buyerId: 'buyer-id',
        producerId: 'producer-id',
      };

      // Criar balance com saldo suficiente
      const buyerBalanceWithCredit = BalanceEntity.create('buyer-id').credit(2000);

      const transactionTax = TaxEntity.create('BR', TaxType.TRANSACTION, 5);
      const platformTax = TaxEntity.create('BR', TaxType.PLATFORM, 2);

      const payment = PaymentEntity.create(
        1000,
        'BR',
        'buyer-id',
        'producer-id',
        null,
        null,
        50,
        20,
        930,
        null,
        null,
        20,
      );

      // Mock da transação do Prisma
      const mockPrismaPayment = {
        id: payment.id,
        amount: payment.amount,
        country: payment.country,
        status: payment.status,
        buyerId: payment.buyerId,
        producerId: payment.producerId,
        affiliateId: payment.affiliateId,
        coproducerId: payment.coproducerId,
        transactionTax: payment.transactionTax,
        platformTax: payment.platformTax,
        producerCommission: payment.producerCommission,
        affiliateCommission: payment.affiliateCommission,
        coproducerCommission: payment.coproducerCommission,
        platformCommission: payment.platformCommission,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      };

      // Mock do create dentro da transação
      const mockTxInstance = {
        payment: {
          create: jest.fn().mockResolvedValue(mockPrismaPayment),
        },
      };

      // Configura o mock da transação ANTES de configurar os outros mocks
      mockPrismaService.client.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTxInstance);
      });

      // Mock para validação inicial (fora da transação) e dentro da transação
      balanceRepository.findByUserId.mockImplementation((userId, tx) => {
        // Sempre retorna o saldo, independente de estar dentro ou fora da transação
        return Promise.resolve(buyerBalanceWithCredit);
      });

      userRepository.findById.mockResolvedValue(mockProducer);
      taxRepository.findByCountryAndType
        .mockResolvedValueOnce(transactionTax)
        .mockResolvedValueOnce(platformTax);
      userRepository.findByRole.mockResolvedValue(mockPlatform);

      // Mock do atomicUpdate
      balanceRepository.atomicUpdate.mockResolvedValue(
        BalanceEntity.create('producer-id'),
      );

      const result = await useCase.execute(dto);

      expect(result).toBeInstanceOf(PaymentEntity);
      expect(result.status).toBe(PaymentStatus.APPROVED);
      expect(result.buyerId).toBe('buyer-id');
      expect(result.producerId).toBe('producer-id');
      expect(balanceRepository.atomicUpdate).toHaveBeenCalledWith('buyer-id', -1000, expect.anything());
      expect(balanceRepository.atomicUpdate).toHaveBeenCalledWith('producer-id', 930, expect.anything());
    });

    it('should throw UnprocessableEntityException for insufficient balance', async () => {
      const dto = {
        amount: 1000,
        country: 'BR',
        buyerId: 'buyer-id',
        producerId: 'producer-id',
      };

      const buyerBalance = BalanceEntity.create('buyer-id');
      buyerBalance.credit(100); // Saldo insuficiente

      balanceRepository.findByUserId.mockResolvedValue(buyerBalance);

      try {
        await useCase.execute(dto);
        fail('Should have thrown UnprocessableEntityException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnprocessableEntityException);
        expect(error.message).toContain('Insufficient balance');
        // Verificar que não chegou a validar o produtor
        expect(userRepository.findById).not.toHaveBeenCalled();
      }
    });

    it('should throw UnprocessableEntityException when buyer has no balance', async () => {
      const dto = {
        amount: 1000,
        country: 'BR',
        buyerId: 'buyer-id',
        producerId: 'producer-id',
      };

      balanceRepository.findByUserId.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(UnprocessableEntityException);
      await expect(useCase.execute(dto)).rejects.toThrow('Insufficient balance');
    });

    it('should throw BadRequestException for negative amount', async () => {
      const dto = {
        amount: -100,
        country: 'BR',
        buyerId: 'buyer-id',
        producerId: 'producer-id',
      };

      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when producer not found', async () => {
      const dto = {
        amount: 1000,
        country: 'BR',
        buyerId: 'buyer-id',
        producerId: 'nonexistent',
      };

      // Criar balance com saldo suficiente
      const buyerBalanceWithCredit = BalanceEntity.create('buyer-id').credit(2000);

      // Mock da transação (não será executada porque o produtor não será encontrado)
      mockPrismaService.client.$transaction.mockImplementation(async (callback) => {
        return await callback({ payment: { create: jest.fn() } });
      });

      // Mock será chamado duas vezes: validação inicial e na transação
      balanceRepository.findByUserId.mockImplementation((userId, tx) => {
        return Promise.resolve(buyerBalanceWithCredit);
      });
      userRepository.findById.mockResolvedValue(null); // Produtor não encontrado

      await expect(useCase.execute(dto)).rejects.toThrow(NotFoundException);
      expect(userRepository.findById).toHaveBeenCalledWith('nonexistent');
    });
  });
});

