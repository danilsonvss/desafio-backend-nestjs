import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { TaxEntity } from '../../domain/entities/tax.entity';
import type { ITaxRepository } from '../../domain/repositories/tax.repository.interface';

export interface UpdateTaxDto {
  id: string;
  percentage: number;
}

@Injectable()
export class UpdateTaxUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.TAX_REPOSITORY)
    private readonly taxRepository: ITaxRepository,
  ) {}

  async execute(dto: UpdateTaxDto): Promise<TaxEntity> {
    const tax = await this.taxRepository.findById(dto.id);

    if (!tax) {
      throw new NotFoundException(`Tax with id ${dto.id} not found`);
    }

    try {
      const updatedTax = tax.updatePercentage(dto.percentage);
      return await this.taxRepository.update(updatedTax);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}

