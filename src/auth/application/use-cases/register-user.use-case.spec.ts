import { ConflictException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { RegisterUserUseCase } from './register-user.use-case';
import { UserEntity } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IPasswordHashService } from '../../domain/services/password-hash.service.interface';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let passwordHashService: jest.Mocked<IPasswordHashService>;

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

    useCase = new RegisterUserUseCase(userRepository, passwordHashService);
  });

  it('should register a new user successfully', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: UserRole.PRODUCER,
    };

    const hashedPassword = 'hashedPassword123';
    const createdUser = UserEntity.fromPrisma({
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      role: dto.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    userRepository.existsByEmail.mockResolvedValue(false);
    passwordHashService.hash.mockResolvedValue(hashedPassword);
    userRepository.create.mockResolvedValue(createdUser);

    const result = await useCase.execute(dto);

    expect(userRepository.existsByEmail).toHaveBeenCalledWith(dto.email);
    expect(passwordHashService.hash).toHaveBeenCalledWith(dto.password);
    expect(userRepository.create).toHaveBeenCalled();
    expect(result).toEqual(createdUser);
  });

  it('should throw ConflictException when email already exists', async () => {
    const dto = {
      email: 'existing@example.com',
      password: 'password123',
      name: 'Test User',
      role: UserRole.PRODUCER,
    };

    userRepository.existsByEmail.mockResolvedValue(true);

    await expect(useCase.execute(dto)).rejects.toThrow(ConflictException);
    expect(userRepository.existsByEmail).toHaveBeenCalledWith(dto.email);
    expect(passwordHashService.hash).not.toHaveBeenCalled();
    expect(userRepository.create).not.toHaveBeenCalled();
  });
});

