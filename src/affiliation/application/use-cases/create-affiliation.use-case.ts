import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { AffiliationEntity } from '../../domain/entities/affiliation.entity';
import type { IAffiliationRepository } from '../../domain/repositories/affiliation.repository.interface';

export interface CreateAffiliationDto {
  producerId: string;
  affiliateId: string;
  percentage: number;
}

@Injectable()
export class CreateAffiliationUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.AFFILIATION_REPOSITORY)
    private readonly affiliationRepository: IAffiliationRepository,
  ) {}

  async execute(dto: CreateAffiliationDto): Promise<AffiliationEntity> {
    const exists = await this.affiliationRepository.existsByProducerAndAffiliate(
      dto.producerId,
      dto.affiliateId,
    );

    if (exists) {
      throw new ConflictException(
        `Affiliation already exists between producer ${dto.producerId} and affiliate ${dto.affiliateId}`,
      );
    }

    const affiliation = AffiliationEntity.create(
      dto.producerId,
      dto.affiliateId,
      dto.percentage,
    );
    return await this.affiliationRepository.create(affiliation);
  }
}

