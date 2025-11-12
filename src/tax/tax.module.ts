import { Module } from '@nestjs/common';
import { TaxController } from './presentation/controllers/tax.controller';
import { GetTaxByCountryAndTypeUseCase } from './application/use-cases/get-tax-by-country-and-type.use-case';
import { CreateTaxUseCase } from './application/use-cases/create-tax.use-case';
import { UpdateTaxUseCase } from './application/use-cases/update-tax.use-case';
import { ListTaxesUseCase } from './application/use-cases/list-taxes.use-case';
import { PrismaTaxRepository } from './infrastructure/repositories/prisma-tax.repository';
import { INJECTION_TOKENS } from '../shared/constants/injection-tokens';

@Module({
  controllers: [TaxController],
  providers: [
    {
      provide: INJECTION_TOKENS.TAX_REPOSITORY,
      useClass: PrismaTaxRepository,
    },
    GetTaxByCountryAndTypeUseCase,
    CreateTaxUseCase,
    UpdateTaxUseCase,
    ListTaxesUseCase,
  ],
  exports: [INJECTION_TOKENS.TAX_REPOSITORY],
})
export class TaxModule {}

