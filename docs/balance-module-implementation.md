# Módulo de Balance - Documentação Técnica

## 📋 Status: ✅ CONCLUÍDO

## Visão Geral

O módulo de Balance gerencia os saldos dos usuários no sistema, permitindo operações de crédito e débito. Implementado seguindo os princípios de DDD (Domain-Driven Design) e Clean Architecture.

## Arquitetura

### Estrutura de Camadas

```
balance/
├── domain/                      # Camada de Domínio
│   ├── entities/
│   │   ├── balance.entity.ts           # Entidade Balance
│   │   └── balance.entity.spec.ts      # Testes (16 testes)
│   └── repositories/
│       └── balance.repository.interface.ts  # Contrato do repositório
│
├── application/                 # Camada de Aplicação
│   └── use-cases/
│       ├── get-balance.use-case.ts             # UC: Consultar saldo
│       ├── get-balance.use-case.spec.ts        # Testes (3 testes)
│       ├── create-or-update-balance.use-case.ts  # UC: Criar/atualizar saldo
│       └── create-or-update-balance.use-case.spec.ts  # Testes (7 testes)
│
├── infrastructure/              # Camada de Infraestrutura
│   └── repositories/
│       ├── prisma-balance.repository.ts      # Implementação Prisma
│       └── prisma-balance.repository.spec.ts  # Testes (10 testes)
│
├── presentation/                # Camada de Apresentação
│   ├── controllers/
│   │   ├── balance.controller.ts         # Controller HTTP
│   │   └── balance.controller.spec.ts    # Testes (4 testes)
│   └── dto/
│       ├── update-balance.dto.ts         # DTO de entrada
│       └── response/
│           ├── balance-response.dto.ts
│           └── balance-response.dto.spec.ts  # Testes (3 testes)
│
└── balance.module.ts                     # Módulo NestJS
```

## Implementação das Camadas

### 1. Camada de Domínio

#### Balance Entity

```typescript
class BalanceEntity {
  - id: string
  - userId: string
  - amount: number
  - createdAt: Date
  - updatedAt: Date
  
  + static create(userId): BalanceEntity
  + static fromPrisma(data): BalanceEntity
  + credit(amount): BalanceEntity
  + debit(amount): BalanceEntity
  + hasAvailableBalance(amount): boolean
  - validateAmount(): void
}
```

**Regras de Negócio:**
- Saldo nunca pode ser negativo
- Operações de crédito e débito devem ser valores positivos
- Entidade imutável (métodos retornam nova instância)
- Validação de saldo suficiente antes de débito

**Testes (16):**
- ✅ Criação de balance
- ✅ Validação de saldo negativo
- ✅ Conversão de Prisma Decimal
- ✅ Operações de crédito
- ✅ Operações de débito
- ✅ Validação de saldo insuficiente
- ✅ Verificação de saldo disponível
- ✅ Validação de valores positivos

### 2. Camada de Aplicação

#### Get Balance Use Case

```typescript
GetBalanceUseCase.execute(userId):
  1. Busca balance por userId no repositório
  2. Se não existir, lança NotFoundException
  3. Retorna BalanceEntity
```

**Testes (3):**
- ✅ Retorna balance existente
- ✅ Lança exceção quando não encontrado
- ✅ Use case definido corretamente

#### Create Or Update Balance Use Case

```typescript
CreateOrUpdateBalanceUseCase.execute(dto):
  1. Busca balance por userId
  2. Se não existir, cria novo com amount = 0
  3. Aplica operação (credit ou debit)
  4. Atualiza no repositório
  5. Retorna BalanceEntity atualizado
```

**DTOs:**
```typescript
interface CreateOrUpdateBalanceDto {
  userId: string;
  amount: number;
  operation: 'credit' | 'debit';
}
```

**Testes (7):**
- ✅ Cria novo balance e credita
- ✅ Credita em balance existente
- ✅ Debita de balance existente
- ✅ Lança exceção para saldo insuficiente
- ✅ Lança exceção para valor negativo no crédito
- ✅ Lança exceção para valor negativo no débito
- ✅ Use case definido corretamente

### 3. Camada de Infraestrutura

#### Prisma Balance Repository

```typescript
class PrismaBalanceRepository implements IBalanceRepository {
  - prisma: PrismaService
  
  + create(balance): Promise<BalanceEntity>
  + findByUserId(userId): Promise<BalanceEntity | null>
  + findById(id): Promise<BalanceEntity | null>
  + update(balance): Promise<BalanceEntity>
  + existsByUserId(userId): Promise<boolean>
}
```

**Implementação:**
- Usa PrismaService global via SharedModule
- Converte Decimal do Prisma para number
- Gerencia tipos do banco de dados
- Isolamento total de detalhes de persistência

