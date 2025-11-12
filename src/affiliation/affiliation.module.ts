import { Module } from '@nestjs/common';
import { AffiliationController } from './presentation/controllers/affiliation.controller';
import { CoproductionController } from './presentation/controllers/coproduction.controller';
import { CreateAffiliationUseCase } from './application/use-cases/create-affiliation.use-case';
import { CreateCoproductionUseCase } from './application/use-cases/create-coproduction.use-case';
import { ListAffiliationsByProducerUseCase } from './application/use-cases/list-affiliations-by-producer.use-case';
import { ListCoproductionsByProducerUseCase } from './application/use-cases/list-coproductions-by-producer.use-case';
import { PrismaAffiliationRepository } from './infrastructure/repositories/prisma-affiliation.repository';
import { PrismaCoproductionRepository } from './infrastructure/repositories/prisma-coproduction.repository';
import { INJECTION_TOKENS } from '../shared/constants/injection-tokens';

@Module({
  controllers: [AffiliationController, CoproductionController],
  providers: [
    {
      provide: INJECTION_TOKENS.AFFILIATION_REPOSITORY,
      useClass: PrismaAffiliationRepository,
    },
    {
      provide: INJECTION_TOKENS.COPRODUCTION_REPOSITORY,
      useClass: PrismaCoproductionRepository,
    },
    CreateAffiliationUseCase,
    CreateCoproductionUseCase,
    ListAffiliationsByProducerUseCase,
    ListCoproductionsByProducerUseCase,
  ],
  exports: [
    INJECTION_TOKENS.AFFILIATION_REPOSITORY,
    INJECTION_TOKENS.COPRODUCTION_REPOSITORY,
  ],
})
export class AffiliationModule {}

