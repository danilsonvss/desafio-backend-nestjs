import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetTaxByCountryAndTypeUseCase } from './get-tax-by-country-and-type.use-case';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { ITaxRepository } from '../../domain/repositories/tax.repository.interface';
import { TaxEntity } from '../../domain/entities/tax.entity';
import { TaxType } from '../../../shared/domain/enums/tax-type.enum';

describe('GetTaxByCountryAndTypeUseCase', () => {
  let useCase: GetTaxByCountryAndTypeUseCase;
  let taxRepository: jest.Mocked<ITaxRepository>;

  beforeEach(async () => {
    const mockTaxRepository = {
      create: jest.fn(),
      findByCountryAndType: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByCountry: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByCountryAndType: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTaxByCountryAndTypeUseCase,
        {
          provide: INJECTION_TOKENS.TAX_REPOSITORY,
          useValue: mockTaxRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetTaxByCountryAndTypeUseCase>(
      GetTaxByCountryAndTypeUseCase,
    );
    taxRepository = module.get(INJECTION_TOKENS.TAX_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return tax for existing country and type', async () => {
      const tax = TaxEntity.create('BR', TaxType.TRANSACTION, 5.5);
      taxRepository.findByCountryAndType.mockResolvedValue(tax);

      const result = await useCase.execute('BR', TaxType.TRANSACTION);

      expect(taxRepository.findByCountryAndType).toHaveBeenCalledWith(
        'BR',
        TaxType.TRANSACTION,
      );
      expect(result).toBe(tax);
      expect(result.country).toBe('BR');
      expect(result.type).toBe(TaxType.TRANSACTION);
    });

    it('should throw NotFoundException when tax does not exist', async () => {
      taxRepository.findByCountryAndType.mockResolvedValue(null);

      await expect(
        useCase.execute('US', TaxType.PLATFORM),
      ).rejects.toThrow(NotFoundException);
      await expect(
        useCase.execute('US', TaxType.PLATFORM),
      ).rejects.toThrow('Tax not found for country US and type PLATFORM');
    });
  });
});

