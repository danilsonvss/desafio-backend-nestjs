import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { AffiliationEntity } from '../../domain/entities/affiliation.entity';
import { IAffiliationRepository } from '../../domain/repositories/affiliation.repository.interface';

@Injectable()
export class PrismaAffiliationRepository implements IAffiliationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(affiliation: AffiliationEntity): Promise<AffiliationEntity> {
    const created = await this.prisma.client.affiliation.create({
      data: {
        id: affiliation.id,
        producerId: affiliation.producerId,
        affiliateId: affiliation.affiliateId,
        percentage: affiliation.percentage,
      },
    });

    return AffiliationEntity.fromPrisma(created);
  }

  async findByProducerAndAffiliate(
    producerId: string,
    affiliateId: string,
  ): Promise<AffiliationEntity | null> {
    const affiliation = await this.prisma.client.affiliation.findUnique({
      where: {
        producerId_affiliateId: {
          producerId,
          affiliateId,
        },
      },
    });

    return affiliation ? AffiliationEntity.fromPrisma(affiliation) : null;
  }

  async findById(id: string): Promise<AffiliationEntity | null> {
    const affiliation = await this.prisma.client.affiliation.findUnique({
      where: { id },
    });

    return affiliation ? AffiliationEntity.fromPrisma(affiliation) : null;
  }

  async findByProducer(producerId: string): Promise<AffiliationEntity[]> {
    const affiliations = await this.prisma.client.affiliation.findMany({
      where: { producerId },
      orderBy: { createdAt: 'desc' },
    });

    return affiliations.map((affiliation) => AffiliationEntity.fromPrisma(affiliation));
  }

  async findByAffiliate(affiliateId: string): Promise<AffiliationEntity[]> {
    const affiliations = await this.prisma.client.affiliation.findMany({
      where: { affiliateId },
      orderBy: { createdAt: 'desc' },
    });

    return affiliations.map((affiliation) => AffiliationEntity.fromPrisma(affiliation));
  }

  async update(affiliation: AffiliationEntity): Promise<AffiliationEntity> {
    const updated = await this.prisma.client.affiliation.update({
      where: { id: affiliation.id },
      data: {
        percentage: affiliation.percentage,
        updatedAt: affiliation.updatedAt,
      },
    });

    return AffiliationEntity.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.client.affiliation.delete({
      where: { id },
    });
  }

  async existsByProducerAndAffiliate(
    producerId: string,
    affiliateId: string,
  ): Promise<boolean> {
    const count = await this.prisma.client.affiliation.count({
      where: {
        producerId,
        affiliateId,
      },
    });

    return count > 0;
  }
}

