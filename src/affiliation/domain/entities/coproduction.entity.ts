export class CoproductionEntity {
  constructor(
    public readonly id: string,
    public readonly producerId: string,
    public readonly coproducerId: string,
    public readonly percentage: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.producerId || this.producerId.trim().length === 0) {
      throw new Error('Producer ID is required');
    }

    if (!this.coproducerId || this.coproducerId.trim().length === 0) {
      throw new Error('Coproducer ID is required');
    }

    if (this.producerId === this.coproducerId) {
      throw new Error('Producer and coproducer cannot be the same user');
    }

    if (this.percentage < 0 || this.percentage > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }
  }

  static create(
    producerId: string,
    coproducerId: string,
    percentage: number,
  ): CoproductionEntity {
    const now = new Date();
    return new CoproductionEntity(
      crypto.randomUUID(),
      producerId.trim(),
      coproducerId.trim(),
      percentage,
      now,
      now,
    );
  }

  static fromPrisma(data: {
    id: string;
    producerId: string;
    coproducerId: string;
    percentage: number | string | any;
    createdAt: Date;
    updatedAt: Date;
  }): CoproductionEntity {
    let percentage: number;

    if (typeof data.percentage === 'string') {
      percentage = parseFloat(data.percentage);
    } else if (typeof data.percentage === 'number') {
      percentage = data.percentage;
    } else if (data.percentage && typeof data.percentage.toNumber === 'function') {
      percentage = data.percentage.toNumber();
    } else {
      percentage = Number(data.percentage);
    }

    return new CoproductionEntity(
      data.id,
      data.producerId,
      data.coproducerId,
      percentage,
      data.createdAt,
      data.updatedAt,
    );
  }

  updatePercentage(newPercentage: number): CoproductionEntity {
    return new CoproductionEntity(
      this.id,
      this.producerId,
      this.coproducerId,
      newPercentage,
      this.createdAt,
      new Date(),
    );
  }

  calculateCommission(amount: number): number {
    return (amount * this.percentage) / 100;
  }
}

