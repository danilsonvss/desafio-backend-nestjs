import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { SharedModule } from './shared/shared.module';
import { HealthModule } from './health/health.module';
import { BalanceModule } from './balance/balance.module';
import { TaxModule } from './tax/tax.module';
import { AffiliationModule } from './affiliation/affiliation.module';
import { PaymentModule } from './payment/payment.module';
import { HttpExceptionFilter } from './shared/presentation/filters/http-exception.filter';
import { TransformInterceptor } from './shared/presentation/interceptors/transform.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL', 60000), // 1 minuto
          limit: configService.get<number>('THROTTLE_LIMIT', 10), // 10 requisições por minuto
        },
      ],
    }),
    SharedModule,
    HealthModule,
    AuthModule,
    BalanceModule,
    TaxModule,
    AffiliationModule,
    PaymentModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
