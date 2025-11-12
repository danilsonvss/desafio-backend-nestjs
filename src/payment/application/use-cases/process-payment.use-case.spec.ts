import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProcessPaymentUseCase } from './process-payment.use-case';
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
        producerId: 'producer-id',
      };

      const transactionTax = TaxEntity.create('BR', TaxType.TRANSACTION, 5);
      const platformTax = TaxEntity.create('BR', TaxType.PLATFORM, 2);

      userRepository.findById.mockResolvedValue(mockProducer);
      taxRepository.findByCountryAndType
        .mockResolvedValueOnce(transactionTax)
        .mockResolvedValueOnce(platformTax);
      userRepository.findByRole.mockResolvedValue(mockPlatform);

      const payment = PaymentEntity.create(
        1000,
        'BR',
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
      paymentRepository.create.mockResolvedValue(payment);

      balanceRepository.findByUserId.mockResolvedValue(null);
      balanceRepository.create.mockResolvedValue(BalanceEntity.create('producer-id'));
      balanceRepository.update.mockResolvedValue(BalanceEntity.create('producer-id'));

      const result = await useCase.execute(dto);

      expect(result).toBeInstanceOf(PaymentEntity);
      expect(result.status).toBe(PaymentStatus.APPROVED);
      expect(result.producerId).toBe('producer-id');
    });

    it('should throw BadRequestException for negative amount', async () => {
      const dto = {
        amount: -100,
        country: 'BR',
        producerId: 'producer-id',
      };

      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when producer not found', async () => {
      const dto = {
        amount: 1000,
        country: 'BR',
        producerId: 'nonexistent',
      };

      userRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(NotFoundException);
    });
  });
});

