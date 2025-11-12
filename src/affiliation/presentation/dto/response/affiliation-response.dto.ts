import { AffiliationEntity } from '../../../domain/entities/affiliation.entity';

export class AffiliationResponseDto {
  id: string;
  producerId: string;
  affiliateId: string;
  percentage: number;
  createdAt: Date;
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

