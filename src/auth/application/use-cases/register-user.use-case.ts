import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { UserRole } from '../../../shared/domain/enums/user-role.enum';
import { UserEntity } from '../../domain/entities/user.entity';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { IPasswordHashService } from '../../domain/services/password-hash.service.interface';

export interface RegisterUserDto {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPasswordHashService')
    private readonly passwordHashService: IPasswordHashService,
  ) {}

  async execute(dto: RegisterUserDto): Promise<UserEntity> {
    const emailExists = await this.userRepository.existsByEmail(dto.email);

    if (emailExists) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await this.passwordHashService.hash(dto.password);

    const user = UserEntity.create(
      dto.email,
      hashedPassword,
      dto.name,
      dto.role,
    );

    return await this.userRepository.create(user);
  }
}

