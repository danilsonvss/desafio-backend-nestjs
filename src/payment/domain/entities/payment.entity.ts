import { PaymentStatus } from '../../../shared/domain/enums/payment-status.enum';

export class PaymentEntity {
  constructor(
    public readonly id: string,
    public readonly amount: number,
    public readonly country: string,
    public readonly status: PaymentStatus,
    public readonly buyerId: string,
    public readonly producerId: string,
    public readonly affiliateId: string | null,
    public readonly coproducerId: string | null,
    public readonly transactionTax: number,
    public readonly platformTax: number,
    public readonly producerCommission: number,
    public readonly affiliateCommission: number | null,
    public readonly coproducerCommission: number | null,
    public readonly platformCommission: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    if (!this.country || this.country.trim().length === 0) {
      throw new Error('Country is required');
    }

    if (!this.buyerId || this.buyerId.trim().length === 0) {
      throw new Error('Buyer ID is required');
    }

    if (!this.producerId || this.producerId.trim().length === 0) {
      throw new Error('Producer ID is required');
    }

    if (!Object.values(PaymentStatus).includes(this.status)) {
      throw new Error('Invalid payment status');
    }

    if (this.transactionTax < 0 || this.platformTax < 0) {
      throw new Error('Taxes cannot be negative');
    }

    if (this.producerCommission < 0 || this.platformCommission < 0) {
      throw new Error('Commissions cannot be negative');
    }
  }

  static create(
    amount: number,
    country: string,
    buyerId: string,
    producerId: string,
    affiliateId: string | null,
    coproducerId: string | null,
    transactionTax: number,
    platformTax: number,
    producerCommission: number,
    affiliateCommission: number | null,
    coproducerCommission: number | null,
    platformCommission: number,
  ): PaymentEntity {
    const now = new Date();
    return new PaymentEntity(
      crypto.randomUUID(),
      amount,
      country.toUpperCase().trim(),
      PaymentStatus.APPROVED,
      buyerId.trim(),
      producerId.trim(),
      affiliateId?.trim() || null,
      coproducerId?.trim() || null,
      transactionTax,
      platformTax,
      producerCommission,
      affiliateCommission,
      coproducerCommission,
      platformCommission,
      now,
      now,
    );
  }

  static fromPrisma(data: {
    id: string;
    amount: number | string | any;
    country: string;
    status: string;
    buyerId: string;
    producerId: string;
    affiliateId: string | null;
    coproducerId: string | null;
    transactionTax: number | string | any;
    platformTax: number | string | any;
    producerCommission: number | string | any;
    affiliateCommission: number | string | any | null;
    coproducerCommission: number | string | any | null;
    platformCommission: number | string | any;
    createdAt: Date;
    updatedAt: Date;
  }): PaymentEntity {
    const parseDecimal = (value: any): number => {
      if (typeof value === 'string') {
        return parseFloat(value);
      } else if (typeof value === 'number') {
        return value;
      } else if (value && typeof value.toNumber === 'function') {
        return value.toNumber();
      } else if (value === null || value === undefined) {
        return 0;
      }
      return Number(value);
    };

    return new PaymentEntity(
      data.id,
      parseDecimal(data.amount),
      data.country,
      data.status as PaymentStatus,
      data.buyerId,
      data.producerId,
      data.affiliateId,
      data.coproducerId,
      parseDecimal(data.transactionTax),
      parseDecimal(data.platformTax),
      parseDecimal(data.producerCommission),
      data.affiliateCommission ? parseDecimal(data.affiliateCommission) : null,
      data.coproducerCommission ? parseDecimal(data.coproducerCommission) : null,
      parseDecimal(data.platformCommission),
      data.createdAt,
      data.updatedAt,
    );
  }
}

