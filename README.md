# Desafio Backend NestJS

API RESTful desenvolvida com Node.js, TypeScript, NestJS, Prisma e PostgreSQL seguindo os princípios de DDD (Domain-Driven Design) e TDD (Test-Driven Development).

## 🚀 Tecnologias

- **Node.js** com TypeScript
- **NestJS** - Framework Node.js
- **PostgreSQL** - Banco de dados
- **Prisma** - ORM
- **Docker** - Containerização
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas

## 📋 Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- npm ou yarn

## 🐳 Executando com Docker

### Desenvolvimento

1. Clone o repositório:
```bash
git clone <repository-url>
cd desafio-backend-nestjs
```

2. Copie o arquivo de exemplo de variáveis de ambiente:
```bash
cp .env.example .env
```

3. Inicie os containers:
```bash
npm run docker:dev
```

Isso irá:
- Subir o PostgreSQL
- Subir a aplicação em modo desenvolvimento
- Executar as migrações automaticamente

### Produção

1. Configure as variáveis de ambiente no arquivo `.env`

2. Inicie os containers:
```bash
npm run docker:up
```

3. Para parar os containers:
```bash
npm run docker:down
```

## 💻 Executando Localmente (sem Docker)

1. Instale as dependências:
```bash
npm install
```

2. Configure o banco de dados PostgreSQL localmente

3. Configure as variáveis de ambiente no arquivo `.env`

4. Gere o Prisma Client:
```bash
npm run prisma:generate
```

5. Execute as migrações:
```bash
npm run prisma:migrate
```

6. Inicie a aplicação:
```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## 🗄️ Banco de Dados

### Migrações

```bash
# Criar nova migração
npm run prisma:migrate

# Aplicar migrações em produção
npm run prisma:migrate:deploy

# Abrir Prisma Studio (interface visual do banco)
npm run prisma:studio
```

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes com cobertura
npm run test:cov

# Testes E2E
npm run test:e2e

# Testes em modo watch
npm run test:watch
```

## 📁 Estrutura do Projeto

O projeto segue uma arquitetura modular baseada em DDD e Clean Architecture:

```
src/
├── main.ts                          # Arquivo principal com configuração do Swagger
├── app.module.ts                    # Módulo raiz com global filters e interceptors
│
├── shared/                          # Módulo compartilhado (Global)
│   ├── shared.module.ts            # @Global module
│   ├── constants/
│   │   └── injection-tokens.ts     # Tokens de injeção centralizados
│   ├── domain/
│   │   └── enums/                  # Enums compartilhados
│   ├── infrastructure/
│   │   └── prisma/                 # Prisma Service (global)
│   └── presentation/
│       ├── filters/
│       │   └── http-exception.filter.ts  # Tratamento global de erros
│       └── interceptors/
│           └── transform.interceptor.ts   # Padronização de respostas
│
├── health/                          # Módulo de health check
│   └── health.controller.ts        # GET /health
│
├── auth/                            # Módulo de autenticação ✅
│   ├── domain/                      # Entities, Repositories, Services
│   ├── application/                 # Use Cases
│   ├── infrastructure/              # Implementações Prisma
│   └── presentation/                # Controllers, DTOs, Guards
│
├── balance/                         # Módulo de saldos ✅
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
│
├── tax/                             # Módulo de taxas ✅
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
│
├── affiliation/                     # Módulo de afiliação e coprodução ✅
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
│
└── payment/                         # Módulo de pagamentos ✅
    ├── domain/
    ├── application/
    ├── infrastructure/
    └── presentation/
```

Cada módulo segue a estrutura DDD com 4 camadas:
- **Domain**: Entidades e interfaces (regras de negócio)
- **Application**: Use Cases (orquestração)
- **Infrastructure**: Implementações (Prisma, serviços externos)
- **Presentation**: Controllers, DTOs, Guards (HTTP)

## 🔐 Autenticação

### Formato de Resposta da API

Todas as respostas da API seguem um formato padronizado:

```json
{
  "data": {
    // Dados reais da resposta
  },
  "statusCode": 200,
  "timestamp": "2025-11-12T20:00:00.000Z"
}
```

### Endpoints

