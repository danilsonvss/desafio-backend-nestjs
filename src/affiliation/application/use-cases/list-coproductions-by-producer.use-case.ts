import { Injectable, Inject } from '@nestjs/common';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { CoproductionEntity } from '../../domain/entities/coproduction.entity';
import type { ICoproductionRepository } from '../../domain/repositories/coproduction.repository.interface';

@Injectable()
export class ListCoproductionsByProducerUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.COPRODUCTION_REPOSITORY)
    private readonly coproductionRepository: ICoproductionRepository,
  ) {}

  async execute(producerId: string): Promise<CoproductionEntity[]> {
    return await this.coproductionRepository.findByProducer(producerId);
  }
}

