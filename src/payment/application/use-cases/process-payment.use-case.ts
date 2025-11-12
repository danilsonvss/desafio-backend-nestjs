import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { PaymentEntity } from '../../domain/entities/payment.entity';
import { BalanceEntity } from '../../../balance/domain/entities/balance.entity';
import { UserEntity } from '../../../auth/domain/entities/user.entity';
import { AffiliationEntity } from '../../../affiliation/domain/entities/affiliation.entity';
import { CoproductionEntity } from '../../../affiliation/domain/entities/coproduction.entity';
import { TaxType } from '../../../shared/domain/enums/tax-type.enum';
import { UserRole } from '../../../shared/domain/enums/user-role.enum';
import type { IPaymentRepository } from '../../domain/repositories/payment.repository.interface';
import type { ITaxRepository } from '../../../tax/domain/repositories/tax.repository.interface';
import type { IBalanceRepository } from '../../../balance/domain/repositories/balance.repository.interface';
import type { IAffiliationRepository } from '../../../affiliation/domain/repositories/affiliation.repository.interface';
import type { ICoproductionRepository } from '../../../affiliation/domain/repositories/coproduction.repository.interface';
import type { IUserRepository } from '../../../auth/domain/repositories/user.repository.interface';

export interface ProcessPaymentDto {
  amount: number;
  country: string;
  producerId: string;
  affiliateId?: string;
  coproducerId?: string;
}

@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(INJECTION_TOKENS.TAX_REPOSITORY)
    private readonly taxRepository: ITaxRepository,
    @Inject(INJECTION_TOKENS.BALANCE_REPOSITORY)
    private readonly balanceRepository: IBalanceRepository,
    @Inject(INJECTION_TOKENS.AFFILIATION_REPOSITORY)
    private readonly affiliationRepository: IAffiliationRepository,
    @Inject(INJECTION_TOKENS.COPRODUCTION_REPOSITORY)
    private readonly coproductionRepository: ICoproductionRepository,
    @Inject(INJECTION_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: ProcessPaymentDto): Promise<PaymentEntity> {
    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be positive');
    }

    const producer = await this.userRepository.findById(dto.producerId);
    if (!producer) {
      throw new NotFoundException(`Producer with id ${dto.producerId} not found`);
    }

    let affiliate: UserEntity | null = null;
    if (dto.affiliateId) {
      affiliate = await this.userRepository.findById(dto.affiliateId);
      if (!affiliate) {
        throw new NotFoundException(`Affiliate with id ${dto.affiliateId} not found`);
      }
    }

    let coproducer: UserEntity | null = null;
    if (dto.coproducerId) {
      coproducer = await this.userRepository.findById(dto.coproducerId);
      if (!coproducer) {
        throw new NotFoundException(`Coproducer with id ${dto.coproducerId} not found`);
      }
    }

    const transactionTaxEntity = await this.taxRepository.findByCountryAndType(
      dto.country,
      TaxType.TRANSACTION,
    );
    const platformTaxEntity = await this.taxRepository.findByCountryAndType(
      dto.country,
      TaxType.PLATFORM,
    );

    const transactionTax = transactionTaxEntity
      ? transactionTaxEntity.calculateTax(dto.amount)
      : 0;
    const platformTax = platformTaxEntity
      ? platformTaxEntity.calculateTax(dto.amount)
      : 0;

    const netAmount = dto.amount - transactionTax;

    let affiliation: AffiliationEntity | null = null;
    if (dto.affiliateId) {
      affiliation = await this.affiliationRepository.findByProducerAndAffiliate(
        dto.producerId,
        dto.affiliateId,
      );
    }

    let coproduction: CoproductionEntity | null = null;
    if (dto.coproducerId) {
      coproduction = await this.coproductionRepository.findByProducerAndCoproducer(
        dto.producerId,
        dto.coproducerId,
      );
    }

    const affiliateCommission = affiliation
      ? affiliation.calculateCommission(netAmount)
      : null;
    const coproducerCommission = coproduction
      ? coproduction.calculateCommission(netAmount)
      : null;

    const totalCommissions =
      (affiliateCommission || 0) + (coproducerCommission || 0);

    const platformCommission = platformTax;
    const producerCommission = netAmount - totalCommissions - platformCommission;

    if (producerCommission < 0) {
      throw new BadRequestException(
        'Total commissions exceed net amount. Please adjust commission percentages.',
      );
    }

    const payment = PaymentEntity.create(
      dto.amount,
      dto.country,
      dto.producerId,
      dto.affiliateId || null,
      dto.coproducerId || null,
      transactionTax,
      platformTax,
      producerCommission,
      affiliateCommission,
      coproducerCommission,
      platformCommission,
    );

    // Busca usuário da plataforma antes da transação (não precisa estar na transação)
    const platformUser = await this.userRepository.findByRole(UserRole.PLATFORM);

    // Usa transação para garantir atomicidade: ou tudo é commitado ou tudo é revertido
    // Isso garante que se uma atualização de saldo falhar, o pagamento também será revertido
    return await this.prisma.client.$transaction(
      async (tx) => {
        // Cria o pagamento dentro da transação
        const created = await tx.payment.create({
          data: {
            id: payment.id,
            amount: payment.amount,
            country: payment.country,
            status: payment.status,
            producerId: payment.producerId,
            affiliateId: payment.affiliateId,
            coproducerId: payment.coproducerId,
            transactionTax: payment.transactionTax,
            platformTax: payment.platformTax,
            producerCommission: payment.producerCommission,
            affiliateCommission: payment.affiliateCommission,
            coproducerCommission: payment.coproducerCommission,
            platformCommission: payment.platformCommission,
          },
        });

        // Atualiza saldos de forma atômica dentro da mesma transação
        await this.updateBalancesInTransaction(
          tx,
          dto.producerId,
          dto.affiliateId,
          dto.coproducerId,
          producerCommission,
          affiliateCommission,
          coproducerCommission,
          platformCommission,
          platformUser?.id,
        );

        return PaymentEntity.fromPrisma(created);
      },
      {
        isolationLevel: 'Serializable', // Máximo isolamento para garantir consistência
        timeout: 10000, // 10 segundos de timeout
      },
    );
  }

  /**
   * Atualiza saldos de forma atômica dentro de uma transação.
   * Usa increment atômico no banco de dados para evitar race conditions.
   */
  private async updateBalancesInTransaction(
    tx: any,
    producerId: string,
    affiliateId: string | undefined,
    coproducerId: string | undefined,
    producerCommission: number,
    affiliateCommission: number | null,
    coproducerCommission: number | null,
    platformCommission: number,
    platformUserId: string | undefined,
  ): Promise<void> {
    // Atualização atômica do produtor usando increment no banco
    await this.balanceRepository.atomicUpdate(producerId, producerCommission, tx);

    if (affiliateId && affiliateCommission) {
      await this.balanceRepository.atomicUpdate(affiliateId, affiliateCommission, tx);
    }

    if (coproducerId && coproducerCommission) {
      await this.balanceRepository.atomicUpdate(coproducerId, coproducerCommission, tx);
    }

    if (platformUserId && platformCommission > 0) {
      await this.balanceRepository.atomicUpdate(platformUserId, platformCommission, tx);
    }
  }
}

