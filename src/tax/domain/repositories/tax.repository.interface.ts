import { TaxEntity } from '../entities/tax.entity';
import { TaxType } from '../../../shared/domain/enums/tax-type.enum';

export interface ITaxRepository {
  create(tax: TaxEntity): Promise<TaxEntity>;
  findByCountryAndType(country: string, type: TaxType): Promise<TaxEntity | null>;
  findById(id: string): Promise<TaxEntity | null>;
  findAll(): Promise<TaxEntity[]>;
  findByCountry(country: string): Promise<TaxEntity[]>;
  update(tax: TaxEntity): Promise<TaxEntity>;
  delete(id: string): Promise<void>;
  existsByCountryAndType(country: string, type: TaxType): Promise<boolean>;
}

