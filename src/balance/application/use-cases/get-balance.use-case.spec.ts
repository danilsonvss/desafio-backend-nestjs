import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetBalanceUseCase } from './get-balance.use-case';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { IBalanceRepository } from '../../domain/repositories/balance.repository.interface';
import { BalanceEntity } from '../../domain/entities/balance.entity';

describe('GetBalanceUseCase', () => {
  let useCase: GetBalanceUseCase;
  let balanceRepository: jest.Mocked<IBalanceRepository>;

  beforeEach(async () => {
    const mockBalanceRepository = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      existsByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetBalanceUseCase,
        {
          provide: INJECTION_TOKENS.BALANCE_REPOSITORY,
          useValue: mockBalanceRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetBalanceUseCase>(GetBalanceUseCase);
    balanceRepository = module.get(INJECTION_TOKENS.BALANCE_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return balance for existing user', async () => {
      const balance = BalanceEntity.create('user-id');
      balanceRepository.findByUserId.mockResolvedValue(balance);

      const result = await useCase.execute('user-id');

      expect(balanceRepository.findByUserId).toHaveBeenCalledWith('user-id');
      expect(result).toBe(balance);
      expect(result.userId).toBe('user-id');
    });

    it('should throw NotFoundException when balance does not exist', async () => {
      balanceRepository.findByUserId.mockResolvedValue(null);

      await expect(useCase.execute('nonexistent-user')).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute('nonexistent-user')).rejects.toThrow(
        'Balance not found for user nonexistent-user',
      );
    });
  });
});
