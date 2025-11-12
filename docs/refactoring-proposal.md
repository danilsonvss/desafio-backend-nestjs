# Proposta de Refatoração - Desafio Backend NestJS

## Análise da Arquitetura Atual

### Estrutura Atual
```
src/
├── app.module.ts
├── app.controller.ts
├── app.service.ts
├── main.ts
├── auth/
│   ├── auth.module.ts
│   ├── application/
│   │   └── use-cases/
│   ├── domain/
│   │   ├── entities/
│   │   ├── repositories/
│   │   └── services/
│   ├── infrastructure/
│   │   ├── repositories/
│   │   └── services/
│   └── presentation/
│       ├── controllers/
│       ├── decorators/
│       ├── dto/
│       ├── guards/
│       └── strategies/
└── shared/
    ├── domain/
    │   └── enums/
    └── infrastructure/
        └── prisma/
```

### Pontos Positivos

1. **Separação em camadas (DDD)**
   - Camadas bem definidas: domain, application, infrastructure, presentation
   - Inversão de dependências usando interfaces
   - Uso de tokens para injeção de dependência

2. **Estrutura modular**
   - Módulo auth bem organizado
   - Shared para recursos compartilhados

3. **Testes**
   - Testes unitários e E2E implementados
   - Boa cobertura das funcionalidades principais

### Problemas Identificados

#### 1. **PrismaService não é global**
**Problema:** PrismaService está sendo instanciado no AuthModule, mas não é global
```typescript
// auth.module.ts
providers: [
  PrismaService, // ❌ Cada módulo vai criar uma instância nova
  ...
]
```
**Impacto:** Múltiplas conexões com banco de dados, desperdício de recursos

#### 2. **Falta de módulo compartilhado (SharedModule)**
**Problema:** Não existe um SharedModule para centralizar recursos comuns
**Impacto:** Código duplicado, difícil manutenção

#### 3. **Tokens hardcoded no módulo**
**Problema:** Tokens de injeção declarados diretamente no módulo
```typescript
const USER_REPOSITORY_TOKEN = 'IUserRepository';
const PASSWORD_HASH_SERVICE_TOKEN = 'IPasswordHashService';
```
**Impacto:** Difícil reutilização, propenso a erros de digitação

#### 4. **Falta de módulo de infraestrutura**
**Problema:** Serviços de infraestrutura (Prisma, JWT, Bcrypt) não estão organizados em módulo próprio
**Impacto:** Difícil configuração e reutilização

#### 5. **AppController e AppService sem propósito claro**
**Problema:** Arquivos padrão do NestJS sem funcionalidade real
**Impacto:** Código desnecessário

#### 6. **Falta de interceptors e exception filters**
**Problema:** Não há tratamento global de erros e transformação de respostas
**Impacto:** Respostas inconsistentes, dificuldade de debugging

#### 7. **Falta de módulo de configuração centralizado**
**Problema:** Configurações (JWT, Database) espalhadas pelo código
**Impacto:** Difícil manutenção e testes

#### 8. **Response DTOs não implementados**
**Problema:** Controller retorna objetos anônimos
```typescript
return {
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
};
```
**Impacto:** Falta de validação de saída, documentação inconsistente

#### 9. **Falta de documentação Swagger**
**Problema:** Não há decorators do Swagger para documentação da API
**Impacto:** Documentação manual, difícil integração

#### 10. **Estrutura de erros não padronizada**
**Problema:** Erros lançados diretamente, sem camada de abstração
**Impacto:** Difícil internacionalização e personalização

## Proposta de Refatoração

### 1. Criar SharedModule Global

**Objetivo:** Centralizar recursos compartilhados e tornar PrismaService global

```typescript
// src/shared/shared.module.ts
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class SharedModule {}
```

**Benefícios:**
- Uma única instância do PrismaService
- Disponível em todos os módulos
- Melhor gerenciamento de recursos

### 2. Criar DatabaseModule

**Objetivo:** Isolar configuração de banco de dados

```typescript
// src/shared/infrastructure/database/database.module.ts
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

### 3. Centralizar Tokens de Injeção

**Objetivo:** Criar arquivo único com todos os tokens

```typescript
// src/shared/constants/injection-tokens.ts
export const TOKENS = {
  // Repositories
  USER_REPOSITORY: 'IUserRepository',
  
  // Services
  PASSWORD_HASH_SERVICE: 'IPasswordHashService',
  JWT_SERVICE: 'IJwtService',
} as const;
```

**Uso:**
```typescript
@Inject(TOKENS.USER_REPOSITORY)
private readonly userRepository: IUserRepository
```

### 4. Criar Response DTOs

**Objetivo:** Padronizar respostas da API

```typescript
// src/auth/presentation/dto/user-response.dto.ts
export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  createdAt: Date;
}

// src/auth/presentation/dto/login-response.dto.ts
export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
```

### 5. Adicionar Swagger Documentation

**Objetivo:** Documentar API automaticamente

```typescript
// src/auth/presentation/controllers/auth.controller.ts
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterUserDto): Promise<UserResponseDto> {
    // ...
  }
}
```

### 6. Criar Global Exception Filter

**Objetivo:** Tratamento consistente de erros

```typescript
// src/shared/presentation/filters/http-exception.filter.ts
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

