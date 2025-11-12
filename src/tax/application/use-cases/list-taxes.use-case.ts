import { Injectable, Inject } from '@nestjs/common';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { TaxEntity } from '../../domain/entities/tax.entity';
import type { ITaxRepository } from '../../domain/repositories/tax.repository.interface';

@Injectable()
export class ListTaxesUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.TAX_REPOSITORY)
    private readonly taxRepository: ITaxRepository,
  ) {}

  async execute(country?: string): Promise<TaxEntity[]> {
    if (country) {
      return await this.taxRepository.findByCountry(country);
    }
    return await this.taxRepository.findAll();
  }
}

