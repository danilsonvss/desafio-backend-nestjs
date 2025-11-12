# Módulo de Autenticação - Documentação Técnica

## 📋 Status: ✅ CONCLUÍDO

## Visão Geral

O módulo de autenticação foi implementado seguindo os princípios de DDD (Domain-Driven Design) e Clean Architecture, com camadas bem definidas e separação de responsabilidades.

## Arquitetura

### Estrutura de Camadas

```
auth/
├── domain/                      # Camada de Domínio (Regras de Negócio)
│   ├── entities/
│   │   ├── user.entity.ts      # Entidade de domínio User
│   │   └── user.entity.spec.ts # Testes da entidade
│   ├── repositories/
│   │   └── user.repository.interface.ts  # Contrato do repositório
│   └── services/
│       ├── password-hash.service.interface.ts  # Contrato de hash
│       └── jwt.service.interface.ts            # Contrato de JWT
│
├── application/                 # Camada de Aplicação (Casos de Uso)
│   └── use-cases/
│       ├── register-user.use-case.ts       # UC: Registrar usuário
│       ├── register-user.use-case.spec.ts
│       ├── login.use-case.ts               # UC: Login
│       └── login.use-case.spec.ts
│
├── infrastructure/              # Camada de Infraestrutura (Implementações)
│   ├── repositories/
│   │   └── prisma-user.repository.ts  # Implementação com Prisma
│   └── services/
│       ├── bcrypt-password-hash.service.ts  # Implementação bcrypt
│       └── nestjs-jwt.service.ts            # Implementação JWT
│
├── presentation/                # Camada de Apresentação (HTTP)
│   ├── controllers/
│   │   ├── auth.controller.ts          # Controller HTTP
│   │   └── auth.controller.spec.ts
│   ├── dto/
│   │   ├── register-user.dto.ts        # DTO de entrada
│   │   ├── login.dto.ts                # DTO de entrada
│   │   └── response/                   # DTOs de saída
│   │       ├── user-response.dto.ts
│   │       ├── user-response.dto.spec.ts
│   │       ├── login-response.dto.ts
│   │       └── login-response.dto.spec.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts           # Guard de autenticação
│   │   └── roles.guard.ts              # Guard de autorização
│   ├── decorators/
│   │   ├── current-user.decorator.ts   # Decorator para obter usuário
│   │   └── roles.decorator.ts          # Decorator para definir roles
│   └── strategies/
│       └── jwt.strategy.ts             # Estratégia Passport JWT
│
└── auth.module.ts                      # Módulo NestJS
```

## Implementação das Camadas

### 1. Camada de Domínio

#### User Entity
```typescript
// Entidade pura de domínio, sem dependências externas
class UserEntity {
  - id: string
  - email: string
  - password: string (hash)
  - name: string
  - role: UserRole
  - createdAt: Date
  - updatedAt: Date
  
  + static create(): UserEntity
  + static fromPrisma(): UserEntity
}
```

**Responsabilidades:**
- Representar o conceito de usuário no domínio
- Validar regras de negócio da entidade
- Conversão de/para formatos de persistência

#### Interfaces de Repositório e Serviços
- Definem contratos que a infraestrutura deve implementar
- Invertem a dependência (Dependency Inversion Principle)
- Permitem testes unitários com mocks

### 2. Camada de Aplicação

#### Register User Use Case
```typescript
RegisterUserUseCase.execute(dto):
  1. Verifica se email já existe
  2. Hash da senha
  3. Cria entidade User
  4. Persiste no repositório
  5. Retorna UserEntity
```

**Testes:**
- ✅ Deve registrar novo usuário com sucesso
- ✅ Deve lançar exceção para email duplicado
- ✅ Deve fazer hash da senha antes de salvar

#### Login Use Case
```typescript
LoginUseCase.execute(dto):
  1. Busca usuário por email
  2. Valida senha com hash
  3. Gera token JWT
  4. Retorna token e dados do usuário
```

**Testes:**
- ✅ Deve fazer login com credenciais válidas
- ✅ Deve lançar exceção para senha inválida
- ✅ Deve lançar exceção para usuário inexistente

### 3. Camada de Infraestrutura

#### Prisma User Repository
```typescript
class PrismaUserRepository implements IUserRepository {
  - prisma: PrismaService
  
  + create(user): Promise<UserEntity>
  + findByEmail(email): Promise<UserEntity | null>
  + findById(id): Promise<UserEntity | null>
  + existsByEmail(email): Promise<boolean>
}
```

**Implementação:**
- Usa PrismaService (injetado via SharedModule global)
- Converte entre Prisma models e domain entities
- Isolamento de detalhes de persistência

#### Bcrypt Password Hash Service
```typescript
class BcryptPasswordHashService implements IPasswordHashService {
  + hash(password): Promise<string>
  + compare(password, hash): Promise<boolean>
}
```

**Configuração:**
- Salt rounds: 10
- Algoritmo: bcrypt

#### NestJS JWT Service
```typescript
class NestJwtService implements IJwtService {
  - jwtService: JwtService (do @nestjs/jwt)
  
  + sign(payload): string
  + verify(token): any
}
```

**Configuração:**
- Secret: Variável de ambiente JWT_SECRET
- Expiração: Variável de ambiente JWT_EXPIRES_IN (padrão: 7d)

### 4. Camada de Apresentação

