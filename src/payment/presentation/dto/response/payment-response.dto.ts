import { PaymentEntity } from '../../../domain/entities/payment.entity';
import { PaymentStatus } from '../../../../shared/domain/enums/payment-status.enum';

export class PaymentResponseDto {
  id: string;
  amount: number;
  country: string;
  status: PaymentStatus;
  producerId: string;
  affiliateId: string | null;
  coproducerId: string | null;
  transactionTax: number;
  platformTax: number;
  producerCommission: number;
  affiliateCommission: number | null;
  coproducerCommission: number | null;
  platformCommission: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: PaymentEntity): PaymentResponseDto {
    const dto = new PaymentResponseDto();
    dto.id = entity.id;
    dto.amount = entity.amount;
    dto.country = entity.country;
    dto.status = entity.status;
    dto.producerId = entity.producerId;
    dto.affiliateId = entity.affiliateId;
    dto.coproducerId = entity.coproducerId;
    dto.transactionTax = entity.transactionTax;
    dto.platformTax = entity.platformTax;
    dto.producerCommission = entity.producerCommission;
    dto.affiliateCommission = entity.affiliateCommission;
    dto.coproducerCommission = entity.coproducerCommission;
    dto.platformCommission = entity.platformCommission;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

