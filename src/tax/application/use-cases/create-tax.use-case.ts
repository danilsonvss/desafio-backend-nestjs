import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { TaxEntity } from '../../domain/entities/tax.entity';
import { TaxType } from '../../../shared/domain/enums/tax-type.enum';
import type { ITaxRepository } from '../../domain/repositories/tax.repository.interface';

export interface CreateTaxDto {
  country: string;
  type: TaxType;
  percentage: number;
}

@Injectable()
export class CreateTaxUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.TAX_REPOSITORY)
    private readonly taxRepository: ITaxRepository,
  ) {}

  async execute(dto: CreateTaxDto): Promise<TaxEntity> {
    const exists = await this.taxRepository.existsByCountryAndType(
      dto.country,
      dto.type,
    );

    if (exists) {
      throw new ConflictException(
        `Tax already exists for country ${dto.country} and type ${dto.type}`,
      );
    }

    const tax = TaxEntity.create(dto.country, dto.type, dto.percentage);
    return await this.taxRepository.create(tax);
  }
}

