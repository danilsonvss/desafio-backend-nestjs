import { Test, TestingModule } from '@nestjs/testing';
import { BalanceController } from './balance.controller';
import { GetBalanceUseCase } from '../../application/use-cases/get-balance.use-case';
import { CreateOrUpdateBalanceUseCase } from '../../application/use-cases/create-or-update-balance.use-case';
import { BalanceEntity } from '../../domain/entities/balance.entity';
import { UserEntity } from '../../../auth/domain/entities/user.entity';
import { UserRole } from '../../../shared/domain/enums/user-role.enum';

describe('BalanceController', () => {
  let controller: BalanceController;
  let getBalanceUseCase: jest.Mocked<GetBalanceUseCase>;
  let createOrUpdateBalanceUseCase: jest.Mocked<CreateOrUpdateBalanceUseCase>;

  const mockUser = new UserEntity(
    'user-id',
    'test@example.com',
    'hashedPassword',
    'Test User',
    UserRole.PRODUCER,
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    getBalanceUseCase = {
      execute: jest.fn(),
    } as any;

    createOrUpdateBalanceUseCase = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BalanceController],
      providers: [
        {
          provide: GetBalanceUseCase,
          useValue: getBalanceUseCase,
        },
        {
          provide: CreateOrUpdateBalanceUseCase,
          useValue: createOrUpdateBalanceUseCase,
        },
      ],
    }).compile();

    controller = module.get<BalanceController>(BalanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBalance', () => {
    it('should return user balance', async () => {
      const balance = BalanceEntity.create('user-id').credit(100);
      getBalanceUseCase.execute.mockResolvedValue(balance);

      const result = await controller.getBalance(mockUser);

      expect(getBalanceUseCase.execute).toHaveBeenCalledWith('user-id');
      expect(result).toMatchObject({
        userId: 'user-id',
        amount: 100,
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });

  describe('updateBalance', () => {
    it('should credit amount to balance', async () => {
      const dto = { amount: 50, operation: 'credit' as const };
      const balance = BalanceEntity.create('user-id').credit(50);
      createOrUpdateBalanceUseCase.execute.mockResolvedValue(balance);

      const result = await controller.updateBalance(mockUser, dto);

      expect(createOrUpdateBalanceUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-id',
        amount: 50,
        operation: 'credit',
      });
      expect(result.amount).toBe(50);
    });

    it('should debit amount from balance', async () => {
      const dto = { amount: 30, operation: 'debit' as const };
      const initialBalance = BalanceEntity.create('user-id').credit(100);
      const finalBalance = initialBalance.debit(30);
      createOrUpdateBalanceUseCase.execute.mockResolvedValue(finalBalance);

      const result = await controller.updateBalance(mockUser, dto);

      expect(createOrUpdateBalanceUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-id',
        amount: 30,
        operation: 'debit',
      });
      expect(result.amount).toBe(70);
    });
  });
});
