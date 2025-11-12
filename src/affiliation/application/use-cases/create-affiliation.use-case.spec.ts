import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateAffiliationUseCase } from './create-affiliation.use-case';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { IAffiliationRepository } from '../../domain/repositories/affiliation.repository.interface';
import { AffiliationEntity } from '../../domain/entities/affiliation.entity';

describe('CreateAffiliationUseCase', () => {
  let useCase: CreateAffiliationUseCase;
  let affiliationRepository: jest.Mocked<IAffiliationRepository>;

  beforeEach(async () => {
    const mockAffiliationRepository = {
      create: jest.fn(),
      findByProducerAndAffiliate: jest.fn(),
      findById: jest.fn(),
      findByProducer: jest.fn(),
      findByAffiliate: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByProducerAndAffiliate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAffiliationUseCase,
        {
          provide: INJECTION_TOKENS.AFFILIATION_REPOSITORY,
          useValue: mockAffiliationRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateAffiliationUseCase>(CreateAffiliationUseCase);
    affiliationRepository = module.get(INJECTION_TOKENS.AFFILIATION_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create a new affiliation', async () => {
    const dto = {
      producerId: 'producer-id',
      affiliateId: 'affiliate-id',
      percentage: 10.5,
    };

    affiliationRepository.existsByProducerAndAffiliate.mockResolvedValue(false);
    const affiliation = AffiliationEntity.create(dto.producerId, dto.affiliateId, dto.percentage);
    affiliationRepository.create.mockResolvedValue(affiliation);

    const result = await useCase.execute(dto);

    expect(affiliationRepository.existsByProducerAndAffiliate).toHaveBeenCalledWith(
      'producer-id',
      'affiliate-id',
    );
    expect(affiliationRepository.create).toHaveBeenCalled();
    expect(result).toBeInstanceOf(AffiliationEntity);
    expect(result.producerId).toBe('producer-id');
    expect(result.percentage).toBe(10.5);
  });

  it('should throw ConflictException when affiliation already exists', async () => {
    const dto = {
      producerId: 'producer-id',
      affiliateId: 'affiliate-id',
      percentage: 10.5,
    };

    affiliationRepository.existsByProducerAndAffiliate.mockResolvedValue(true);

    await expect(useCase.execute(dto)).rejects.toThrow(ConflictException);
    expect(affiliationRepository.create).not.toHaveBeenCalled();
  });
});

