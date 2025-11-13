import { ApiProperty } from '@nestjs/swagger';
import { PaymentEntity } from '../../../domain/entities/payment.entity';
import { PaymentStatus } from '../../../../shared/domain/enums/payment-status.enum';

export class PaymentResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID único do pagamento' })
  id: string;

  @ApiProperty({ example: 1000.00, description: 'Valor original do pagamento' })
  amount: number;

  @ApiProperty({ example: 'BR', description: 'Código do país' })
  country: string;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.APPROVED, description: 'Status do pagamento' })
  status: PaymentStatus;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID do comprador' })
  buyerId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID do produtor' })
  producerId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'ID do afiliado (se houver)', nullable: true })
  affiliateId: string | null;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002', description: 'ID do coprodutor (se houver)', nullable: true })
  coproducerId: string | null;

  @ApiProperty({ example: 50.00, description: 'Taxa de transação calculada' })
  transactionTax: number;

  @ApiProperty({ example: 20.00, description: 'Taxa da plataforma calculada' })
  platformTax: number;

  @ApiProperty({ example: 930.00, description: 'Comissão do produtor' })
  producerCommission: number;

  @ApiProperty({ example: 100.00, description: 'Comissão do afiliado (se houver)', nullable: true })
  affiliateCommission: number | null;

  @ApiProperty({ example: 50.00, description: 'Comissão do coprodutor (se houver)', nullable: true })
  coproducerCommission: number | null;

  @ApiProperty({ example: 20.00, description: 'Comissão da plataforma' })
  platformCommission: number;

  @ApiProperty({ example: '2025-11-12T20:00:00.000Z', description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ example: '2025-11-12T20:00:00.000Z', description: 'Data de última atualização' })
  updatedAt: Date;

  static fromEntity(entity: PaymentEntity): PaymentResponseDto {
    const dto = new PaymentResponseDto();
    dto.id = entity.id;
    dto.amount = entity.amount;
    dto.country = entity.country;
    dto.status = entity.status;
    dto.buyerId = entity.buyerId;
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