#### POST /auth/register
Registra um novo usuário.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "role": "PRODUCER"
}
```

**Roles disponíveis:** `PRODUCER`, `AFFILIATE`, `COPRODUCER`, `PLATFORM`

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

#### POST /auth/login
Autentica um usuário e retorna um token JWT.

**Body:**
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

#### GET /health
Verifica o status da aplicação.

**Response (200):**
```json
{
  "data": {
    "status": "ok",
    "timestamp": "2025-11-12T20:00:00.000Z",
    "uptime": 123.456,
    "environment": "development"
  },
  "statusCode": 200,
  "timestamp": "2025-11-12T20:00:00.000Z"
}
```

### Uso do Token

Inclua o token no header das requisições protegidas:
```
Authorization: Bearer <token>
```

### Tratamento de Erros

Todos os erros seguem um formato consistente:

```json
{
  "statusCode": 400,
  "timestamp": "2025-11-12T20:00:00.000Z",
  "path": "/auth/register",
  "message": "Email already exists",
  "error": "ConflictException"
}
```

## 📚 Documentação

### Swagger/OpenAPI

A documentação interativa da API está disponível através do Swagger UI:

- **URL**: `http://localhost:3000/api`
- **Descrição**: Documentação completa de todos os endpoints, DTOs, schemas e exemplos
- **Autenticação**: Use o botão "Authorize" para adicionar o token JWT e testar endpoints protegidos

### Documentos Disponíveis

- **📋 Regras de Negócio**: `docs/BUSINESS_RULES.md` - Índice centralizado de todas as regras de negócio
  - `docs/business-rules/AUTH.md` - Autenticação e usuários
  - `docs/business-rules/BALANCE.md` - Gerenciamento de saldos
  - `docs/business-rules/TAX.md` - Configuração e cálculo de taxas
  - `docs/business-rules/AFFILIATION.md` - Afiliação e coprodução
  - `docs/business-rules/PAYMENT.md` - Processamento de pagamentos
- **🏗️ Arquitetura**: `docs/ARCHITECTURE.md` - Documentação completa da arquitetura do sistema

### Arquitetura

O projeto segue os princípios de:
- **DDD (Domain-Driven Design)**: Separação em camadas de domínio, aplicação, infraestrutura e apresentação
- **Clean Architecture**: Dependências apontam para dentro (domínio não depende de nada)
- **SOLID**: Inversão de dependências, responsabilidade única, etc.
- **TDD**: Desenvolvimento orientado a testes

### Status do Projeto

✅ **Todos os módulos principais implementados e testados**

- ✅ **Autenticação**: Cadastro, login, JWT, guards e decorators
- ✅ **Saldos**: Operações de crédito/débito, validações, criação automática
- ✅ **Taxas**: CRUD completo, cálculo por país e tipo, normalização
- ✅ **Afiliação e Coprodução**: Relacionamentos entre produtores, afiliados e coprodutores
- ✅ **Pagamentos**: Processamento completo com cálculo automático de taxas e comissões
- ✅ **Swagger**: Documentação interativa completa de todos os endpoints

### Regras de Negócio

Todas as regras de negócio estão documentadas em `docs/BUSINESS_RULES.md` e organizadas por módulo:

- 🔐 **Autenticação e Usuários** (`docs/business-rules/AUTH.md`): JWT, cadastro, login, segurança
- 💰 **Saldos** (`docs/business-rules/BALANCE.md`): Operações, validações, regras de saldo
- 💳 **Taxas** (`docs/business-rules/TAX.md`): Criação, atualização, cálculo, tipos
- 🤝 **Afiliação e Coprodução** (`docs/business-rules/AFFILIATION.md`): Relacionamentos e comissões
- 💸 **Pagamentos** (`docs/business-rules/PAYMENT.md`): Processamento, taxas, comissões, distribuição

### Cobertura de Testes

- ✅ **Testes Unitários**: 212 testes em 34 suites
- ✅ **Testes E2E**: 63 testes em 7 suites
- ✅ **Cobertura**: Todas as camadas testadas
- ✅ **Módulos Testados**: Auth, Balance, Tax, Affiliation, Payment, Health, Shared

## 🛠️ Scripts Disponíveis

- `npm run build` - Compila o projeto
- `npm run start:dev` - Inicia em modo desenvolvimento
- `npm run start:prod` - Inicia em modo produção
- `npm run test` - Executa testes unitários
- `npm run test:cov` - Executa testes com cobertura
- `npm run test:e2e` - Executa testes E2E
- `npm run prisma:generate` - Gera o Prisma Client
- `npm run prisma:migrate` - Executa migrações
- `npm run prisma:studio` - Abre o Prisma Studio
- `npm run docker:up` - Sobe containers Docker
- `npm run docker:down` - Para containers Docker
- `npm run docker:dev` - Sobe containers em modo desenvolvimento
- `npm run docker:logs` - Mostra logs dos containers

## 📝 Licença

Este projeto é privado e não licenciado.