#### Auth Controller
```typescript
@Controller('auth')
class AuthController {
  POST /auth/register
    - Body: RegisterUserDto
    - Response: UserResponseDto (201)
    - Errors: 409 (email duplicado), 400 (validação)
  
  POST /auth/login
    - Body: LoginDto
    - Response: LoginResponseDto (200)
    - Errors: 401 (credenciais inválidas), 400 (validação)
}
```

**DTOs de Response:**
- `UserResponseDto`: Exclui senha, inclui timestamps
- `LoginResponseDto`: Token + UserResponseDto

#### Guards

**JwtAuthGuard:**
```typescript
@UseGuards(JwtAuthGuard)
// Protege rota, requer token JWT válido
```

**RolesGuard:**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PRODUCER, UserRole.PLATFORM)
// Protege rota por roles específicos
```

#### Decorators

**@CurrentUser():**
```typescript
async getProfile(@CurrentUser() user: UserEntity) {
  // Acessa usuário autenticado
}
```

**@Roles(...roles):**
```typescript
@Roles(UserRole.PRODUCER)
// Define roles permitidos
```

## Injeção de Dependências

### Tokens Centralizados
```typescript
// src/shared/constants/injection-tokens.ts
export const INJECTION_TOKENS = {
  USER_REPOSITORY: 'IUserRepository',
  PASSWORD_HASH_SERVICE: 'IPasswordHashService',
  JWT_SERVICE: 'IJwtService',
} as const;
```

### Configuração no Módulo
```typescript
@Module({
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
})
```

## Integração com Shared Module

O módulo de autenticação usa o **SharedModule** global que fornece:
- `PrismaService`: Serviço de conexão com banco de dados
- Uma única instância compartilhada por toda aplicação
- Melhor gerenciamento de recursos

## Padronização de Respostas

Todas as respostas passam pelo **Transform Interceptor**:

```json
{
  "data": {
    // Dados reais da resposta
  },
  "statusCode": 200,
  "timestamp": "2025-11-12T20:00:00.000Z"
}
```

## Tratamento de Erros

Todos os erros passam pelo **HTTP Exception Filter**:

```json
{
  "statusCode": 400,
  "timestamp": "2025-11-12T20:00:00.000Z",
  "path": "/auth/register",
  "message": "Email already exists",
  "error": "ConflictException"
}
```

## Segurança

### LGPD Compliance
- ✅ Senhas armazenadas com hash bcrypt
- ✅ Senhas nunca retornadas nas respostas (via Response DTOs)
- ✅ Validação de entrada de dados
- ✅ Mensagens de erro genéricas para login

### PCI Compliance
- ✅ Não armazena dados de cartão (futuro)
- ✅ Isolamento de dados sensíveis
- ✅ Controle de acesso via JWT e Guards

## Testes

### Cobertura de Testes

#### Testes Unitários (28 testes)
- ✅ UserEntity (3 testes)
- ✅ RegisterUserUseCase (2 testes)
- ✅ LoginUseCase (3 testes)
- ✅ AuthController (2 testes)
- ✅ UserResponseDto (3 testes)
- ✅ LoginResponseDto (2 testes)

#### Testes E2E (13 testes)
- ✅ POST /auth/register - sucesso
- ✅ POST /auth/register - email duplicado
- ✅ POST /auth/register - validações
- ✅ POST /auth/login - sucesso
- ✅ POST /auth/login - credenciais inválidas
- ✅ POST /auth/login - validações
- ✅ Hash de senha verificado
- ✅ Token JWT validado

### Execução
```bash
# Testes unitários do auth
npm test -- auth

# Testes E2E do auth
npm run test:e2e -- auth.e2e-spec
```

## Variáveis de Ambiente

```env
# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

## Endpoints da API

### POST /auth/register

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "role": "PRODUCER"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "PRODUCER",
    "createdAt": "2025-11-12T20:00:00.000Z",
    "updatedAt": "2025-11-12T20:00:00.000Z"
  },
  "statusCode": 201,
  "timestamp": "2025-11-12T20:00:00.000Z"
}
```

### POST /auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "PRODUCER",
      "createdAt": "2025-11-12T20:00:00.000Z",
      "updatedAt": "2025-11-12T20:00:00.000Z"
    }
  },
  "statusCode": 200,
  "timestamp": "2025-11-12T20:00:00.000Z"
}
```

## Roles Disponíveis

```typescript
enum UserRole {
  PRODUCER = 'PRODUCER',      // Produtor de conteúdo
  AFFILIATE = 'AFFILIATE',    // Afiliado
  COPRODUCER = 'COPRODUCER',  // Coprodutor
  PLATFORM = 'PLATFORM'       // Plataforma
}
```

## Próximos Passos

### Melhorias Futuras
1. ⏳ Rate limiting para endpoints de autenticação
2. ⏳ Refresh tokens
3. ⏳ Two-factor authentication (2FA)
4. ⏳ Email verification
5. ⏳ Password reset flow
6. ⏳ Audit log de autenticações

### Integrações com Outros Módulos
- Payment Module: Verificar role do usuário para criar pagamentos
- Balance Module: Vincular saldo ao usuário autenticado
- Tax Module: Aplicar taxas baseadas no role do usuário

## Referências

- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Passport JWT Strategy](http://www.passportjs.org/packages/passport-jwt/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

