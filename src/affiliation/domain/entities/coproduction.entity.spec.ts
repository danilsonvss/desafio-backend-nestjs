import { CoproductionEntity } from './coproduction.entity';

describe('CoproductionEntity', () => {
  describe('create', () => {
    it('should create a new coproduction entity', () => {
      const coproduction = CoproductionEntity.create('producer-id', 'coproducer-id', 20.5);

      expect(coproduction).toBeInstanceOf(CoproductionEntity);
      expect(coproduction.producerId).toBe('producer-id');
      expect(coproduction.coproducerId).toBe('coproducer-id');
      expect(coproduction.percentage).toBe(20.5);
      expect(coproduction.id).toBeDefined();
      expect(coproduction.createdAt).toBeInstanceOf(Date);
      expect(coproduction.updatedAt).toBeInstanceOf(Date);
    });

    it('should trim producer and coproducer IDs', () => {
      const coproduction = CoproductionEntity.create('  producer-id  ', '  coproducer-id  ', 20.5);

      expect(coproduction.producerId).toBe('producer-id');
      expect(coproduction.coproducerId).toBe('coproducer-id');
    });

    it('should throw error when producer and coproducer are the same', () => {
      expect(() => {
        CoproductionEntity.create('same-id', 'same-id', 20);
      }).toThrow('Producer and coproducer cannot be the same user');
    });

    it('should throw error for negative percentage', () => {
      expect(() => {
        CoproductionEntity.create('producer-id', 'coproducer-id', -1);
      }).toThrow('Percentage must be between 0 and 100');
    });

    it('should throw error for percentage greater than 100', () => {
      expect(() => {
        CoproductionEntity.create('producer-id', 'coproducer-id', 101);
      }).toThrow('Percentage must be between 0 and 100');
    });

    it('should accept percentage equal to 0', () => {
      const coproduction = CoproductionEntity.create('producer-id', 'coproducer-id', 0);
      expect(coproduction.percentage).toBe(0);
    });

    it('should accept percentage equal to 100', () => {
      const coproduction = CoproductionEntity.create('producer-id', 'coproducer-id', 100);
      expect(coproduction.percentage).toBe(100);
    });
  });

  describe('fromPrisma', () => {
    it('should create entity from Prisma data', () => {
      const prismaData = {
        id: 'coproduction-id',
        producerId: 'producer-id',
        coproducerId: 'coproducer-id',
        percentage: 25.5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const coproduction = CoproductionEntity.fromPrisma(prismaData);

      expect(coproduction).toBeInstanceOf(CoproductionEntity);
      expect(coproduction.id).toBe('coproduction-id');
      expect(coproduction.producerId).toBe('producer-id');
      expect(coproduction.coproducerId).toBe('coproducer-id');
      expect(coproduction.percentage).toBe(25.5);
    });

    it('should convert string percentage to number', () => {
      const prismaData = {
        id: 'coproduction-id',
        producerId: 'producer-id',
        coproducerId: 'coproducer-id',
        percentage: '30.5',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const coproduction = CoproductionEntity.fromPrisma(prismaData);
      expect(coproduction.percentage).toBe(30.5);
    });

    it('should convert Prisma Decimal to number', () => {
      const prismaData = {
        id: 'coproduction-id',
        producerId: 'producer-id',
        coproducerId: 'coproducer-id',
        percentage: {
          toNumber: () => 35.5,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const coproduction = CoproductionEntity.fromPrisma(prismaData);
      expect(coproduction.percentage).toBe(35.5);
    });
  });

  describe('updatePercentage', () => {
    it('should create new entity with updated percentage', () => {
      const coproduction = CoproductionEntity.create('producer-id', 'coproducer-id', 20.0);
      const updated = coproduction.updatePercentage(25.0);

      expect(updated).not.toBe(coproduction);
      expect(updated.id).toBe(coproduction.id);
      expect(updated.producerId).toBe(coproduction.producerId);
      expect(updated.coproducerId).toBe(coproduction.coproducerId);
      expect(updated.percentage).toBe(25.0);
      expect(updated.createdAt).toEqual(coproduction.createdAt);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(coproduction.updatedAt.getTime());
    });

    it('should validate new percentage', () => {
      const coproduction = CoproductionEntity.create('producer-id', 'coproducer-id', 20.0);

      expect(() => {
        coproduction.updatePercentage(101);
      }).toThrow('Percentage must be between 0 and 100');
    });
  });

  describe('calculateCommission', () => {
    it('should calculate commission correctly', () => {
      const coproduction = CoproductionEntity.create('producer-id', 'coproducer-id', 20.0);
      const amount = 1000;
      const commission = coproduction.calculateCommission(amount);

      expect(commission).toBe(200);
    });

    it('should calculate commission with decimal percentage', () => {
      const coproduction = CoproductionEntity.create('producer-id', 'coproducer-id', 22.5);
      const amount = 1000;
      const commission = coproduction.calculateCommission(amount);

      expect(commission).toBe(225);
    });

    it('should return 0 for zero percentage', () => {
      const coproduction = CoproductionEntity.create('producer-id', 'coproducer-id', 0);
      const amount = 1000;
      const commission = coproduction.calculateCommission(amount);

      expect(commission).toBe(0);
    });

    it('should handle decimal amounts', () => {
      const coproduction = CoproductionEntity.create('producer-id', 'coproducer-id', 20.0);
      const amount = 1234.56;
      const commission = coproduction.calculateCommission(amount);

      expect(commission).toBeCloseTo(246.912, 2);
    });
  });

  describe('validation', () => {
    it('should throw error for empty producer ID', () => {
      expect(() => {
        new CoproductionEntity(
          'id',
          '',
          'coproducer-id',
          20.0,
          new Date(),
          new Date(),
        );
      }).toThrow('Producer ID is required');
    });

    it('should throw error for empty coproducer ID', () => {
      expect(() => {
        new CoproductionEntity(
          'id',
          'producer-id',
          '',
          20.0,
          new Date(),
          new Date(),
        );
      }).toThrow('Coproducer ID is required');
    });
  });
});

