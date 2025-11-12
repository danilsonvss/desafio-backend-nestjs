import { BalanceEntity } from '../../../domain/entities/balance.entity';

export class BalanceResponseDto {
  id: string;
  userId: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: BalanceEntity): BalanceResponseDto {
    const dto = new BalanceResponseDto();
    dto.id = entity.id;
    dto.userId = entity.userId;
    dto.amount = entity.amount;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
