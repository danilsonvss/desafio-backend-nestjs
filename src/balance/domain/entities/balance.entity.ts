export class BalanceEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validateAmount();
  }

  private validateAmount(): void {
    if (this.amount < 0) {
      throw new Error('Balance amount cannot be negative');
    }
  }

  static create(userId: string): BalanceEntity {
    const now = new Date();
    return new BalanceEntity(
      crypto.randomUUID(),
      userId,
      0,
      now,
      now,
    );
  }

  static fromPrisma(data: {
    id: string;
    userId: string;
    amount: number | string | any;
    createdAt: Date;
    updatedAt: Date;
  }): BalanceEntity {
    let amount: number;
    
    if (typeof data.amount === 'string') {
      amount = parseFloat(data.amount);
    } else if (typeof data.amount === 'number') {
      amount = data.amount;
    } else if (data.amount && typeof data.amount.toNumber === 'function') {
      // Prisma Decimal type
      amount = data.amount.toNumber();
    } else {
      amount = Number(data.amount);
    }

    return new BalanceEntity(
      data.id,
      data.userId,
      amount,
      data.createdAt,
      data.updatedAt,
    );
  }

  credit(amount: number): BalanceEntity {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive');
    }

    return new BalanceEntity(
      this.id,
      this.userId,
      this.amount + amount,
      this.createdAt,
      new Date(),
    );
  }

  debit(amount: number): BalanceEntity {
    if (amount <= 0) {
      throw new Error('Debit amount must be positive');
    }

    const newAmount = this.amount - amount;
    if (newAmount < 0) {
      throw new Error('Insufficient balance');
    }

    return new BalanceEntity(
      this.id,
      this.userId,
      newAmount,
      this.createdAt,
      new Date(),
    );
  }

  hasAvailableBalance(amount: number): boolean {
    return this.amount >= amount;
  }
}

