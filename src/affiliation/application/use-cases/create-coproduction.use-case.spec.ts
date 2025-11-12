import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateCoproductionUseCase } from './create-coproduction.use-case';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { ICoproductionRepository } from '../../domain/repositories/coproduction.repository.interface';
import { CoproductionEntity } from '../../domain/entities/coproduction.entity';

describe('CreateCoproductionUseCase', () => {
  let useCase: CreateCoproductionUseCase;
  let coproductionRepository: jest.Mocked<ICoproductionRepository>;

  beforeEach(async () => {
    const mockCoproductionRepository = {
      create: jest.fn(),
      findByProducerAndCoproducer: jest.fn(),
      findById: jest.fn(),
      findByProducer: jest.fn(),
      findByCoproducer: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByProducerAndCoproducer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCoproductionUseCase,
        {
          provide: INJECTION_TOKENS.COPRODUCTION_REPOSITORY,
          useValue: mockCoproductionRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateCoproductionUseCase>(CreateCoproductionUseCase);
    coproductionRepository = module.get(INJECTION_TOKENS.COPRODUCTION_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create a new coproduction', async () => {
    const dto = {
      producerId: 'producer-id',
      coproducerId: 'coproducer-id',
      percentage: 20.5,
    };

    coproductionRepository.existsByProducerAndCoproducer.mockResolvedValue(false);
    const coproduction = CoproductionEntity.create(dto.producerId, dto.coproducerId, dto.percentage);
    coproductionRepository.create.mockResolvedValue(coproduction);

    const result = await useCase.execute(dto);

    expect(coproductionRepository.existsByProducerAndCoproducer).toHaveBeenCalledWith(
      'producer-id',
      'coproducer-id',
    );
    expect(coproductionRepository.create).toHaveBeenCalled();
    expect(result).toBeInstanceOf(CoproductionEntity);
    expect(result.producerId).toBe('producer-id');
    expect(result.percentage).toBe(20.5);
  });

  it('should throw ConflictException when coproduction already exists', async () => {
    const dto = {
      producerId: 'producer-id',
      coproducerId: 'coproducer-id',
      percentage: 20.5,
    };

    coproductionRepository.existsByProducerAndCoproducer.mockResolvedValue(true);

    await expect(useCase.execute(dto)).rejects.toThrow(ConflictException);
    expect(coproductionRepository.create).not.toHaveBeenCalled();
  });
});

