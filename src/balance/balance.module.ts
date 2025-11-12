import { Module } from '@nestjs/common';
import { BalanceController } from './presentation/controllers/balance.controller';
import { GetBalanceUseCase } from './application/use-cases/get-balance.use-case';
import { CreateOrUpdateBalanceUseCase } from './application/use-cases/create-or-update-balance.use-case';
import { PrismaBalanceRepository } from './infrastructure/repositories/prisma-balance.repository';
import { INJECTION_TOKENS } from '../shared/constants/injection-tokens';

@Module({
  controllers: [BalanceController],
  providers: [
    {
      provide: INJECTION_TOKENS.BALANCE_REPOSITORY,
      useClass: PrismaBalanceRepository,
    },
    GetBalanceUseCase,
    CreateOrUpdateBalanceUseCase,
  ],
  exports: [INJECTION_TOKENS.BALANCE_REPOSITORY],
})
export class BalanceModule {}
