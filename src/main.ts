import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Desafio Backend NestJS API')
    .setDescription(
      'API RESTful para gerenciamento de pagamentos, taxas, comissões e afiliações. ' +
      'Desenvolvida com NestJS, Prisma e PostgreSQL seguindo DDD e Clean Architecture.'
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Autenticação e registro de usuários')
    .addTag('health', 'Verificação de saúde da aplicação')
    .addTag('balance', 'Gerenciamento de saldos dos usuários')
    .addTag('taxes', 'Gerenciamento de taxas por país e tipo')
    .addTag('affiliations', 'Gerenciamento de afiliações entre produtores e afiliados')
    .addTag('coproductions', 'Gerenciamento de coproduções entre produtores e coprodutores')
    .addTag('payment', 'Processamento de pagamentos e cálculo de comissões')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
