import { TaxEntity } from '../../../domain/entities/tax.entity';
import { TaxType } from '../../../../shared/domain/enums/tax-type.enum';

export class TaxResponseDto {
  id: string;
  country: string;
  type: TaxType;
  percentage: number;
  createdAt: Date;
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

