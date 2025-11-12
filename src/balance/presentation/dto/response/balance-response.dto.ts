import { ApiProperty } from '@nestjs/swagger';
import { BalanceEntity } from '../../../domain/entities/balance.entity';

export class BalanceResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID único do saldo' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID do usuário' })
  userId: string;

  @ApiProperty({ example: 1000.50, description: 'Valor do saldo' })
  amount: number;

  @ApiProperty({ example: '2025-11-12T20:00:00.000Z', description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ example: '2025-11-12T20:00:00.000Z', description: 'Data de última atualização' })
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
