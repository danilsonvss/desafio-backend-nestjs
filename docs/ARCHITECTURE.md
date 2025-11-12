# Arquitetura do Sistema

## Visão Geral

Este projeto implementa uma API RESTful seguindo os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**, com foco em manutenibilidade, testabilidade e escalabilidade.

## Princípios Arquiteturais

### 1. Clean Architecture

```
┌─────────────────────────────────────────────┐
│          Presentation Layer                 │  Controllers, DTOs, Guards
│  ┌───────────────────────────────────────┐  │
│  │      Application Layer                │  │  Use Cases
│  │  ┌─────────────────────────────────┐  │  │
│  │  │     Domain Layer                │  │  │  Entities, Interfaces
│  │  │    (Business Rules)             │  │  │
│  │  │                                 │  │  │
│  │  └─────────────────────────────────┘  │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│      Infrastructure Layer                   │  Repositories, Services
└─────────────────────────────────────────────┘
```

**Regras de Dependência:**
- Camadas externas dependem das internas
- Domínio não depende de nada
- Inversão de dependências via interfaces

### 2. Domain-Driven Design (DDD)

#### Camada de Domínio (Domain Layer)
- **Entities**: Representam conceitos do negócio (User, Balance, Payment)
- **Value Objects**: Objetos imutáveis sem identidade própria
- **Repositories**: Interfaces para persistência
- **Services**: Interfaces para serviços externos

**Responsabilidade:** Conter toda a lógica de negócio

#### Camada de Aplicação (Application Layer)
- **Use Cases**: Orquestram o fluxo de dados entre camadas
- **DTOs**: Objetos de transferência de dados

**Responsabilidade:** Coordenar casos de uso da aplicação

#### Camada de Infraestrutura (Infrastructure Layer)
- **Repository Implementations**: Implementações concretas de persistência
- **Service Implementations**: Implementações de serviços externos
- **External Services**: Integrações com APIs externas

**Responsabilidade:** Detalhes técnicos e integrações

#### Camada de Apresentação (Presentation Layer)
- **Controllers**: Endpoints HTTP
- **Guards**: Proteção de rotas
- **Decorators**: Metadados customizados
- **Strategies**: Estratégias de autenticação
- **Response DTOs**: Objetos de resposta tipados

**Responsabilidade:** Interface com o mundo externo (HTTP)

## Módulos do Sistema

### 1. SharedModule (Global)

**Propósito:** Fornecer recursos compartilhados para toda a aplicação

**Componentes:**
- `PrismaService`: Gerenciamento de conexão com banco de dados
- `HttpExceptionFilter`: Tratamento global de erros
- `TransformInterceptor`: Padronização de respostas
- `INJECTION_TOKENS`: Tokens centralizados de injeção

**Benefícios:**
- Uma única instância do PrismaService
- Respostas consistentes em toda API
- Tratamento de erros padronizado

### 2. Auth Module

**Status:** ✅ Completo

**Componentes Principais:**
- User Entity (Domain)
- RegisterUserUseCase (Application)
- LoginUseCase (Application)
- PrismaUserRepository (Infrastructure)
- AuthController (Presentation)

**Fluxos:**

```
POST /auth/register
  ↓
AuthController
  ↓
RegisterUserUseCase
  ↓
[Check Email] → UserRepository
  ↓
[Hash Password] → PasswordHashService
  ↓
[Create Entity] → User Entity
  ↓
[Save] → UserRepository → Prisma → PostgreSQL
  ↓
UserResponseDto
```

```
POST /auth/login
  ↓
AuthController
  ↓
LoginUseCase
  ↓
[Find User] → UserRepository
  ↓
[Validate Password] → PasswordHashService
  ↓
[Generate Token] → JwtService
  ↓
LoginResponseDto
```

### 3. Health Module

**Propósito:** Monitoramento de saúde da aplicação