**Testes (10):**
- ✅ Cria balance
- ✅ Busca por userId (sucesso e não encontrado)
- ✅ Busca por id (sucesso e não encontrado)
- ✅ Atualiza balance
- ✅ Verifica existência (true e false)
- ✅ Repository definido

### 4. Camada de Apresentação

#### Balance Controller

```typescript
@Controller('balance')
@UseGuards(JwtAuthGuard)
class BalanceController {
  GET /balance
    - Retorna saldo do usuário autenticado
    - Response: BalanceResponseDto (200)
    - Errors: 404 (not found), 401 (unauthorized)
  
  PATCH /balance
    - Atualiza saldo (crédito ou débito)
    - Body: UpdateBalanceDto
    - Response: BalanceResponseDto (200)
    - Errors: 400 (validação), 401 (unauthorized)
}
```

**Proteção:**
- Todas as rotas requerem autenticação (JwtAuthGuard)
- Usuário obtido via decorator @CurrentUser()
- Validação de entrada via ValidationPipe

**DTOs:**

**UpdateBalanceDto (Input):**
```typescript
{
  amount: number;        // @IsPositive
  operation: 'credit' | 'debit';  // @IsIn
}
```

**BalanceResponseDto (Output):**
```typescript
{
  id: string;
  userId: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Testes (4):**
- ✅ Controller definido
- ✅ Retorna saldo do usuário
- ✅ Credita valor ao saldo
- ✅ Debita valor do saldo

## Injeção de Dependências

### Token Centralizado

```typescript
// src/shared/constants/injection-tokens.ts
export const INJECTION_TOKENS = {
  ...
  BALANCE_REPOSITORY: 'IBalanceRepository',
} as const;
```

### Configuração no Módulo

```typescript
@Module({
  controllers: [BalanceController],
  providers: [
    {
      provide: INJECTION_TOKENS.BALANCE_REPOSITORY,
      useClass: PrismaBalanceRepository,
    },
    GetBalanceUseCase,
    CreateOrUpdateBalanceUseCase,
  ],
  exports: [INJECTION_TOKENS.BALANCE_REPOSITORY],
})
export class BalanceModule {}
```

## Integração com Auth Module

O Balance Module usa o sistema de autenticação:
- **JwtAuthGuard**: Protege todas as rotas
- **@CurrentUser()**: Obtém usuário autenticado
- **userId**: Vincula balance ao usuário logado

## Padronização de Respostas

Todas as respostas passam pelo **Transform Interceptor**:

```json
{
  "data": {
    "id": "uuid",
    "userId": "user-uuid",
    "amount": 150.75,
    "createdAt": "2025-11-12T20:00:00.000Z",
    "updatedAt": "2025-11-12T20:10:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2025-11-12T20:10:00.000Z"
}
```

## Tratamento de Erros

Erros passam pelo **HTTP Exception Filter**:

```json
{
  "statusCode": 400,
  "timestamp": "2025-11-12T20:00:00.000Z",
  "path": "/balance",
  "message": "Insufficient balance",
  "error": "BadRequestException"
}
```

## Regras de Negócio

### Operações de Crédito
1. Valor deve ser positivo
2. Cria balance automaticamente se não existir
3. Adiciona valor ao saldo atual
4. Atualiza timestamp

### Operações de Débito
1. Valor deve ser positivo
2. Balance deve existir previamente
3. Saldo deve ser suficiente
4. Subtrai valor do saldo atual
5. Atualiza timestamp

### Validações
- Saldo nunca pode ser negativo
- Valores de operação devem ser > 0
- Operation deve ser 'credit' ou 'debit'
- Usuário deve estar autenticado

## Banco de Dados

### Schema Prisma

```prisma
model Balance {
  id        String   @id @default(uuid())
  userId    String   @unique
  amount    Decimal  @default(0) @db.Decimal(10, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("balances")
}
```

**Características:**
- Decimal(10, 2): Suporta valores até 99.999.999,99
- userId único: Um balance por usuário
- Cascade delete: Balance deletado quando usuário é removido
- Default amount: 0

### Conversão Decimal

O Prisma retorna Decimal como objeto especial. A entidade converte para number:

```typescript
static fromPrisma(data) {
  let amount: number;
  
  if (typeof data.amount === 'string') {
    amount = parseFloat(data.amount);
  } else if (data.amount.toNumber) {
    amount = data.amount.toNumber();  // Prisma Decimal
  } else {
    amount = Number(data.amount);
  }
  // ...
}
```

## Testes

### Cobertura de Testes

#### Testes Unitários (43 testes)
- ✅ BalanceEntity (16 testes)
- ✅ GetBalanceUseCase (3 testes)
- ✅ CreateOrUpdateBalanceUseCase (7 testes)
- ✅ PrismaBalanceRepository (10 testes)
- ✅ BalanceController (4 testes)
- ✅ BalanceResponseDto (3 testes)

#### Testes E2E (14 testes)
- ✅ GET /balance - balance não existe (404)
- ✅ GET /balance - balance existente
- ✅ GET /balance - requer autenticação
- ✅ PATCH /balance - criar e creditar
- ✅ PATCH /balance - debitar
- ✅ PATCH /balance - saldo insuficiente (400)
- ✅ PATCH /balance - validação de valor positivo
- ✅ PATCH /balance - validação de operation
- ✅ PATCH /balance - campo amount obrigatório
- ✅ PATCH /balance - campo operation obrigatório
- ✅ PATCH /balance - requer autenticação
- ✅ PATCH /balance - valores decimais
- ✅ Fluxo - múltiplos créditos
- ✅ Fluxo - créditos e débitos misturados

### Execução dos Testes

```bash
# Testes unitários do balance
npm test -- balance

# Testes E2E do balance
npm run test:e2e -- balance

# Todos os testes
npm test && npm run test:e2e
```

## Endpoints da API

### GET /balance

Retorna o saldo do usuário autenticado.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "data": {
    "id": "balance-uuid",
    "userId": "user-uuid",
    "amount": 250.50,
    "createdAt": "2025-11-12T20:00:00.000Z",
    "updatedAt": "2025-11-12T20:05:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2025-11-12T20:05:00.000Z"
}
```

**Errors:**
- `401 Unauthorized`: Token inválido ou ausente
- `404 Not Found`: Balance não existe para o usuário

### PATCH /balance

Atualiza o saldo do usuário autenticado (crédito ou débito).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Body:**
```json
{
  "amount": 100.50,
  "operation": "credit"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "balance-uuid",
    "userId": "user-uuid",
    "amount": 350.50,
    "createdAt": "2025-11-12T20:00:00.000Z",
    "updatedAt": "2025-11-12T20:06:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2025-11-12T20:06:00.000Z"
}
```

**Errors:**
- `400 Bad Request`: 
  - Saldo insuficiente
  - Valor não positivo
  - Operation inválida
  - Campos obrigatórios ausentes
- `401 Unauthorized`: Token inválido ou ausente

## Fluxo de Uso

### 1. Criar Balance com Crédito Inicial

```bash
# Login
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Response: { accessToken: "..." }

# Creditar saldo inicial
PATCH /balance
Authorization: Bearer <token>
{
  "amount": 1000,
  "operation": "credit"
}
```

### 2. Consultar Saldo

```bash
GET /balance
Authorization: Bearer <token>

# Response: { amount: 1000 }
```

### 3. Debitar Valor

```bash
PATCH /balance
Authorization: Bearer <token>
{
  "amount": 150.50,
  "operation": "debit"
}

# Response: { amount: 849.50 }
```

## Integração com Payment Module (Futuro)

Quando um pagamento for processado:

1. **Comissões Creditadas:**
```typescript
await createOrUpdateBalanceUseCase.execute({
  userId: producerId,
  amount: commissionAmount,
  operation: 'credit'
});
```

2. **Taxas Debitadas (se aplicável):**
```typescript
await createOrUpdateBalanceUseCase.execute({
  userId: platformId,
  amount: feeAmount,
  operation: 'debit'
});
```

## Segurança

### Autenticação
- ✅ JWT obrigatório em todas as rotas
- ✅ Usuário obtido do token
- ✅ Balance vinculado ao userId do token

### Autorização
- ✅ Usuário só acessa seu próprio balance
- ✅ Não é possível acessar balance de outros usuários

### Validação
- ✅ class-validator em todos os inputs
- ✅ Validação de tipos e valores
- ✅ Mensagens de erro informativas

## Performance

### Otimizações
- Índice único em `userId` para busca rápida
- PrismaService global (conexão única)
- Entidade imutável (thread-safe)

### Considerações
- Operações atômicas no banco
- Validações na entidade de domínio
- Repository pattern para cache futuro

## Melhorias Futuras

1. **Histórico de Transações**
   - Criar tabela BalanceTransaction
   - Registrar todas as operações
   - Auditoria completa

2. **Saque/Withdrawal**
   - Use case para sacar valores
   - Integração com gateway de pagamento
   - Validações adicionais

3. **Limites e Regras**
   - Limite mínimo de saldo
   - Limite máximo de crédito
   - Configurações por role

4. **Relatórios**
   - Extrato por período
   - Gráficos de evolução
   - Export para PDF/CSV

5. **Eventos**
   - Emitir eventos em operações
   - Event sourcing
   - Integração com message broker

## Referências

- [Prisma Decimal](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#decimal)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

