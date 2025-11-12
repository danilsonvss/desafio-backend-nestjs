import { ApiProperty } from '@nestjs/swagger';
import { AffiliationEntity } from '../../../domain/entities/affiliation.entity';

export class AffiliationResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID único da afiliação' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID do produtor' })
  producerId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'ID do afiliado' })
  affiliateId: string;

  @ApiProperty({ example: 10.0, description: 'Percentual de comissão do afiliado' })
  percentage: number;

  @ApiProperty({ example: '2025-11-12T20:00:00.000Z', description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ example: '2025-11-12T20:00:00.000Z', description: 'Data de última atualização' })
  updatedAt: Date;

  static fromEntity(entity: AffiliationEntity): AffiliationResponseDto {
    const dto = new AffiliationResponseDto();
    dto.id = entity.id;
    dto.producerId = entity.producerId;
    dto.affiliateId = entity.affiliateId;
    dto.percentage = entity.percentage;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

