import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { LoginUseCase } from './login.use-case';
import { UserEntity } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IPasswordHashService } from '../../domain/services/password-hash.service.interface';
import { IJwtService } from '../../domain/services/jwt.service.interface';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let passwordHashService: jest.Mocked<IPasswordHashService>;
  let jwtService: jest.Mocked<IJwtService>;

  beforeEach(() => {
    userRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      existsByEmail: jest.fn(),
    };

    passwordHashService = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    useCase = new LoginUseCase(
      userRepository,
      passwordHashService,
      jwtService,
    );
  });

  it('should login successfully with valid credentials', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const user = UserEntity.fromPrisma({
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: dto.email,
      password: 'hashedPassword',
      name: 'Test User',
      role: UserRole.PRODUCER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const accessToken = 'jwt-token-123';

    userRepository.findByEmail.mockResolvedValue(user);
    passwordHashService.compare.mockResolvedValue(true);
    jwtService.sign.mockReturnValue(accessToken);

    const result = await useCase.execute(dto);

    expect(userRepository.findByEmail).toHaveBeenCalledWith(dto.email);
    expect(passwordHashService.compare).toHaveBeenCalledWith(
      dto.password,
      user.password,
    );
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    expect(result.accessToken).toBe(accessToken);
    expect(result.user).toEqual({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  });

  it('should throw UnauthorizedException when user does not exist', async () => {
    const dto = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };

    userRepository.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow(UnauthorizedException);
    expect(passwordHashService.compare).not.toHaveBeenCalled();
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when password is invalid', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'wrongPassword',
    };

    const user = UserEntity.fromPrisma({
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: dto.email,
      password: 'hashedPassword',
      name: 'Test User',
      role: UserRole.PRODUCER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    userRepository.findByEmail.mockResolvedValue(user);
    passwordHashService.compare.mockResolvedValue(false);

    await expect(useCase.execute(dto)).rejects.toThrow(UnauthorizedException);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });
});

