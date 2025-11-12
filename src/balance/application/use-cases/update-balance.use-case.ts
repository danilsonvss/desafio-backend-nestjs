import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { BalanceEntity } from '../../domain/entities/balance.entity';
import type { IBalanceRepository } from '../../domain/repositories/balance.repository.interface';

export enum BalanceOperationType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export interface UpdateBalanceDto {
  userId: string;
  amount: number;
  operation: BalanceOperationType;
}

@Injectable()
export class UpdateBalanceUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.BALANCE_REPOSITORY)
    private readonly balanceRepository: IBalanceRepository,
  ) {}

  async execute(dto: UpdateBalanceDto): Promise<BalanceEntity> {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    let balance = await this.balanceRepository.findByUserId(dto.userId);

    if (!balance) {
      balance = BalanceEntity.create(dto.userId);
      balance = await this.balanceRepository.create(balance);
    }

    try {
      const updatedBalance =
        dto.operation === BalanceOperationType.CREDIT
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

  async credit(userId: string, amount: number): Promise<BalanceEntity> {
    return this.execute({
      userId,
      amount,
      operation: BalanceOperationType.CREDIT,
    });
  }

  async debit(userId: string, amount: number): Promise<BalanceEntity> {
    return this.execute({
      userId,
      amount,
      operation: BalanceOperationType.DEBIT,
    });
  }
}

