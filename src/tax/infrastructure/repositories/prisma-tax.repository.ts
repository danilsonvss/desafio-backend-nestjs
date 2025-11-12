import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { TaxEntity } from '../../domain/entities/tax.entity';
import { TaxType } from '../../../shared/domain/enums/tax-type.enum';
import { ITaxRepository } from '../../domain/repositories/tax.repository.interface';

@Injectable()
export class PrismaTaxRepository implements ITaxRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(tax: TaxEntity): Promise<TaxEntity> {
    const created = await this.prisma.client.tax.create({
      data: {
        id: tax.id,
        country: tax.country,
        type: tax.type,
        percentage: tax.percentage,
      },
    });

    return TaxEntity.fromPrisma(created);
  }

  async findByCountryAndType(
    country: string,
    type: TaxType,
  ): Promise<TaxEntity | null> {
    const tax = await this.prisma.client.tax.findUnique({
      where: {
        country_type: {
          country: country.toUpperCase(),
          type: type,
        },
      },
    });

    return tax ? TaxEntity.fromPrisma(tax) : null;
  }

  async findById(id: string): Promise<TaxEntity | null> {
    const tax = await this.prisma.client.tax.findUnique({
      where: { id },
    });

    return tax ? TaxEntity.fromPrisma(tax) : null;
  }

  async findAll(): Promise<TaxEntity[]> {
    const taxes = await this.prisma.client.tax.findMany({
      orderBy: [{ country: 'asc' }, { type: 'asc' }],
    });

    return taxes.map((tax) => TaxEntity.fromPrisma(tax));
  }

  async findByCountry(country: string): Promise<TaxEntity[]> {
    const taxes = await this.prisma.client.tax.findMany({
      where: { country: country.toUpperCase() },
      orderBy: { type: 'asc' },
    });

    return taxes.map((tax) => TaxEntity.fromPrisma(tax));
  }

  async update(tax: TaxEntity): Promise<TaxEntity> {
    const updated = await this.prisma.client.tax.update({
      where: { id: tax.id },
      data: {
        percentage: tax.percentage,
        updatedAt: tax.updatedAt,
      },
    });

    return TaxEntity.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.client.tax.delete({
      where: { id },
    });
  }

  async existsByCountryAndType(
    country: string,
    type: TaxType,
  ): Promise<boolean> {
    const count = await this.prisma.client.tax.count({
      where: {
        country: country.toUpperCase(),
        type: type,
      },
    });

    return count > 0;
  }
}

