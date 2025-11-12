import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { BalanceEntity } from '../../domain/entities/balance.entity';
import { IBalanceRepository } from '../../domain/repositories/balance.repository.interface';
import { Prisma } from '@prisma/client';

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

  async atomicUpdate(
    userId: string,
    amount: number | Prisma.Decimal,
    tx?: Prisma.TransactionClient,
  ): Promise<BalanceEntity> {
    const client = tx || this.prisma.client;

    // Usa upsert para criar se não existir, ou atualizar se existir
    // O increment é atômico no banco de dados, evitando race conditions
    const updated = await client.balance.upsert({
      where: { userId },
      create: {
        userId,
        amount: typeof amount === 'number' ? amount : amount.toNumber(),
      },
      update: {
        amount: {
          increment: typeof amount === 'number' ? amount : amount.toNumber(),
        },
      },
    });

    return BalanceEntity.fromPrisma(updated);
  }
}
