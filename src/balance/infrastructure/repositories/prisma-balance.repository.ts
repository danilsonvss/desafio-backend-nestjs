import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { BalanceEntity } from '../../domain/entities/balance.entity';
import { IBalanceRepository } from '../../domain/repositories/balance.repository.interface';

@Injectable()
export class PrismaBalanceRepository implements IBalanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(balance: BalanceEntity): Promise<BalanceEntity> {
    const created = await this.prisma.client.balance.create({
      data: {
        id: balance.id,
        userId: balance.userId,
        amount: balance.amount,
      },
    });

    return BalanceEntity.fromPrisma(created);
  }

  async findByUserId(userId: string): Promise<BalanceEntity | null> {
    const balance = await this.prisma.client.balance.findUnique({
      where: { userId },
    });

    return balance ? BalanceEntity.fromPrisma(balance) : null;
  }

  async findById(id: string): Promise<BalanceEntity | null> {
    const balance = await this.prisma.client.balance.findUnique({
      where: { id },
    });

    return balance ? BalanceEntity.fromPrisma(balance) : null;
  }

  async update(balance: BalanceEntity): Promise<BalanceEntity> {
    const updated = await this.prisma.client.balance.update({
      where: { id: balance.id },
      data: {
        amount: balance.amount,
        updatedAt: balance.updatedAt,
      },
    });

    return BalanceEntity.fromPrisma(updated);
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.prisma.client.balance.count({
      where: { userId },
    });

    return count > 0;
  }
}
