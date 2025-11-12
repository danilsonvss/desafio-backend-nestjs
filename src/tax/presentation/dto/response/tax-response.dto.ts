import { ApiProperty } from '@nestjs/swagger';
import { TaxEntity } from '../../../domain/entities/tax.entity';
import { TaxType } from '../../../../shared/domain/enums/tax-type.enum';

export class TaxResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID único da taxa' })
  id: string;

  @ApiProperty({ example: 'BR', description: 'Código do país (ISO)' })
  country: string;

  @ApiProperty({ enum: TaxType, example: TaxType.TRANSACTION, description: 'Tipo de taxa' })
  type: TaxType;

  @ApiProperty({ example: 5.0, description: 'Percentual da taxa' })
  percentage: number;

  @ApiProperty({ example: '2025-11-12T20:00:00.000Z', description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ example: '2025-11-12T20:00:00.000Z', description: 'Data de última atualização' })
  updatedAt: Date;

  static fromEntity(entity: TaxEntity): TaxResponseDto {
    const dto = new TaxResponseDto();
    dto.id = entity.id;
    dto.country = entity.country;
    dto.type = entity.type;
    dto.percentage = entity.percentage;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

