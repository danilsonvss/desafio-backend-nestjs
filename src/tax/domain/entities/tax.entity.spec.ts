import { TaxEntity } from './tax.entity';
import { TaxType } from '../../../shared/domain/enums/tax-type.enum';

describe('TaxEntity', () => {
  describe('create', () => {
    it('should create a new tax entity', () => {
      const tax = TaxEntity.create('BR', TaxType.TRANSACTION, 5.5);

      expect(tax).toBeInstanceOf(TaxEntity);
      expect(tax.country).toBe('BR');
      expect(tax.type).toBe(TaxType.TRANSACTION);
      expect(tax.percentage).toBe(5.5);
      expect(tax.id).toBeDefined();
      expect(tax.createdAt).toBeInstanceOf(Date);
      expect(tax.updatedAt).toBeInstanceOf(Date);
    });

    it('should uppercase and trim country', () => {
      const tax = TaxEntity.create('  br  ', TaxType.PLATFORM, 2.5);

      expect(tax.country).toBe('BR');
    });

    it('should throw error for negative percentage', () => {
      expect(() => {
        TaxEntity.create('BR', TaxType.TRANSACTION, -1);
      }).toThrow('Percentage must be between 0 and 100');
    });

    it('should throw error for percentage greater than 100', () => {
      expect(() => {
        TaxEntity.create('BR', TaxType.TRANSACTION, 101);
      }).toThrow('Percentage must be between 0 and 100');
    });

    it('should accept percentage equal to 0', () => {
      const tax = TaxEntity.create('BR', TaxType.TRANSACTION, 0);
      expect(tax.percentage).toBe(0);
    });

    it('should accept percentage equal to 100', () => {
      const tax = TaxEntity.create('BR', TaxType.TRANSACTION, 100);
      expect(tax.percentage).toBe(100);
    });
  });

  describe('fromPrisma', () => {
    it('should create entity from Prisma data', () => {
      const prismaData = {
        id: 'tax-id',
        country: 'US',
        type: TaxType.PLATFORM,
        percentage: 3.5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const tax = TaxEntity.fromPrisma(prismaData);

      expect(tax).toBeInstanceOf(TaxEntity);
      expect(tax.id).toBe('tax-id');
      expect(tax.country).toBe('US');
      expect(tax.type).toBe(TaxType.PLATFORM);
      expect(tax.percentage).toBe(3.5);
    });

    it('should convert string percentage to number', () => {
      const prismaData = {
        id: 'tax-id',
        country: 'BR',
        type: TaxType.TRANSACTION,
        percentage: '5.5',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const tax = TaxEntity.fromPrisma(prismaData);
      expect(tax.percentage).toBe(5.5);
    });

    it('should convert Prisma Decimal to number', () => {
      const prismaData = {
        id: 'tax-id',
        country: 'BR',
        type: TaxType.TRANSACTION,
        percentage: {
          toNumber: () => 7.5,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const tax = TaxEntity.fromPrisma(prismaData);
      expect(tax.percentage).toBe(7.5);
    });
  });

  describe('updatePercentage', () => {
    it('should create new entity with updated percentage', () => {
      const tax = TaxEntity.create('BR', TaxType.TRANSACTION, 5.0);
      const updated = tax.updatePercentage(7.5);

      expect(updated).not.toBe(tax);
      expect(updated.id).toBe(tax.id);
      expect(updated.country).toBe(tax.country);
      expect(updated.type).toBe(tax.type);
      expect(updated.percentage).toBe(7.5);
      expect(updated.createdAt).toEqual(tax.createdAt);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(tax.updatedAt.getTime());
    });

    it('should validate new percentage', () => {
      const tax = TaxEntity.create('BR', TaxType.TRANSACTION, 5.0);

      expect(() => {
        tax.updatePercentage(-1);
      }).toThrow('Percentage must be between 0 and 100');
    });
  });

  describe('calculateTax', () => {
    it('should calculate tax correctly', () => {
      const tax = TaxEntity.create('BR', TaxType.TRANSACTION, 5.0);
      const amount = 1000;
      const taxAmount = tax.calculateTax(amount);

      expect(taxAmount).toBe(50);
    });

    it('should calculate tax with decimal percentage', () => {
      const tax = TaxEntity.create('BR', TaxType.TRANSACTION, 2.5);
      const amount = 1000;
      const taxAmount = tax.calculateTax(amount);

      expect(taxAmount).toBe(25);
    });

    it('should return 0 for zero percentage', () => {
      const tax = TaxEntity.create('BR', TaxType.TRANSACTION, 0);
      const amount = 1000;
      const taxAmount = tax.calculateTax(amount);

      expect(taxAmount).toBe(0);
    });

    it('should handle decimal amounts', () => {
      const tax = TaxEntity.create('BR', TaxType.TRANSACTION, 5.0);
      const amount = 1234.56;
      const taxAmount = tax.calculateTax(amount);

      expect(taxAmount).toBeCloseTo(61.728, 2);
    });
  });

  describe('validation', () => {
    it('should throw error for empty country', () => {
      expect(() => {
        new TaxEntity(
          'id',
          '',
          TaxType.TRANSACTION,
          5.0,
          new Date(),
          new Date(),
        );
      }).toThrow('Country is required');
    });

    it('should throw error for invalid tax type', () => {
      expect(() => {
        new TaxEntity(
          'id',
          'BR',
          'INVALID' as TaxType,
          5.0,
          new Date(),
          new Date(),
        );
      }).toThrow('Invalid tax type');
    });
  });
});

