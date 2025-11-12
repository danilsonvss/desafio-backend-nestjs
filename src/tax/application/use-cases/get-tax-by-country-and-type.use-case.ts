import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { TaxEntity } from '../../domain/entities/tax.entity';
import { TaxType } from '../../../shared/domain/enums/tax-type.enum';
import type { ITaxRepository } from '../../domain/repositories/tax.repository.interface';

@Injectable()
export class GetTaxByCountryAndTypeUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.TAX_REPOSITORY)
    private readonly taxRepository: ITaxRepository,
  ) {}

  async execute(country: string, type: TaxType): Promise<TaxEntity> {
    const tax = await this.taxRepository.findByCountryAndType(country, type);

    if (!tax) {
      throw new NotFoundException(
        `Tax not found for country ${country} and type ${type}`,
      );
    }

    return tax;
  }
}

