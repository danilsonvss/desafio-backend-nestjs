import { Test, TestingModule } from '@nestjs/testing';
import { ListTaxesUseCase } from './list-taxes.use-case';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { ITaxRepository } from '../../domain/repositories/tax.repository.interface';
import { TaxEntity } from '../../domain/entities/tax.entity';
import { TaxType } from '../../../shared/domain/enums/tax-type.enum';

describe('ListTaxesUseCase', () => {
  let useCase: ListTaxesUseCase;
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
        ListTaxesUseCase,
        {
          provide: INJECTION_TOKENS.TAX_REPOSITORY,
          useValue: mockTaxRepository,
        },
      ],
    }).compile();

    useCase = module.get<ListTaxesUseCase>(ListTaxesUseCase);
    taxRepository = module.get(INJECTION_TOKENS.TAX_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return all taxes when country is not provided', async () => {
      const taxes = [
        TaxEntity.create('BR', TaxType.TRANSACTION, 5.5),
        TaxEntity.create('US', TaxType.PLATFORM, 3.0),
      ];

      taxRepository.findAll.mockResolvedValue(taxes);

      const result = await useCase.execute();

      expect(taxRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result).toEqual(taxes);
    });

    it('should return taxes by country when country is provided', async () => {
      const taxes = [
        TaxEntity.create('BR', TaxType.TRANSACTION, 5.5),
        TaxEntity.create('BR', TaxType.PLATFORM, 2.0),
      ];

      taxRepository.findByCountry.mockResolvedValue(taxes);

      const result = await useCase.execute('BR');

      expect(taxRepository.findByCountry).toHaveBeenCalledWith('BR');
      expect(taxRepository.findAll).not.toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result).toEqual(taxes);
    });
  });
});

