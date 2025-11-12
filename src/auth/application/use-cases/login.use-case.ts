import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { UserEntity } from '../../domain/entities/user.entity';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { IPasswordHashService } from '../../domain/services/password-hash.service.interface';
import type { IJwtService } from '../../domain/services/jwt.service.interface';

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(INJECTION_TOKENS.PASSWORD_HASH_SERVICE)
    private readonly passwordHashService: IPasswordHashService,
    @Inject(INJECTION_TOKENS.JWT_SERVICE)
    private readonly jwtService: IJwtService,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.passwordHashService.compare(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}

