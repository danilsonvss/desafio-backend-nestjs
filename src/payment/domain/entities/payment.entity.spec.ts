import { PaymentEntity } from './payment.entity';
import { PaymentStatus } from '../../../shared/domain/enums/payment-status.enum';

describe('PaymentEntity', () => {
  describe('create', () => {
    it('should create a new payment entity', () => {
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

      expect(payment).toBeInstanceOf(PaymentEntity);
      expect(payment.amount).toBe(1000);
      expect(payment.country).toBe('BR');
      expect(payment.status).toBe(PaymentStatus.APPROVED);
      expect(payment.producerId).toBe('producer-id');
      expect(payment.affiliateId).toBe('affiliate-id');
      expect(payment.coproducerId).toBeNull();
      expect(payment.transactionTax).toBe(50);
      expect(payment.platformTax).toBe(20);
      expect(payment.producerCommission).toBe(700);
      expect(payment.affiliateCommission).toBe(100);
      expect(payment.coproducerCommission).toBeNull();
      expect(payment.platformCommission).toBe(130);
      expect(payment.id).toBeDefined();
      expect(payment.createdAt).toBeInstanceOf(Date);
      expect(payment.updatedAt).toBeInstanceOf(Date);
    });

    it('should uppercase and trim country', () => {
      const payment = PaymentEntity.create(
        1000,
        '  br  ',
        'producer-id',
        null,
        null,
        50,
        20,
        700,
        null,
        null,
        130,
      );

      expect(payment.country).toBe('BR');
    });

    it('should trim producer, affiliate and coproducer IDs', () => {
      const payment = PaymentEntity.create(
        1000,
        'BR',
        '  producer-id  ',
        '  affiliate-id  ',
        '  coproducer-id  ',
        50,
        20,
        700,
        100,
        50,
        130,
      );

      expect(payment.producerId).toBe('producer-id');
      expect(payment.affiliateId).toBe('affiliate-id');
      expect(payment.coproducerId).toBe('coproducer-id');
    });

    it('should throw error for negative amount', () => {
      expect(() => {
        PaymentEntity.create(
          -100,
          'BR',
          'producer-id',
          null,
          null,
          0,
          0,
          100,
          null,
          null,
          0,
        );
      }).toThrow('Payment amount must be positive');
    });

    it('should throw error for zero amount', () => {
      expect(() => {
        PaymentEntity.create(
          0,
          'BR',
          'producer-id',
          null,
          null,
          0,
          0,
          0,
          null,
          null,
          0,
        );
      }).toThrow('Payment amount must be positive');
    });

    it('should throw error for empty country', () => {
      expect(() => {
        PaymentEntity.create(
          1000,
          '',
          'producer-id',
          null,
          null,
          0,
          0,
          1000,
          null,
          null,
          0,
        );
      }).toThrow('Country is required');
    });

    it('should throw error for empty producer ID', () => {
      expect(() => {
        PaymentEntity.create(
          1000,
          'BR',
          '',
          null,
          null,
          0,
          0,
          1000,
          null,
          null,
          0,
        );
      }).toThrow('Producer ID is required');
    });

    it('should throw error for negative taxes', () => {
      expect(() => {
        PaymentEntity.create(
          1000,
          'BR',
          'producer-id',
          null,
          null,
          -10,
          0,
          1000,
          null,
          null,
          0,
        );
      }).toThrow('Taxes cannot be negative');
    });

    it('should throw error for negative commissions', () => {
      expect(() => {
        PaymentEntity.create(
          1000,
          'BR',
          'producer-id',
          null,
          null,
          0,
          0,
          -100,
          null,
          null,
          0,
        );
      }).toThrow('Commissions cannot be negative');
    });
  });

  describe('fromPrisma', () => {
    it('should create entity from Prisma data', () => {
      const prismaData = {
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

      const payment = PaymentEntity.fromPrisma(prismaData);

      expect(payment).toBeInstanceOf(PaymentEntity);
      expect(payment.id).toBe('payment-id');
      expect(payment.amount).toBe(1000);
      expect(payment.country).toBe('BR');
      expect(payment.status).toBe(PaymentStatus.APPROVED);
    });

    it('should convert string amounts to number', () => {
      const prismaData = {
        id: 'payment-id',
        amount: '1000',
        country: 'BR',
        status: PaymentStatus.APPROVED,
        producerId: 'producer-id',
        affiliateId: null,
        coproducerId: null,
        transactionTax: '50',
        platformTax: '20',
        producerCommission: '700',
        affiliateCommission: null,
        coproducerCommission: null,
        platformCommission: '130',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const payment = PaymentEntity.fromPrisma(prismaData);
      expect(payment.amount).toBe(1000);
      expect(payment.transactionTax).toBe(50);
    });

    it('should convert Prisma Decimal to number', () => {
      const prismaData = {
        id: 'payment-id',
        amount: { toNumber: () => 1000 },
        country: 'BR',
        status: PaymentStatus.APPROVED,
        producerId: 'producer-id',
        affiliateId: null,
        coproducerId: null,
        transactionTax: { toNumber: () => 50 },
        platformTax: { toNumber: () => 20 },
        producerCommission: { toNumber: () => 700 },
        affiliateCommission: null,
        coproducerCommission: null,
        platformCommission: { toNumber: () => 130 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const payment = PaymentEntity.fromPrisma(prismaData);
      expect(payment.amount).toBe(1000);
      expect(payment.transactionTax).toBe(50);
    });
  });
});

