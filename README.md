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

```
src/
├── auth/                    # Módulo de autenticação
│   ├── domain/             # Camada de domínio (DDD)
│   │   ├── entities/       # Entidades
│   │   ├── repositories/   # Interfaces de repositórios
│   │   └── services/       # Interfaces de serviços
│   ├── application/        # Camada de aplicação
│   │   └── use-cases/      # Casos de uso
│   ├── infrastructure/     # Camada de infraestrutura
│   │   ├── repositories/   # Implementações de repositórios
│   │   └── services/       # Implementações de serviços
│   └── presentation/       # Camada de apresentação
│       ├── controllers/    # Controllers
│       ├── dto/            # Data Transfer Objects
│       ├── guards/         # Guards de autenticação
│       └── strategies/     # Estratégias de autenticação
├── shared/                 # Código compartilhado
│   └── infrastructure/     # Infraestrutura compartilhada
│       └── prisma/         # Prisma Service
└── main.ts                 # Arquivo principal
```

## 🔐 Autenticação

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

#### POST /auth/login
Autentica um usuário e retorna um token JWT.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "PRODUCER"
  }
}
```

### Uso do Token

Inclua o token no header das requisições:
```
Authorization: Bearer <token>
```

## 📚 Documentação

A documentação das regras de negócio está disponível em `docs/auth-business-rules.md`.

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
