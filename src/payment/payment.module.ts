import { Module } from '@nestjs/common';
import { PaymentController } from './presentation/controllers/payment.controller';
import { ProcessPaymentUseCase } from './application/use-cases/process-payment.use-case';
import { PrismaPaymentRepository } from './infrastructure/repositories/prisma-payment.repository';
import { INJECTION_TOKENS } from '../shared/constants/injection-tokens';
import { TaxModule } from '../tax/tax.module';
import { BalanceModule } from '../balance/balance.module';
import { AffiliationModule } from '../affiliation/affiliation.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TaxModule, BalanceModule, AffiliationModule, AuthModule],
  controllers: [PaymentController],
  providers: [
    {
      provide: INJECTION_TOKENS.PAYMENT_REPOSITORY,
      useClass: PrismaPaymentRepository,
    },
    ProcessPaymentUseCase,
  ],
  exports: [INJECTION_TOKENS.PAYMENT_REPOSITORY],
})
export class PaymentModule {}

