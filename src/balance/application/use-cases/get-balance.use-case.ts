import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { BalanceEntity } from '../../domain/entities/balance.entity';
import type { IBalanceRepository } from '../../domain/repositories/balance.repository.interface';

@Injectable()
export class GetBalanceUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.BALANCE_REPOSITORY)
    private readonly balanceRepository: IBalanceRepository,
  ) {}

  async execute(userId: string): Promise<BalanceEntity> {
    const balance = await this.balanceRepository.findByUserId(userId);

    if (!balance) {
      throw new NotFoundException(`Balance not found for user ${userId}`);
    }

    return balance;
  }
}
