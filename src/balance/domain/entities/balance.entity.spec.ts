import { BalanceEntity } from './balance.entity';

describe('BalanceEntity', () => {
  describe('create', () => {
    it('should create a new balance with zero amount', () => {
      const userId = 'user-123';
      const balance = BalanceEntity.create(userId);

      expect(balance.userId).toBe(userId);
      expect(balance.amount).toBe(0);
      expect(balance.id).toBeDefined();
      expect(balance.createdAt).toBeInstanceOf(Date);
      expect(balance.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('fromPrisma', () => {
    it('should create balance entity from Prisma data with number amount', () => {
      const data = {
        id: '123',
        userId: 'user-123',
        amount: 100.50,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const balance = BalanceEntity.fromPrisma(data);

      expect(balance.id).toBe(data.id);
      expect(balance.userId).toBe(data.userId);
      expect(balance.amount).toBe(100.50);
      expect(balance.createdAt).toEqual(data.createdAt);
      expect(balance.updatedAt).toEqual(data.updatedAt);
    });

    it('should create balance entity from Prisma data with string amount', () => {
      const data = {
        id: '123',
        userId: 'user-123',
        amount: '100.50',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const balance = BalanceEntity.fromPrisma(data);

      expect(balance.amount).toBe(100.50);
    });
  });

  describe('credit', () => {
    it('should add amount to balance', () => {
      const balance = new BalanceEntity(
        '123',
        'user-123',
        100,
        new Date(),
        new Date(),
      );

      const updatedBalance = balance.credit(50);

      expect(updatedBalance.amount).toBe(150);
      expect(updatedBalance.id).toBe(balance.id);
      expect(updatedBalance.userId).toBe(balance.userId);
    });

    it('should throw error for zero credit amount', () => {
      const balance = BalanceEntity.create('user-123');

      expect(() => balance.credit(0)).toThrow('Credit amount must be positive');
    });

    it('should throw error for negative credit amount', () => {
      const balance = BalanceEntity.create('user-123');

      expect(() => balance.credit(-50)).toThrow('Credit amount must be positive');
    });

    it('should update updatedAt timestamp', () => {
      const oldDate = new Date('2024-01-01');
      const balance = new BalanceEntity('123', 'user-123', 100, oldDate, oldDate);

      const updatedBalance = balance.credit(50);

      expect(updatedBalance.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
    });
  });

  describe('debit', () => {
    it('should subtract amount from balance', () => {
      const balance = new BalanceEntity(
        '123',
        'user-123',
        100,
        new Date(),
        new Date(),
      );

      const updatedBalance = balance.debit(30);

      expect(updatedBalance.amount).toBe(70);
      expect(updatedBalance.id).toBe(balance.id);
      expect(updatedBalance.userId).toBe(balance.userId);
    });

    it('should throw error for zero debit amount', () => {
      const balance = new BalanceEntity('123', 'user-123', 100, new Date(), new Date());

      expect(() => balance.debit(0)).toThrow('Debit amount must be positive');
    });

    it('should throw error for negative debit amount', () => {
      const balance = new BalanceEntity('123', 'user-123', 100, new Date(), new Date());

      expect(() => balance.debit(-30)).toThrow('Debit amount must be positive');
    });

    it('should throw error for insufficient balance', () => {
      const balance = new BalanceEntity('123', 'user-123', 50, new Date(), new Date());

      expect(() => balance.debit(100)).toThrow('Insufficient balance');
    });

    it('should allow debit of exact balance amount', () => {
      const balance = new BalanceEntity('123', 'user-123', 100, new Date(), new Date());

      const updatedBalance = balance.debit(100);

      expect(updatedBalance.amount).toBe(0);
    });

    it('should update updatedAt timestamp', () => {
      const oldDate = new Date('2024-01-01');
      const balance = new BalanceEntity('123', 'user-123', 100, oldDate, oldDate);

      const updatedBalance = balance.debit(30);

      expect(updatedBalance.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
    });
  });

  describe('hasAvailableBalance', () => {
    it('should return true when balance is sufficient', () => {
      const balance = new BalanceEntity('123', 'user-123', 100, new Date(), new Date());

      expect(balance.hasAvailableBalance(50)).toBe(true);
    });

    it('should return true when balance equals amount', () => {
      const balance = new BalanceEntity('123', 'user-123', 100, new Date(), new Date());

      expect(balance.hasAvailableBalance(100)).toBe(true);
    });

    it('should return false when balance is insufficient', () => {
      const balance = new BalanceEntity('123', 'user-123', 50, new Date(), new Date());

      expect(balance.hasAvailableBalance(100)).toBe(false);
    });
  });

  describe('validation', () => {
    it('should throw error when creating balance with negative amount', () => {
      expect(() => {
        new BalanceEntity('123', 'user-123', -10, new Date(), new Date());
      }).toThrow('Balance amount cannot be negative');
    });

    it('should allow zero balance', () => {
      expect(() => {
        new BalanceEntity('123', 'user-123', 0, new Date(), new Date());
      }).not.toThrow();
    });
  });
});

