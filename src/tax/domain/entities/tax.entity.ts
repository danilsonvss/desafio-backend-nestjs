import { TaxType } from '../../../shared/domain/enums/tax-type.enum';

export class TaxEntity {
  constructor(
    public readonly id: string,
    public readonly country: string,
    public readonly type: TaxType,
    public readonly percentage: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.country || this.country.trim().length === 0) {
      throw new Error('Country is required');
    }

    if (this.percentage < 0 || this.percentage > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }

    if (!Object.values(TaxType).includes(this.type)) {
      throw new Error('Invalid tax type');
    }
  }

  static create(
    country: string,
    type: TaxType,
    percentage: number,
  ): TaxEntity {
    const now = new Date();
    return new TaxEntity(
      crypto.randomUUID(),
      country.toUpperCase().trim(),
      type,
      percentage,
      now,
      now,
    );
  }

  static fromPrisma(data: {
    id: string;
    country: string;
    type: string;
    percentage: number | string | any;
    createdAt: Date;
    updatedAt: Date;
  }): TaxEntity {
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

    return new TaxEntity(
      data.id,
      data.country,
      data.type as TaxType,
      percentage,
      data.createdAt,
      data.updatedAt,
    );
  }

  updatePercentage(newPercentage: number): TaxEntity {
    return new TaxEntity(
      this.id,
      this.country,
      this.type,
      newPercentage,
      this.createdAt,
      new Date(),
    );
  }

  calculateTax(amount: number): number {
    return (amount * this.percentage) / 100;
  }
}

