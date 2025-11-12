import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { CoproductionEntity } from '../../domain/entities/coproduction.entity';
import { ICoproductionRepository } from '../../domain/repositories/coproduction.repository.interface';

@Injectable()
export class PrismaCoproductionRepository implements ICoproductionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(coproduction: CoproductionEntity): Promise<CoproductionEntity> {
    const created = await this.prisma.client.coproduction.create({
      data: {
        id: coproduction.id,
        producerId: coproduction.producerId,
        coproducerId: coproduction.coproducerId,
        percentage: coproduction.percentage,
      },
    });

    return CoproductionEntity.fromPrisma(created);
  }

  async findByProducerAndCoproducer(
    producerId: string,
    coproducerId: string,
  ): Promise<CoproductionEntity | null> {
    const coproduction = await this.prisma.client.coproduction.findUnique({
      where: {
        producerId_coproducerId: {
          producerId,
          coproducerId,
        },
      },
    });

    return coproduction ? CoproductionEntity.fromPrisma(coproduction) : null;
  }

  async findById(id: string): Promise<CoproductionEntity | null> {
    const coproduction = await this.prisma.client.coproduction.findUnique({
      where: { id },
    });

    return coproduction ? CoproductionEntity.fromPrisma(coproduction) : null;
  }

  async findByProducer(producerId: string): Promise<CoproductionEntity[]> {
    const coproductions = await this.prisma.client.coproduction.findMany({
      where: { producerId },
      orderBy: { createdAt: 'desc' },
    });

    return coproductions.map((coproduction) => CoproductionEntity.fromPrisma(coproduction));
  }

  async findByCoproducer(coproducerId: string): Promise<CoproductionEntity[]> {
    const coproductions = await this.prisma.client.coproduction.findMany({
      where: { coproducerId },
      orderBy: { createdAt: 'desc' },
    });

    return coproductions.map((coproduction) => CoproductionEntity.fromPrisma(coproduction));
  }

  async update(coproduction: CoproductionEntity): Promise<CoproductionEntity> {
    const updated = await this.prisma.client.coproduction.update({
      where: { id: coproduction.id },
      data: {
        percentage: coproduction.percentage,
        updatedAt: coproduction.updatedAt,
      },
    });

    return CoproductionEntity.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.client.coproduction.delete({
      where: { id },
    });
  }

  async existsByProducerAndCoproducer(
    producerId: string,
    coproducerId: string,
  ): Promise<boolean> {
    const count = await this.prisma.client.coproduction.count({
      where: {
        producerId,
        coproducerId,
      },
    });

    return count > 0;
  }
}

