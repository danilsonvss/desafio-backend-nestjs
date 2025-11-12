import { BalanceEntity } from '../entities/balance.entity';

export interface IBalanceRepository {
  create(balance: BalanceEntity): Promise<BalanceEntity>;
  findByUserId(userId: string): Promise<BalanceEntity | null>;
  findById(id: string): Promise<BalanceEntity | null>;
  update(balance: BalanceEntity): Promise<BalanceEntity>;
  existsByUserId(userId: string): Promise<boolean>;
}

