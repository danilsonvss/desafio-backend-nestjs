import { Test, TestingModule } from '@nestjs/testing';
import { TaxController } from './tax.controller';
import { GetTaxByCountryAndTypeUseCase } from '../../application/use-cases/get-tax-by-country-and-type.use-case';
import { CreateTaxUseCase } from '../../application/use-cases/create-tax.use-case';
import { UpdateTaxUseCase } from '../../application/use-cases/update-tax.use-case';
import { ListTaxesUseCase } from '../../application/use-cases/list-taxes.use-case';
import { TaxEntity } from '../../domain/entities/tax.entity';
import { TaxType } from '../../../shared/domain/enums/tax-type.enum';

describe('TaxController', () => {
  let controller: TaxController;
  let getTaxByCountryAndTypeUseCase: jest.Mocked<GetTaxByCountryAndTypeUseCase>;
  let createTaxUseCase: jest.Mocked<CreateTaxUseCase>;
  let updateTaxUseCase: jest.Mocked<UpdateTaxUseCase>;
  let listTaxesUseCase: jest.Mocked<ListTaxesUseCase>;

  beforeEach(async () => {
    getTaxByCountryAndTypeUseCase = {
      execute: jest.fn(),
    } as any;

    createTaxUseCase = {
      execute: jest.fn(),
    } as any;

    updateTaxUseCase = {
      execute: jest.fn(),
    } as any;

    listTaxesUseCase = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxController],
      providers: [
        {
          provide: GetTaxByCountryAndTypeUseCase,
          useValue: getTaxByCountryAndTypeUseCase,
        },
        {
          provide: CreateTaxUseCase,
          useValue: createTaxUseCase,
        },
        {
          provide: UpdateTaxUseCase,
          useValue: updateTaxUseCase,
        },
        {
          provide: ListTaxesUseCase,
          useValue: listTaxesUseCase,
        },
      ],
    }).compile();

    controller = module.get<TaxController>(TaxController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listTaxes', () => {
    it('should return all taxes when country is not provided', async () => {
      const taxes = [
        TaxEntity.create('BR', TaxType.TRANSACTION, 5.5),
        TaxEntity.create('US', TaxType.PLATFORM, 3.0),
      ];

      listTaxesUseCase.execute.mockResolvedValue(taxes);

      const result = await controller.listTaxes();

      expect(listTaxesUseCase.execute).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('country', 'BR');
    });

    it('should return taxes by country when country is provided', async () => {
      const taxes = [TaxEntity.create('BR', TaxType.TRANSACTION, 5.5)];

      listTaxesUseCase.execute.mockResolvedValue(taxes);

      const result = await controller.listTaxes('BR');

      expect(listTaxesUseCase.execute).toHaveBeenCalledWith('BR');
      expect(result).toHaveLength(1);
    });
  });

  describe('getTaxByCountryAndType', () => {
    it('should return tax by country and type', async () => {
      const tax = TaxEntity.create('BR', TaxType.TRANSACTION, 5.5);
      getTaxByCountryAndTypeUseCase.execute.mockResolvedValue(tax);

      const result = await controller.getTaxByCountryAndType('BR', TaxType.TRANSACTION);

      expect(getTaxByCountryAndTypeUseCase.execute).toHaveBeenCalledWith(
        'BR',
        TaxType.TRANSACTION,
      );
      expect(result).toHaveProperty('country', 'BR');
      expect(result).toHaveProperty('type', TaxType.TRANSACTION);
    });
  });

  describe('createTax', () => {
    it('should create a new tax', async () => {
      const dto = {
        country: 'BR',
        type: TaxType.TRANSACTION,
        percentage: 5.5,
      };

      const tax = TaxEntity.create(dto.country, dto.type, dto.percentage);
      createTaxUseCase.execute.mockResolvedValue(tax);

      const result = await controller.createTax(dto);

      expect(createTaxUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('country', 'BR');
      expect(result).toHaveProperty('percentage', 5.5);
    });
  });

  describe('updateTax', () => {
    it('should update tax percentage', async () => {
      const dto = { id: 'tax-id', percentage: 7.5 };
      const existingTax = TaxEntity.create('BR', TaxType.TRANSACTION, 5.0);
      const updatedTax = existingTax.updatePercentage(7.5);

      updateTaxUseCase.execute.mockResolvedValue(updatedTax);

      const result = await controller.updateTax(dto);

      expect(updateTaxUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result.percentage).toBe(7.5);
    });
  });
});

