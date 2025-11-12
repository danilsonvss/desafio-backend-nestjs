import { CoproductionEntity } from '../../../domain/entities/coproduction.entity';

export class CoproductionResponseDto {
  id: string;
  producerId: string;
  coproducerId: string;
  percentage: number;
  createdAt: Date;
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