### 7. Criar Transform Interceptor

**Objetivo:** Padronizar formato de resposta

```typescript
// src/shared/presentation/interceptors/transform.interceptor.ts
export interface Response<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        data,
        statusCode: context.switchToHttp().getResponse().statusCode,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### 8. Criar ConfigModule centralizado

**Objetivo:** Centralizar configurações da aplicação

```typescript
// src/config/config.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('7d'),
      }),
    }),
  ],
})
export class AppConfigModule {}
```

### 9. Remover AppController e AppService

**Objetivo:** Remover código desnecessário

**Ação:** Deletar arquivos:
- `app.controller.ts`
- `app.controller.spec.ts`
- `app.service.ts`

**Criar health check controller:**
```typescript
// src/health/health.controller.ts
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

### 10. Criar estrutura para futuros módulos

**Objetivo:** Preparar para Payment e Balance modules

```
src/
├── payment/
│   ├── payment.module.ts
│   ├── application/
│   ├── domain/
│   ├── infrastructure/
│   └── presentation/
└── balance/
    ├── balance.module.ts
    ├── application/
    ├── domain/
    ├── infrastructure/
    └── presentation/
```

## Nova Estrutura Proposta

```
src/
├── main.ts
├── app.module.ts
├── config/
│   ├── config.module.ts
│   └── configuration.ts
├── shared/
│   ├── shared.module.ts
│   ├── constants/
│   │   └── injection-tokens.ts
│   ├── domain/
│   │   ├── enums/
│   │   └── interfaces/
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── database.module.ts
│   │   │   └── prisma.service.ts
│   │   └── logging/
│   └── presentation/
│       ├── filters/
│       │   └── http-exception.filter.ts
│       ├── interceptors/
│       │   └── transform.interceptor.ts
│       └── pipes/
│           └── validation.pipe.ts
├── health/
│   ├── health.module.ts
│   └── health.controller.ts
├── auth/
│   ├── auth.module.ts
│   ├── application/
│   │   └── use-cases/
│   ├── domain/
│   │   ├── entities/
│   │   ├── repositories/
│   │   └── services/
│   ├── infrastructure/
│   │   ├── repositories/
│   │   └── services/
│   └── presentation/
│       ├── controllers/
│       ├── decorators/
│       ├── dto/
│       │   ├── request/
│       │   └── response/
│       ├── guards/
│       └── strategies/
├── payment/          (futuro)
│   └── ...
└── balance/          (futuro)
    └── ...
```

## Plano de Implementação

### Fase 1: Fundação (Prioridade Alta)
1. ✅ Criar SharedModule global
2. ✅ Criar DatabaseModule
3. ✅ Centralizar tokens de injeção
4. ✅ Remover AppController/AppService
5. ✅ Criar HealthController

### Fase 2: Padronização (Prioridade Alta)
6. ✅ Criar Response DTOs
7. ✅ Adicionar Exception Filter
8. ✅ Adicionar Transform Interceptor
9. ✅ Configurar Swagger

### Fase 3: Configuração (Prioridade Média)
10. ✅ Centralizar ConfigModule
11. ✅ Adicionar validação de variáveis de ambiente
12. ✅ Criar arquivos de configuração tipados

### Fase 4: Preparação Futura (Prioridade Baixa)
13. ⬜ Criar estrutura de Payment module
14. ⬜ Criar estrutura de Balance module
15. ⬜ Documentar padrões e convenções

## Benefícios Esperados

### Técnicos
- **Manutenibilidade:** Código mais organizado e fácil de manter
- **Escalabilidade:** Preparado para novos módulos (payment, balance)
- **Testabilidade:** Melhor isolamento e mocking
- **Performance:** Uma única conexão com banco de dados
- **Consistência:** Respostas e erros padronizados

### Negócio
- **Documentação:** API autodocumentada com Swagger
- **Confiabilidade:** Tratamento consistente de erros
- **Produtividade:** Padrões claros aceleram desenvolvimento
- **Qualidade:** Código mais robusto e testável

## Considerações de Segurança

1. **Validação de entrada:** Mantida e melhorada com ValidationPipe
2. **Sanitização de saída:** DTOs de resposta evitam exposição de dados sensíveis
3. **Rate limiting:** Recomendado adicionar em próxima iteração
4. **CORS:** Configurar adequadamente no main.ts
5. **Helmet:** Adicionar para headers de segurança

## Métricas de Sucesso

- ✅ Todos os testes passando
- ✅ Documentação Swagger completa
- ✅ Respostas padronizadas em todos endpoints
- ✅ Tratamento global de erros funcionando
- ✅ Tempo de resposta mantido ou melhorado
- ✅ Cobertura de testes mantida ou aumentada

## Conclusão

Esta refatoração mantém a arquitetura DDD existente enquanto resolve problemas estruturais importantes. As mudanças são incrementais e não quebram funcionalidades existentes, preparando o projeto para crescimento futuro com módulos de pagamento e balance.

A implementação pode ser feita em fases, priorizando as mudanças de maior impacto primeiro (Fase 1 e 2).

