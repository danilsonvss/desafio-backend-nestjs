import { Injectable, Inject } from '@nestjs/common';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { AffiliationEntity } from '../../domain/entities/affiliation.entity';
import type { IAffiliationRepository } from '../../domain/repositories/affiliation.repository.interface';

@Injectable()
export class ListAffiliationsByProducerUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.AFFILIATION_REPOSITORY)
    private readonly affiliationRepository: IAffiliationRepository,
  ) {}

  async execute(producerId: string): Promise<AffiliationEntity[]> {
    return await this.affiliationRepository.findByProducer(producerId);
  }
}

