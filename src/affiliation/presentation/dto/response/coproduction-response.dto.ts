import { ApiProperty } from '@nestjs/swagger';
import { CoproductionEntity } from '../../../domain/entities/coproduction.entity';

export class CoproductionResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID único da coprodução' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID do produtor' })
  producerId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002', description: 'ID do coprodutor' })
  coproducerId: string;

  @ApiProperty({ example: 15.0, description: 'Percentual de comissão do coprodutor' })
  percentage: number;

  @ApiProperty({ example: '2025-11-12T20:00:00.000Z', description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ example: '2025-11-12T20:00:00.000Z', description: 'Data de última atualização' })
  updatedAt: Date;

  static fromEntity(entity: CoproductionEntity): CoproductionResponseDto {
    const dto = new CoproductionResponseDto();
    dto.id = entity.id;
    dto.producerId = entity.producerId;
    dto.coproducerId = entity.coproducerId;
    dto.percentage = entity.percentage;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

