import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CreateOrUpdateBalanceUseCase } from './create-or-update-balance.use-case';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { IBalanceRepository } from '../../domain/repositories/balance.repository.interface';
import { BalanceEntity } from '../../domain/entities/balance.entity';

describe('CreateOrUpdateBalanceUseCase', () => {
  let useCase: CreateOrUpdateBalanceUseCase;
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
        CreateOrUpdateBalanceUseCase,
        {
          provide: INJECTION_TOKENS.BALANCE_REPOSITORY,
          useValue: mockBalanceRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateOrUpdateBalanceUseCase>(
      CreateOrUpdateBalanceUseCase,
    );
    balanceRepository = module.get(INJECTION_TOKENS.BALANCE_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create new balance and credit amount', async () => {
      const dto = { userId: 'user-id', amount: 100, operation: 'credit' as const };
      balanceRepository.findByUserId.mockResolvedValue(null);
      
      const newBalance = BalanceEntity.create('user-id');
      balanceRepository.create.mockResolvedValue(newBalance);
      
      const creditedBalance = newBalance.credit(100);
      balanceRepository.update.mockResolvedValue(creditedBalance);

      const result = await useCase.execute(dto);

      expect(balanceRepository.findByUserId).toHaveBeenCalledWith('user-id');
      expect(balanceRepository.create).toHaveBeenCalled();
      expect(balanceRepository.update).toHaveBeenCalled();
      expect(result.amount).toBe(100);
    });

    it('should credit amount to existing balance', async () => {
      const existingBalance = BalanceEntity.create('user-id');
      const dto = { userId: 'user-id', amount: 50, operation: 'credit' as const };
      
      balanceRepository.findByUserId.mockResolvedValue(existingBalance);
      const creditedBalance = existingBalance.credit(50);
      balanceRepository.update.mockResolvedValue(creditedBalance);

      const result = await useCase.execute(dto);

      expect(balanceRepository.findByUserId).toHaveBeenCalledWith('user-id');
      expect(balanceRepository.create).not.toHaveBeenCalled();
      expect(balanceRepository.update).toHaveBeenCalled();
      expect(result.amount).toBe(50);
    });

    it('should debit amount from existing balance', async () => {
      const existingBalance = BalanceEntity.create('user-id').credit(100);
      const dto = { userId: 'user-id', amount: 30, operation: 'debit' as const };
      
      balanceRepository.findByUserId.mockResolvedValue(existingBalance);
      const debitedBalance = existingBalance.debit(30);
      balanceRepository.update.mockResolvedValue(debitedBalance);

      const result = await useCase.execute(dto);

      expect(balanceRepository.update).toHaveBeenCalled();
      expect(result.amount).toBe(70);
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      const existingBalance = BalanceEntity.create('user-id');
      const dto = { userId: 'user-id', amount: 100, operation: 'debit' as const };
      
      balanceRepository.findByUserId.mockResolvedValue(existingBalance);

      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(dto)).rejects.toThrow('Insufficient balance');
    });

    it('should throw BadRequestException for negative credit amount', async () => {
      const existingBalance = BalanceEntity.create('user-id');
      const dto = { userId: 'user-id', amount: -10, operation: 'credit' as const };
      
      balanceRepository.findByUserId.mockResolvedValue(existingBalance);

      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(dto)).rejects.toThrow('Credit amount must be positive');
    });

    it('should throw BadRequestException for negative debit amount', async () => {
      const existingBalance = BalanceEntity.create('user-id');
      const dto = { userId: 'user-id', amount: -10, operation: 'debit' as const };
      
      balanceRepository.findByUserId.mockResolvedValue(existingBalance);

      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(dto)).rejects.toThrow('Debit amount must be positive');
    });
  });
});

