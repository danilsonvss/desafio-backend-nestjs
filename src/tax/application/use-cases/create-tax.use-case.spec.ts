import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateTaxUseCase } from './create-tax.use-case';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { ITaxRepository } from '../../domain/repositories/tax.repository.interface';
import { TaxEntity } from '../../domain/entities/tax.entity';
import { TaxType } from '../../../shared/domain/enums/tax-type.enum';

describe('CreateTaxUseCase', () => {
  let useCase: CreateTaxUseCase;
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
        CreateTaxUseCase,
        {
          provide: INJECTION_TOKENS.TAX_REPOSITORY,
          useValue: mockTaxRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateTaxUseCase>(CreateTaxUseCase);
    taxRepository = module.get(INJECTION_TOKENS.TAX_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create a new tax', async () => {
      const dto = {
        country: 'BR',
        type: TaxType.TRANSACTION,
        percentage: 5.5,
      };

      taxRepository.existsByCountryAndType.mockResolvedValue(false);
      const tax = TaxEntity.create(dto.country, dto.type, dto.percentage);
      taxRepository.create.mockResolvedValue(tax);

      const result = await useCase.execute(dto);

      expect(taxRepository.existsByCountryAndType).toHaveBeenCalledWith(
        'BR',
        TaxType.TRANSACTION,
      );
      expect(taxRepository.create).toHaveBeenCalled();
      expect(result).toBeInstanceOf(TaxEntity);
      expect(result.country).toBe('BR');
      expect(result.percentage).toBe(5.5);
    });

    it('should throw ConflictException when tax already exists', async () => {
      const dto = {
        country: 'BR',
        type: TaxType.TRANSACTION,
        percentage: 5.5,
      };

      taxRepository.existsByCountryAndType.mockResolvedValue(true);

      await expect(useCase.execute(dto)).rejects.toThrow(ConflictException);
      await expect(useCase.execute(dto)).rejects.toThrow(
        'Tax already exists for country BR and type TRANSACTION',
      );
      expect(taxRepository.create).not.toHaveBeenCalled();
    });
  });
});

