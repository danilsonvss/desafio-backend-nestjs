import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateTaxUseCase } from './update-tax.use-case';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { ITaxRepository } from '../../domain/repositories/tax.repository.interface';
import { TaxEntity } from '../../domain/entities/tax.entity';
import { TaxType } from '../../../shared/domain/enums/tax-type.enum';

describe('UpdateTaxUseCase', () => {
  let useCase: UpdateTaxUseCase;
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
        UpdateTaxUseCase,
        {
          provide: INJECTION_TOKENS.TAX_REPOSITORY,
          useValue: mockTaxRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateTaxUseCase>(UpdateTaxUseCase);
    taxRepository = module.get(INJECTION_TOKENS.TAX_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should update tax percentage', async () => {
      const existingTax = TaxEntity.create('BR', TaxType.TRANSACTION, 5.0);
      const dto = { id: existingTax.id, percentage: 7.5 };

      taxRepository.findById.mockResolvedValue(existingTax);
      const updatedTax = existingTax.updatePercentage(7.5);
      taxRepository.update.mockResolvedValue(updatedTax);

      const result = await useCase.execute(dto);

      expect(taxRepository.findById).toHaveBeenCalledWith(existingTax.id);
      expect(taxRepository.update).toHaveBeenCalled();
      expect(result.percentage).toBe(7.5);
    });

    it('should throw NotFoundException when tax does not exist', async () => {
      const dto = { id: 'nonexistent-id', percentage: 7.5 };

      taxRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(dto)).rejects.toThrow(
        'Tax with id nonexistent-id not found',
      );
      expect(taxRepository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid percentage', async () => {
      const existingTax = TaxEntity.create('BR', TaxType.TRANSACTION, 5.0);
      const dto = { id: existingTax.id, percentage: 101 };

      taxRepository.findById.mockResolvedValue(existingTax);

      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(dto)).rejects.toThrow(
        'Percentage must be between 0 and 100',
      );
    });
  });
});

