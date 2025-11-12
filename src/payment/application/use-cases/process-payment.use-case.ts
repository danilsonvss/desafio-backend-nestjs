import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { PaymentEntity } from '../../domain/entities/payment.entity';
import { BalanceEntity } from '../../../balance/domain/entities/balance.entity';
import { TaxType } from '../../../shared/domain/enums/tax-type.enum';
import { UserRole } from '../../../shared/domain/enums/user-role.enum';
import type { IPaymentRepository } from '../../domain/repositories/payment.repository.interface';
import type { ITaxRepository } from '../../tax/domain/repositories/tax.repository.interface';
import type { IBalanceRepository } from '../../balance/domain/repositories/balance.repository.interface';
import type { IAffiliationRepository } from '../../affiliation/domain/repositories/affiliation.repository.interface';
import type { ICoproductionRepository } from '../../affiliation/domain/repositories/coproduction.repository.interface';
import type { IUserRepository } from '../../auth/domain/repositories/user.repository.interface';

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
  ) {}

  async execute(dto: ProcessPaymentDto): Promise<PaymentEntity> {
    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be positive');
    }

    const producer = await this.userRepository.findById(dto.producerId);
    if (!producer) {
      throw new NotFoundException(`Producer with id ${dto.producerId} not found`);
    }

    let affiliate = null;
    if (dto.affiliateId) {
      affiliate = await this.userRepository.findById(dto.affiliateId);
      if (!affiliate) {
        throw new NotFoundException(`Affiliate with id ${dto.affiliateId} not found`);
      }
    }

    let coproducer = null;
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

    let affiliation = null;
    if (dto.affiliateId) {
      affiliation = await this.affiliationRepository.findByProducerAndAffiliate(
        dto.producerId,
        dto.affiliateId,
      );
    }

    let coproduction = null;
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

    const createdPayment = await this.paymentRepository.create(payment);

    await this.updateBalances(
      dto.producerId,
      dto.affiliateId,
      dto.coproducerId,
      producerCommission,
      affiliateCommission,
      coproducerCommission,
      platformCommission,
    );

    return createdPayment;
  }

  private async updateBalances(
    producerId: string,
    affiliateId: string | undefined,
    coproducerId: string | undefined,
    producerCommission: number,
    affiliateCommission: number | null,
    coproducerCommission: number | null,
    platformCommission: number,
  ): Promise<void> {
    let producerBalance = await this.balanceRepository.findByUserId(producerId);
    if (!producerBalance) {
      producerBalance = await this.balanceRepository.create(
        BalanceEntity.create(producerId),
      );
    }
    producerBalance = producerBalance.credit(producerCommission);
    await this.balanceRepository.update(producerBalance);

    if (affiliateId && affiliateCommission) {
      let affiliateBalance = await this.balanceRepository.findByUserId(affiliateId);
      if (!affiliateBalance) {
        affiliateBalance = await this.balanceRepository.create(
          BalanceEntity.create(affiliateId),
        );
      }
      affiliateBalance = affiliateBalance.credit(affiliateCommission);
      await this.balanceRepository.update(affiliateBalance);
    }

    if (coproducerId && coproducerCommission) {
      let coproducerBalance = await this.balanceRepository.findByUserId(coproducerId);
      if (!coproducerBalance) {
        coproducerBalance = await this.balanceRepository.create(
          BalanceEntity.create(coproducerId),
        );
      }
      coproducerBalance = coproducerBalance.credit(coproducerCommission);
      await this.balanceRepository.update(coproducerBalance);
    }

    const platformUser = await this.userRepository.findByRole(UserRole.PLATFORM);
    if (platformUser && platformCommission > 0) {
      let platformBalance = await this.balanceRepository.findByUserId(platformUser.id);
      if (!platformBalance) {
        platformBalance = await this.balanceRepository.create(
          BalanceEntity.create(platformUser.id),
        );
      }
      platformBalance = platformBalance.credit(platformCommission);
      await this.balanceRepository.update(platformBalance);
    }
  }
}

