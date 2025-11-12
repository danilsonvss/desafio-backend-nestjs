import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UpdateBalanceUseCase, BalanceOperationType } from './update-balance.use-case';
import { BalanceEntity } from '../../domain/entities/balance.entity';
import { IBalanceRepository } from '../../domain/repositories/balance.repository.interface';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';

describe('UpdateBalanceUseCase', () => {
  let useCase: UpdateBalanceUseCase;
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
        UpdateBalanceUseCase,
        {
          provide: INJECTION_TOKENS.BALANCE_REPOSITORY,
          useValue: mockBalanceRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateBalanceUseCase>(UpdateBalanceUseCase);
    balanceRepository = module.get(INJECTION_TOKENS.BALANCE_REPOSITORY);
  });

  describe('execute - CREDIT', () => {
    it('should credit amount to existing balance', async () => {
      const userId = 'user-123';
      const existingBalance = new BalanceEntity(
        'balance-123',
        userId,
        100,
        new Date(),
        new Date(),
      );
      const updatedBalance = existingBalance.credit(50);

      balanceRepository.findByUserId.mockResolvedValue(existingBalance);
      balanceRepository.update.mockResolvedValue(updatedBalance);

      const result = await useCase.execute({
        userId,
        amount: 50,
        operation: BalanceOperationType.CREDIT,
      });

      expect(result.amount).toBe(150);
      expect(balanceRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(balanceRepository.update).toHaveBeenCalled();
    });

    it('should create balance and credit when balance not found', async () => {
      const userId = 'user-123';
      const newBalance = BalanceEntity.create(userId);
      const creditedBalance = newBalance.credit(100);

      balanceRepository.findByUserId.mockResolvedValue(null);
      balanceRepository.create.mockResolvedValue(newBalance);
      balanceRepository.update.mockResolvedValue(creditedBalance);

      const result = await useCase.execute({
        userId,
        amount: 100,
        operation: BalanceOperationType.CREDIT,
      });

      expect(result.amount).toBe(100);
      expect(balanceRepository.create).toHaveBeenCalled();
      expect(balanceRepository.update).toHaveBeenCalled();
    });

    it('should throw error for zero amount', async () => {
      await expect(
        useCase.execute({
          userId: 'user-123',
          amount: 0,
          operation: BalanceOperationType.CREDIT,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for negative amount', async () => {
      await expect(
        useCase.execute({
          userId: 'user-123',
          amount: -50,
          operation: BalanceOperationType.CREDIT,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('execute - DEBIT', () => {
    it('should debit amount from existing balance', async () => {
      const userId = 'user-123';
      const existingBalance = new BalanceEntity(
        'balance-123',
        userId,
        100,
        new Date(),
        new Date(),
      );
      const updatedBalance = existingBalance.debit(30);

      balanceRepository.findByUserId.mockResolvedValue(existingBalance);
      balanceRepository.update.mockResolvedValue(updatedBalance);

      const result = await useCase.execute({
        userId,
        amount: 30,
        operation: BalanceOperationType.DEBIT,
      });

      expect(result.amount).toBe(70);
      expect(balanceRepository.update).toHaveBeenCalled();
    });

    it('should throw error for insufficient balance', async () => {
      const userId = 'user-123';
      const existingBalance = new BalanceEntity(
        'balance-123',
        userId,
        50,
        new Date(),
        new Date(),
      );

      balanceRepository.findByUserId.mockResolvedValue(existingBalance);

      await expect(
        useCase.execute({
          userId,
          amount: 100,
          operation: BalanceOperationType.DEBIT,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        useCase.execute({
          userId,
          amount: 100,
          operation: BalanceOperationType.DEBIT,
        }),
      ).rejects.toThrow('Insufficient balance');
    });

    it('should create balance with zero and fail debit', async () => {
      const userId = 'user-123';
      const newBalance = BalanceEntity.create(userId);

      balanceRepository.findByUserId.mockResolvedValue(null);
      balanceRepository.create.mockResolvedValue(newBalance);

      await expect(
        useCase.execute({
          userId,
          amount: 50,
          operation: BalanceOperationType.DEBIT,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('credit helper method', () => {
    it('should credit amount using helper method', async () => {
      const userId = 'user-123';
      const existingBalance = new BalanceEntity(
        'balance-123',
        userId,
        100,
        new Date(),
        new Date(),
      );
      const updatedBalance = existingBalance.credit(50);

      balanceRepository.findByUserId.mockResolvedValue(existingBalance);
      balanceRepository.update.mockResolvedValue(updatedBalance);

      const result = await useCase.credit(userId, 50);

      expect(result.amount).toBe(150);
    });
  });

  describe('debit helper method', () => {
    it('should debit amount using helper method', async () => {
      const userId = 'user-123';
      const existingBalance = new BalanceEntity(
        'balance-123',
        userId,
        100,
        new Date(),
        new Date(),
      );
      const updatedBalance = existingBalance.debit(30);

      balanceRepository.findByUserId.mockResolvedValue(existingBalance);
      balanceRepository.update.mockResolvedValue(updatedBalance);

      const result = await useCase.debit(userId, 30);

      expect(result.amount).toBe(70);
    });
  });
});

