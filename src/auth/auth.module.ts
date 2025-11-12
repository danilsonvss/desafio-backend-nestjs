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
import { INJECTION_TOKENS } from '../shared/constants/injection-tokens';

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
    {
      provide: INJECTION_TOKENS.USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: INJECTION_TOKENS.PASSWORD_HASH_SERVICE,
      useClass: BcryptPasswordHashService,
    },
    {
      provide: INJECTION_TOKENS.JWT_SERVICE,
      useClass: NestJwtService,
    },
    RegisterUserUseCase,
    LoginUseCase,
    JwtStrategy,
  ],
  exports: [INJECTION_TOKENS.USER_REPOSITORY, JwtStrategy, PassportModule],
})
export class AuthModule {}

