import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { BalanceEntity } from '../../domain/entities/balance.entity';
import type { IBalanceRepository } from '../../domain/repositories/balance.repository.interface';

export interface CreateOrUpdateBalanceDto {
  userId: string;
  amount: number;
  operation: 'credit' | 'debit';
}

@Injectable()
export class CreateOrUpdateBalanceUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.BALANCE_REPOSITORY)
    private readonly balanceRepository: IBalanceRepository,
  ) {}

  async execute(dto: CreateOrUpdateBalanceDto): Promise<BalanceEntity> {
    let balance = await this.balanceRepository.findByUserId(dto.userId);

    if (!balance) {
      balance = BalanceEntity.create(dto.userId);
      balance = await this.balanceRepository.create(balance);
    }

    try {
      const updatedBalance =
        dto.operation === 'credit'
          ? balance.credit(dto.amount)
          : balance.debit(dto.amount);

      return await this.balanceRepository.update(updatedBalance);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}

