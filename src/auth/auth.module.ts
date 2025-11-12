import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './presentation/controllers/auth.controller';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { BcryptPasswordHashService } from './infrastructure/services/bcrypt-password-hash.service';
import { NestJwtService } from './infrastructure/services/nestjs-jwt.service';
import { JwtStrategy } from './presentation/strategies/jwt.strategy';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';
import type { IUserRepository } from './domain/repositories/user.repository.interface';
import type { IPasswordHashService } from './domain/services/password-hash.service.interface';
import type { IJwtService } from './domain/services/jwt.service.interface';

const USER_REPOSITORY_TOKEN = 'IUserRepository';
const PASSWORD_HASH_SERVICE_TOKEN = 'IPasswordHashService';
const JWT_SERVICE_TOKEN = 'IJwtService';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '7d';
        return {
          secret: configService.get<string>('JWT_SECRET') || 'default-secret',
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: PrismaUserRepository,
    },
    {
      provide: PASSWORD_HASH_SERVICE_TOKEN,
      useClass: BcryptPasswordHashService,
    },
    {
      provide: JWT_SERVICE_TOKEN,
      useClass: NestJwtService,
    },
    RegisterUserUseCase,
    LoginUseCase,
    JwtStrategy,
  ],
  exports: [USER_REPOSITORY_TOKEN, JwtStrategy, PassportModule],
})
export class AuthModule {}

