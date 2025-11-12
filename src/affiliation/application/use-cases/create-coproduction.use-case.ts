import { Injectable, Inject, ConflictException, BadRequestException } from '@nestjs/common';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { CoproductionEntity } from '../../domain/entities/coproduction.entity';
import type { ICoproductionRepository } from '../../domain/repositories/coproduction.repository.interface';

export interface CreateCoproductionDto {
  producerId: string;
  coproducerId: string;
  percentage: number;
}

@Injectable()
export class CreateCoproductionUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.COPRODUCTION_REPOSITORY)
    private readonly coproductionRepository: ICoproductionRepository,
  ) {}

  async execute(dto: CreateCoproductionDto): Promise<CoproductionEntity> {
    if (dto.producerId === dto.coproducerId) {
      throw new BadRequestException('Producer and coproducer cannot be the same user');
    }

    const exists = await this.coproductionRepository.existsByProducerAndCoproducer(
      dto.producerId,
      dto.coproducerId,
    );

    if (exists) {
      throw new ConflictException(
        `Coproduction already exists between producer ${dto.producerId} and coproducer ${dto.coproducerId}`,
      );
    }

    const coproduction = CoproductionEntity.create(
      dto.producerId,
      dto.coproducerId,
      dto.percentage,
    );
    return await this.coproductionRepository.create(coproduction);
  }
}

