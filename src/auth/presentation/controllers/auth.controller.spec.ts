import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthController } from './auth.controller';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { UserEntity } from '../../domain/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let registerUserUseCase: jest.Mocked<RegisterUserUseCase>;
  let loginUseCase: jest.Mocked<LoginUseCase>;

  beforeEach(async () => {
    registerUserUseCase = {
      execute: jest.fn(),
    } as any;

    loginUseCase = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: RegisterUserUseCase,
          useValue: registerUserUseCase,
        },
        {
          provide: LoginUseCase,
          useValue: loginUseCase,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: UserRole.PRODUCER,
      };

      const user = UserEntity.fromPrisma({
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: dto.email,
        password: 'hashedPassword',
        name: dto.name,
        role: dto.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      registerUserUseCase.execute.mockResolvedValue(user);

      const result = await controller.register(dto);

      expect(registerUserUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const loginResult = {
        accessToken: 'jwt-token-123',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: dto.email,
          name: 'Test User',
          role: UserRole.PRODUCER,
        },
      };

      loginUseCase.execute.mockResolvedValue(loginResult);

      const result = await controller.login(dto);

      expect(loginUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual(loginResult);
    });
  });
});

