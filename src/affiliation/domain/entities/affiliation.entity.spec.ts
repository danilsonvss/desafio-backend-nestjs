import { AffiliationEntity } from './affiliation.entity';

describe('AffiliationEntity', () => {
  describe('create', () => {
    it('should create a new affiliation entity', () => {
      const affiliation = AffiliationEntity.create('producer-id', 'affiliate-id', 10.5);

      expect(affiliation).toBeInstanceOf(AffiliationEntity);
      expect(affiliation.producerId).toBe('producer-id');
      expect(affiliation.affiliateId).toBe('affiliate-id');
      expect(affiliation.percentage).toBe(10.5);
      expect(affiliation.id).toBeDefined();
      expect(affiliation.createdAt).toBeInstanceOf(Date);
      expect(affiliation.updatedAt).toBeInstanceOf(Date);
    });

    it('should trim producer and affiliate IDs', () => {
      const affiliation = AffiliationEntity.create('  producer-id  ', '  affiliate-id  ', 10.5);

      expect(affiliation.producerId).toBe('producer-id');
      expect(affiliation.affiliateId).toBe('affiliate-id');
    });

    it('should throw error when producer and affiliate are the same', () => {
      expect(() => {
        AffiliationEntity.create('same-id', 'same-id', 10);
      }).toThrow('Producer and affiliate cannot be the same user');
    });

    it('should throw error for negative percentage', () => {
      expect(() => {
        AffiliationEntity.create('producer-id', 'affiliate-id', -1);
      }).toThrow('Percentage must be between 0 and 100');
    });

    it('should throw error for percentage greater than 100', () => {
      expect(() => {
        AffiliationEntity.create('producer-id', 'affiliate-id', 101);
      }).toThrow('Percentage must be between 0 and 100');
    });

    it('should accept percentage equal to 0', () => {
      const affiliation = AffiliationEntity.create('producer-id', 'affiliate-id', 0);
      expect(affiliation.percentage).toBe(0);
    });

    it('should accept percentage equal to 100', () => {
      const affiliation = AffiliationEntity.create('producer-id', 'affiliate-id', 100);
      expect(affiliation.percentage).toBe(100);
    });
  });

  describe('fromPrisma', () => {
    it('should create entity from Prisma data', () => {
      const prismaData = {
        id: 'affiliation-id',
        producerId: 'producer-id',
        affiliateId: 'affiliate-id',
        percentage: 15.5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const affiliation = AffiliationEntity.fromPrisma(prismaData);

      expect(affiliation).toBeInstanceOf(AffiliationEntity);
      expect(affiliation.id).toBe('affiliation-id');
      expect(affiliation.producerId).toBe('producer-id');
      expect(affiliation.affiliateId).toBe('affiliate-id');
      expect(affiliation.percentage).toBe(15.5);
    });

    it('should convert string percentage to number', () => {
      const prismaData = {
        id: 'affiliation-id',
        producerId: 'producer-id',
        affiliateId: 'affiliate-id',
        percentage: '20.5',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const affiliation = AffiliationEntity.fromPrisma(prismaData);
      expect(affiliation.percentage).toBe(20.5);
    });

    it('should convert Prisma Decimal to number', () => {
      const prismaData = {
        id: 'affiliation-id',
        producerId: 'producer-id',
        affiliateId: 'affiliate-id',
        percentage: {
          toNumber: () => 25.5,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const affiliation = AffiliationEntity.fromPrisma(prismaData);
      expect(affiliation.percentage).toBe(25.5);
    });
  });

  describe('updatePercentage', () => {
    it('should create new entity with updated percentage', () => {
      const affiliation = AffiliationEntity.create('producer-id', 'affiliate-id', 10.0);
      const updated = affiliation.updatePercentage(15.0);

      expect(updated).not.toBe(affiliation);
      expect(updated.id).toBe(affiliation.id);
      expect(updated.producerId).toBe(affiliation.producerId);
      expect(updated.affiliateId).toBe(affiliation.affiliateId);
      expect(updated.percentage).toBe(15.0);
      expect(updated.createdAt).toEqual(affiliation.createdAt);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(affiliation.updatedAt.getTime());
    });

    it('should validate new percentage', () => {
      const affiliation = AffiliationEntity.create('producer-id', 'affiliate-id', 10.0);

      expect(() => {
        affiliation.updatePercentage(101);
      }).toThrow('Percentage must be between 0 and 100');
    });
  });

  describe('calculateCommission', () => {
    it('should calculate commission correctly', () => {
      const affiliation = AffiliationEntity.create('producer-id', 'affiliate-id', 10.0);
      const amount = 1000;
      const commission = affiliation.calculateCommission(amount);

      expect(commission).toBe(100);
    });

    it('should calculate commission with decimal percentage', () => {
      const affiliation = AffiliationEntity.create('producer-id', 'affiliate-id', 12.5);
      const amount = 1000;
      const commission = affiliation.calculateCommission(amount);

      expect(commission).toBe(125);
    });

    it('should return 0 for zero percentage', () => {
      const affiliation = AffiliationEntity.create('producer-id', 'affiliate-id', 0);
      const amount = 1000;
      const commission = affiliation.calculateCommission(amount);

      expect(commission).toBe(0);
    });

    it('should handle decimal amounts', () => {
      const affiliation = AffiliationEntity.create('producer-id', 'affiliate-id', 10.0);
      const amount = 1234.56;
      const commission = affiliation.calculateCommission(amount);

      expect(commission).toBeCloseTo(123.456, 2);
    });
  });

  describe('validation', () => {
    it('should throw error for empty producer ID', () => {
      expect(() => {
        new AffiliationEntity(
          'id',
          '',
          'affiliate-id',
          10.0,
          new Date(),
          new Date(),
        );
      }).toThrow('Producer ID is required');
    });

    it('should throw error for empty affiliate ID', () => {
      expect(() => {
        new AffiliationEntity(
          'id',
          'producer-id',
          '',
          10.0,
          new Date(),
          new Date(),
        );
      }).toThrow('Affiliate ID is required');
    });
  });
});