**Endpoint:**
- `GET /health`: Retorna status, uptime e environment

### 4. Payment Module (Futuro)

**Propósito:** Processar pagamentos e calcular comissões

**Componentes Planejados:**
- Payment Entity (Domain)
- Transaction Entity (Domain)
- ProcessPaymentUseCase (Application)
- CalculateCommissionsUseCase (Application)
- PaymentController (Presentation)

### 5. Balance Module (Futuro)

**Propósito:** Gerenciar saldos dos usuários

**Componentes Planejados:**
- Balance Entity (Domain)
- UpdateBalanceUseCase (Application)
- GetBalanceUseCase (Application)
- BalanceController (Presentation)

## Padrões de Design Implementados

### 1. Dependency Injection

Uso de tokens centralizados para injeção de dependências:

```typescript
export const INJECTION_TOKENS = {
  USER_REPOSITORY: 'IUserRepository',
  PASSWORD_HASH_SERVICE: 'IPasswordHashService',
  JWT_SERVICE: 'IJwtService',
} as const;
```

**Benefícios:**
- Type-safe
- Fácil refatoração
- Previne erros de digitação

### 2. Repository Pattern

Abstração da camada de persistência:

```typescript
interface IUserRepository {
  create(user: UserEntity): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  existsByEmail(email: string): Promise<boolean>;
}
```

**Benefícios:**
- Testes unitários com mocks
- Troca fácil de banco de dados
- Isolamento da lógica de negócio

### 3. Strategy Pattern

Estratégias de autenticação via Passport:

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // Implementação da estratégia JWT
}
```

**Benefícios:**
- Múltiplas estratégias possíveis
- Extensível
- Padrão consolidado

### 4. Decorator Pattern

Decorators customizados para metadados:

```typescript
export const Roles = (...roles: UserRole[]) =>
  SetMetadata('roles', roles);

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

**Benefícios:**
- Código declarativo
- Reutilização
- Separação de responsabilidades

### 5. Factory Pattern

Criação de entidades através de métodos estáticos:

```typescript
class UserEntity {
  static create(email, password, name, role): UserEntity {
    // Lógica de criação
  }
  
  static fromPrisma(data): UserEntity {
    // Conversão de Prisma para Domain
  }
}
```

**Benefícios:**
- Encapsulamento da criação
- Validações centralizadas
- Conversões tipadas

## Tratamento de Requisições

### 1. Request Pipeline

```
Client Request
  ↓
[Global Guards] → JwtAuthGuard, RolesGuard
  ↓
[Controllers] → Route Handlers
  ↓
[Validation Pipe] → DTO Validation
  ↓
[Use Cases] → Business Logic
  ↓
[Repositories] → Data Access
  ↓
[Database] → PostgreSQL via Prisma
  ↓
[Transform Interceptor] → Response Formatting
  ↓
{data, statusCode, timestamp}
```

### 2. Error Handling Pipeline

```
Exception Thrown
  ↓
[Global Exception Filter]
  ↓
[Determine Status Code]
  ↓
[Format Error Response]
  ↓
[Log if Internal Error]
  ↓
{statusCode, timestamp, path, message, error}
```

## Segurança

### 1. Autenticação (Authentication)

```
Client → JWT Token → JwtAuthGuard → Passport JWT Strategy
                                        ↓
                                  Validate Token
                                        ↓
                                  Attach User to Request
```

### 2. Autorização (Authorization)

```
Authenticated Request → RolesGuard → Check Required Roles
                                         ↓
                                    Allow/Deny Access
```

### 3. Proteção de Dados

- **Passwords**: Bcrypt hash (10 rounds)
- **JWT Secret**: Environment variable
- **Response DTOs**: Excluem dados sensíveis
- **Validation**: class-validator em todos os inputs

## Banco de Dados

### Schema

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Balances
CREATE TABLE balances (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Prisma Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      UserRole
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  balance   Balance?
  
  @@map("users")
}

