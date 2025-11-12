import { PaymentEntity } from '../entities/payment.entity';

export interface IPaymentRepository {
  create(payment: PaymentEntity): Promise<PaymentEntity>;
  findById(id: string): Promise<PaymentEntity | null>;
  findByProducer(producerId: string): Promise<PaymentEntity[]>;
  findByAffiliate(affiliateId: string): Promise<PaymentEntity[]>;
}

