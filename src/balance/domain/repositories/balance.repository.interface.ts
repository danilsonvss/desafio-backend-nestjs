import { BalanceEntity } from '../entities/balance.entity';
import { Prisma } from '@prisma/client';

export interface IBalanceRepository {
  create(balance: BalanceEntity): Promise<BalanceEntity>;
  findByUserId(userId: string, tx?: Prisma.TransactionClient): Promise<BalanceEntity | null>;
  findById(id: string): Promise<BalanceEntity | null>;
  update(balance: BalanceEntity): Promise<BalanceEntity>;
  existsByUserId(userId: string): Promise<boolean>;
  /**
   * Atualiza o saldo de forma atômica usando increment/decrement no banco de dados.
   * Evita race conditions e garante precisão numérica.
   * @param userId ID do usuário
   * @param amount Valor a ser creditado (positivo) ou debitado (negativo)
   * @param tx Transação opcional do Prisma para uso em transações maiores
   */
  atomicUpdate(
    userId: string,
    amount: number | Prisma.Decimal,
    tx?: Prisma.TransactionClient,
  ): Promise<BalanceEntity>;
}