model Balance {
  id        String   @id @default(uuid())
  userId    String   @unique
  amount    Decimal  @default(0) @db.Decimal(10, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("balances")
}

enum UserRole {
  PRODUCER
  AFFILIATE
  COPRODUCER
  PLATFORM
}
```

## Testes

### Estratégia de Testes

```
┌──────────────────┐
│  E2E Tests       │  ← Testa fluxo completo HTTP → DB
├──────────────────┤
│  Integration     │  ← Testa integração entre camadas
├──────────────────┤
│  Unit Tests      │  ← Testa unidades isoladas
└──────────────────┘
```

### Pirâmide de Testes

```
        /\
       /E2E\         14 tests
      /──────\
     /  Integ \      (futuro)
    /──────────\
   / Unit Tests \    48 tests
  /──────────────\
```

### Cobertura Atual

- **Unit Tests**: 48 testes
  - Domain: 3 testes
  - Application: 5 testes
  - Presentation: 9 testes
  - Shared: 31 testes

- **E2E Tests**: 14 testes
  - Health: 1 teste
  - Auth: 13 testes

## Performance

### Otimizações Implementadas

1. **Single Database Connection**
   - PrismaService global
   - Connection pooling automático

2. **Response Caching** (futuro)
   - Cache de consultas frequentes
   - Invalidação inteligente

3. **Query Optimization**
   - Prisma query optimization
   - Índices no banco de dados

## Escalabilidade

### Horizontal Scaling

A arquitetura permite escalar horizontalmente:

1. **Stateless API**
   - Sem sessões no servidor
   - JWT para autenticação

2. **Database Pooling**
   - Prisma gerencia connections
   - Pronto para load balancer

3. **Module Independence**
   - Módulos podem virar microserviços
   - Comunicação via API Gateway

### Vertical Scaling

Otimizações para crescimento:

1. **Lazy Loading**
   - Módulos carregados sob demanda
   - Reduz memória inicial

2. **Query Optimization**
   - Índices no banco
   - N+1 queries evitados

## Deployment

### Docker

```
┌─────────────────┐
│   Node.js App   │  (Port 3000)
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │  (Port 5432)
└─────────────────┘
```

### Environments

- **Development**: `docker-compose.dev.yml`
- **Production**: `docker-compose.yml`

## Monitoramento

### Health Check

```
GET /health
{
  "status": "ok",
  "uptime": 123.456,
  "environment": "production"
}
```

### Logs

- Console logs para desenvolvimento
- Structured logs para produção
- Error logging automático

## Documentação da API

### Formato de Endpoints

```
POST /resource
GET /resource
GET /resource/:id
PUT /resource/:id
DELETE /resource/:id
```

### Response Format

```json
{
  "data": {},
  "statusCode": 200,
  "timestamp": "ISO-8601"
}
```

### Error Format

```json
{
  "statusCode": 400,
  "timestamp": "ISO-8601",
  "path": "/endpoint",
  "message": "Error message",
  "error": "ExceptionName"
}
```

## Futuras Expansões

### Módulos Planejados

1. **Payment Module**
   - Processar pagamentos
   - Calcular comissões
   - Gerenciar transações

2. **Balance Module**
   - Consultar saldo
   - Histórico de transações
   - Relatórios

3. **Tax Module**
   - Configurar taxas
   - Taxas por país
   - Regras de taxação

4. **Admin Module**
   - Gerenciar usuários
   - Configurações do sistema
   - Relatórios administrativos

### Melhorias Técnicas

1. **Swagger Documentation**
   - Documentação automática
   - Try-it-out interface

2. **Rate Limiting**
   - Proteção contra abuse
   - Throttling configurável

3. **Caching**
   - Redis integration
   - Cache strategy

4. **Observability**
   - Prometheus metrics
   - Grafana dashboards
   - Distributed tracing

## Referências

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

