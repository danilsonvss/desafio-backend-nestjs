export class AffiliationEntity {
  constructor(
    public readonly id: string,
    public readonly producerId: string,
    public readonly affiliateId: string,
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

    if (!this.affiliateId || this.affiliateId.trim().length === 0) {
      throw new Error('Affiliate ID is required');
    }

    if (this.producerId === this.affiliateId) {
      throw new Error('Producer and affiliate cannot be the same user');
    }

    if (this.percentage < 0 || this.percentage > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }
  }

  static create(
    producerId: string,
    affiliateId: string,
    percentage: number,
  ): AffiliationEntity {
    const now = new Date();
    return new AffiliationEntity(
      crypto.randomUUID(),
      producerId.trim(),
      affiliateId.trim(),
      percentage,
      now,
      now,
    );
  }

  static fromPrisma(data: {
    id: string;
    producerId: string;
    affiliateId: string;
    percentage: number | string | any;
    createdAt: Date;
    updatedAt: Date;
  }): AffiliationEntity {
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

    return new AffiliationEntity(
      data.id,
      data.producerId,
      data.affiliateId,
      percentage,
      data.createdAt,
      data.updatedAt,
    );
  }

  updatePercentage(newPercentage: number): AffiliationEntity {
    return new AffiliationEntity(
      this.id,
      this.producerId,
      this.affiliateId,
      newPercentage,
      this.createdAt,
      new Date(),
    );
  }

  calculateCommission(amount: number): number {
    return (amount * this.percentage) / 100;
  }
}

