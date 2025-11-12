import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { PaymentEntity } from '../../domain/entities/payment.entity';
import { IPaymentRepository } from '../../domain/repositories/payment.repository.interface';

@Injectable()
export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(payment: PaymentEntity): Promise<PaymentEntity> {
    const created = await this.prisma.client.payment.create({
      data: {
        id: payment.id,
        amount: payment.amount,
        country: payment.country,
        status: payment.status,
        producerId: payment.producerId,
        affiliateId: payment.affiliateId,
        coproducerId: payment.coproducerId,
        transactionTax: payment.transactionTax,
        platformTax: payment.platformTax,
        producerCommission: payment.producerCommission,
        affiliateCommission: payment.affiliateCommission,
        coproducerCommission: payment.coproducerCommission,
        platformCommission: payment.platformCommission,
      },
    });

    return PaymentEntity.fromPrisma(created);
  }

  async findById(id: string): Promise<PaymentEntity | null> {
    const payment = await this.prisma.client.payment.findUnique({
      where: { id },
    });

    return payment ? PaymentEntity.fromPrisma(payment) : null;
  }

  async findByProducer(producerId: string): Promise<PaymentEntity[]> {
    const payments = await this.prisma.client.payment.findMany({
      where: { producerId },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((payment) => PaymentEntity.fromPrisma(payment));
  }

  async findByAffiliate(affiliateId: string): Promise<PaymentEntity[]> {
    const payments = await this.prisma.client.payment.findMany({
      where: { affiliateId },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((payment) => PaymentEntity.fromPrisma(payment));
  }
}

