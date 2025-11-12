# Regras de Negócio

Este documento descreve todas as regras de negócio implementadas no sistema de gateway de pagamentos.

## 📋 Índice

1. [Autenticação e Autorização](#autenticação-e-autorização)
2. [Usuários](#usuários)
3. [Saldos (Balance)](#saldos-balance)
4. [Taxas](#taxas)
5. [Pagamentos (Futuro)](#pagamentos-futuro)
6. [Comissões (Futuro)](#comissões-futuro)
7. [Afiliação e Coprodução (Futuro)](#afiliação-e-coprodução-futuro)

---

## 🔐 Autenticação e Autorização

### Regras de Autenticação

#### RN-AUTH-001: Autenticação JWT Obrigatória
- **Descrição**: Todas as rotas protegidas requerem um token JWT válido no header `Authorization: Bearer <token>`
- **Aplicação**: Rotas de Balance, Tax e futuras rotas de Payment
- **Exceções**: Rotas públicas (`/auth/register`, `/auth/login`, `/health`)
- **Erro**: `401 Unauthorized` quando token ausente ou inválido

#### RN-AUTH-002: Validade do Token
- **Descrição**: Tokens JWT têm validade configurável via variável de ambiente `JWT_EXPIRES_IN`
- **Padrão**: 7 dias
- **Formato**: String no formato do `jsonwebtoken` (ex: "7d", "24h", "3600s")
- **Erro**: `401 Unauthorized` quando token expirado

#### RN-AUTH-003: Validação de Usuário no Token
- **Descrição**: Ao validar o token, o sistema verifica se o usuário ainda existe no banco de dados
- **Aplicação**: `JwtStrategy.validate()` busca o usuário pelo ID do payload
- **Erro**: `401 Unauthorized` quando usuário não encontrado

### Regras de Autorização

#### RN-AUTH-004: Acesso ao Próprio Recurso
- **Descrição**: Usuários só podem acessar seus próprios recursos (ex: balance próprio)
- **Aplicação**: Balance Module - usuário obtido do token JWT
- **Implementação**: `@CurrentUser()` decorator extrai usuário do request após autenticação

#### RN-AUTH-005: Roles de Usuário
- **Descrição**: Sistema suporta 4 roles: `PRODUCER`, `AFFILIATE`, `COPRODUCER`, `PLATFORM`
- **Aplicação**: Atualmente usado para identificação, futuramente para autorização
- **Validação**: Role deve ser um dos valores válidos do enum `UserRole`

---

## 👤 Usuários

### Regras de Cadastro

#### RN-USER-001: Email Único
- **Descrição**: Cada email pode ser cadastrado apenas uma vez no sistema
- **Validação**: Constraint único no banco de dados
- **Erro**: `409 Conflict` quando email já existe
- **Mensagem**: "Email already registered"

#### RN-USER-002: Validação de Email
- **Descrição**: Email deve seguir formato válido (RFC 5322)
- **Validação**: `@IsEmail()` do class-validator
- **Erro**: `400 Bad Request` quando formato inválido

#### RN-USER-003: Validação de Senha
- **Descrição**: Senha deve ter no mínimo 6 caracteres
- **Validação**: `@MinLength(6)` do class-validator
- **Erro**: `400 Bad Request` quando senha muito curta
- **Mensagem**: "password must be longer than or equal to 6 characters"

#### RN-USER-004: Hash de Senha
- **Descrição**: Senhas são armazenadas com hash bcrypt (10 rounds)
- **Aplicação**: `BcryptPasswordHashService`
- **Segurança**: Senha nunca é retornada nas respostas da API
- **Validação**: Hash é gerado antes de salvar no banco

#### RN-USER-005: Campos Obrigatórios
- **Descrição**: Email, senha, nome e role são obrigatórios no cadastro
- **Validação**: `@IsNotEmpty()` do class-validator
- **Erro**: `400 Bad Request` quando campo ausente

### Regras de Login

#### RN-USER-006: Validação de Credenciais
- **Descrição**: Login requer email e senha válidos
- **Validação**: 
  1. Busca usuário por email
  2. Compara senha fornecida com hash armazenado
- **Erro**: `401 Unauthorized` quando credenciais inválidas
- **Mensagem**: "Invalid credentials"

#### RN-USER-007: Geração de Token
- **Descrição**: Após login bem-sucedido, sistema gera token JWT
- **Payload**: `{ sub: userId, email, role }`
- **Resposta**: Token + dados do usuário (sem senha)

---

## 💰 Saldos (Balance)

### Regras de Criação

#### RN-BAL-001: Balance Automático
- **Descrição**: Balance é criado automaticamente na primeira operação (crédito ou débito)
- **Valor Inicial**: 0 (zero)
- **Aplicação**: `CreateOrUpdateBalanceUseCase` verifica existência antes de operar

#### RN-BAL-002: Um Balance por Usuário
- **Descrição**: Cada usuário possui exatamente um balance
- **Validação**: Constraint único `userId` no banco de dados
- **Relacionamento**: `User 1:1 Balance` (cascade delete)

### Regras de Operações

#### RN-BAL-003: Saldo Não Negativo
- **Descrição**: Saldo nunca pode ser negativo
- **Validação**: 
  - Na entidade: `validateAmount()` verifica `amount >= 0`
  - No débito: verifica saldo suficiente antes de debitar
- **Erro**: `400 Bad Request` - "Insufficient balance" quando tentativa de débito maior que saldo

#### RN-BAL-004: Valores Positivos
- **Descrição**: Valores de crédito e débito devem ser positivos (> 0)
- **Validação**: 
  - Crédito: `amount > 0` - "Credit amount must be positive"
  - Débito: `amount > 0` - "Debit amount must be positive"
- **Erro**: `400 Bad Request` quando valor <= 0

#### RN-BAL-005: Operação de Crédito
- **Descrição**: Adiciona valor ao saldo atual
- **Fórmula**: `novoSaldo = saldoAtual + valorCredito`
- **Validação**: Apenas valor positivo
- **Atualização**: `updatedAt` é atualizado automaticamente

#### RN-BAL-006: Operação de Débito
- **Descrição**: Subtrai valor do saldo atual
- **Fórmula**: `novoSaldo = saldoAtual - valorDebito`
- **Validações**:
  1. Valor deve ser positivo
  2. Saldo deve ser suficiente (`saldoAtual >= valorDebito`)
- **Erro**: `400 Bad Request` - "Insufficient balance" quando saldo insuficiente
- **Atualização**: `updatedAt` é atualizado automaticamente

#### RN-BAL-007: Imutabilidade da Entidade
- **Descrição**: Operações de crédito/débito retornam nova instância da entidade
- **Aplicação**: Métodos `credit()` e `debit()` retornam `new BalanceEntity`
- **Benefício**: Thread-safe, permite auditoria, facilita testes

#### RN-BAL-008: Precisão Decimal
- **Descrição**: Saldos são armazenados com precisão de 2 casas decimais
- **Tipo**: `Decimal(10, 2)` no banco de dados
- **Suporte**: Valores de 0.00 até 99.999.999,99
- **Conversão**: Prisma Decimal é convertido para number na entidade

### Regras de Consulta

#### RN-BAL-009: Consulta de Saldo
- **Descrição**: Usuário autenticado pode consultar apenas seu próprio saldo
- **Endpoint**: `GET /balance`
- **Autenticação**: Obrigatória (JWT)
- **Erro**: `404 Not Found` quando balance não existe (antes da primeira operação)

---

## 💳 Taxas

### Regras de Criação

#### RN-TAX-001: Taxa Única por País e Tipo
- **Descrição**: Não pode existir duas taxas com mesmo país e tipo
- **Validação**: Constraint único `(country, type)` no banco de dados
- **Erro**: `409 Conflict` - "Tax already exists for country X and type Y"
- **Aplicação**: `CreateTaxUseCase` verifica existência antes de criar

#### RN-TAX-002: Percentual Válido
- **Descrição**: Percentual deve estar entre 0 e 100 (inclusive)
- **Validação**: 
  - Na entidade: `percentage >= 0 && percentage <= 100`
  - No DTO: `@Min(0)` e `@Max(100)`
- **Erro**: `400 Bad Request` - "Percentage must be between 0 and 100"

#### RN-TAX-003: País Normalizado
- **Descrição**: País é automaticamente convertido para UPPERCASE e trim
- **Aplicação**: `TaxEntity.create()` normaliza o país
- **Exemplo**: "br " → "BR", "  us  " → "US"

#### RN-TAX-004: Tipos de Taxa
- **Descrição**: Sistema suporta 2 tipos de taxa:
  - `TRANSACTION`: Taxa sobre transação (ex: taxa de processamento)
  - `PLATFORM`: Taxa da plataforma (ex: comissão da plataforma)
- **Validação**: Enum `TaxType` - apenas valores válidos
- **Erro**: `400 Bad Request` quando tipo inválido

#### RN-TAX-005: Campos Obrigatórios
- **Descrição**: Country, type e percentage são obrigatórios
- **Validação**: `@IsNotEmpty()` e `@IsEnum()` do class-validator
- **Erro**: `400 Bad Request` quando campo ausente ou inválido

### Regras de Atualização

#### RN-TAX-006: Atualização de Percentual
- **Descrição**: Apenas o percentual pode ser atualizado
- **Restrições**: 
  - Country e type são imutáveis
  - Para alterar country/type, deve criar nova taxa e deletar a antiga
- **Validação**: Percentual deve estar entre 0 e 100
- **Erro**: `404 Not Found` quando taxa não existe

#### RN-TAX-007: Imutabilidade de País e Tipo
- **Descrição**: País e tipo não podem ser alterados após criação
- **Justificativa**: Mantém integridade histórica e evita conflitos
- **Solução**: Criar nova taxa com país/tipo diferentes

### Regras de Consulta

#### RN-TAX-008: Busca por País e Tipo
- **Descrição**: Taxa é identificada unicamente por (country, type)
- **Endpoint**: `GET /taxes/:country/:type`
- **Erro**: `404 Not Found` quando taxa não existe
- **Aplicação**: Usado no cálculo de taxas em pagamentos

#### RN-TAX-009: Listagem de Taxas
- **Descrição**: Lista todas as taxas ou filtra por país
- **Endpoint**: `GET /taxes` ou `GET /taxes?country=BR`
- **Ordenação**: Por país (asc) e tipo (asc)
- **Filtro**: Quando country fornecido, retorna apenas taxas daquele país

### Regras de Cálculo

#### RN-TAX-010: Cálculo de Taxa
- **Descrição**: Taxa é calculada como percentual do valor
- **Fórmula**: `taxa = (valor * percentual) / 100`
- **Método**: `TaxEntity.calculateTax(amount: number): number`
- **Exemplo**: Valor R$ 1000, taxa 5% → Taxa = R$ 50
- **Precisão**: Resultado pode ter casas decimais

#### RN-TAX-011: Taxa Zero
- **Descrição**: Taxa com percentual 0 retorna valor 0
- **Aplicação**: Permite isenção de taxas para países específicos
- **Validação**: Percentual 0 é válido (entre 0 e 100)

---

## 💸 Pagamentos (Futuro)

### Regras Planejadas

#### RN-PAY-001: Aprovação Imediata
- **Descrição**: Pagamentos são aprovados imediatamente (simulação)
- **Aplicação**: Não integrar com adquirentes reais
- **Status**: Sempre "APPROVED" para fins de teste

#### RN-PAY-002: Cálculo de Taxas por País
- **Descrição**: Taxa é calculada baseada no país da transação
- **Aplicação**: 
  1. Buscar taxa por país e tipo TRANSACTION
  2. Calcular valor da taxa: `taxa = valor * percentual / 100`
  3. Aplicar taxa ao valor da transação
- **Valor Final**: `valorFinal = valorOriginal + taxa`

#### RN-PAY-003: Participantes do Pagamento
- **Descrição**: Pagamento envolve múltiplos participantes:
  - Produtor (obrigatório)
  - Afiliado (opcional)
  - Coprodutor (opcional)
  - Plataforma (sempre presente)
- **Validação**: Produtor deve existir e estar ativo

#### RN-PAY-004: Distribuição de Valores
- **Descrição**: Valor do pagamento é distribuído entre participantes
- **Fórmula**: `valorTotal = valorOriginal + taxas - comissões`
- **Distribuição**:
  1. Calcular taxas (RN-PAY-002)
  2. Calcular comissões para cada participante
  3. Creditar saldos conforme distribuição
  4. Debitar taxas da plataforma (se aplicável)

#### RN-PAY-005: Atualização de Saldos
- **Descrição**: Saldos são atualizados após pagamento aprovado
- **Operações**:
  - Crédito para produtor, afiliado, coprodutor (comissões)
  - Crédito para plataforma (taxa da plataforma)
  - Débito para plataforma (taxa de transação, se aplicável)
- **Atomicidade**: Todas as operações devem ser atômicas (transação)

#### RN-PAY-006: Histórico de Transações
- **Descrição**: Cada pagamento gera registro de transação
- **Campos**: valor, país, participantes, taxas, comissões, data
- **Aplicação**: Auditoria e relatórios futuros

---

## 💵 Comissões (Futuro)

### Regras Planejadas

#### RN-COM-001: Percentuais de Comissão
- **Descrição**: Cada participante tem percentual de comissão configurável
- **Participantes**:
  - Produtor: percentual base (ex: 70%)
  - Afiliado: percentual sobre venda (ex: 10%)
  - Coprodutor: percentual sobre venda (ex: 15%)
  - Plataforma: percentual sobre venda (ex: 5%)
- **Validação**: Soma dos percentuais não deve exceder 100%

#### RN-COM-002: Cálculo de Comissão
- **Descrição**: Comissão é calculada sobre valor líquido (após taxas)
- **Fórmula**: `comissao = valorLiquido * percentual / 100`
- **Valor Líquido**: `valorLiquido = valorOriginal - taxasTransacao`

#### RN-COM-003: Comissão do Produtor
- **Descrição**: Produtor recebe maior percentual (valor base)
- **Aplicação**: Produtor é o criador do produto
- **Cálculo**: Sobre valor líquido após taxas

#### RN-COM-004: Comissão do Afiliado
- **Descrição**: Afiliado recebe comissão apenas se vinculado à venda
- **Aplicação**: Afiliado trouxe o cliente
- **Cálculo**: Percentual configurado sobre valor líquido

#### RN-COM-005: Comissão do Coprodutor
- **Descrição**: Coprodutor recebe comissão se participou da criação
- **Aplicação**: Coprodutor colaborou no produto
- **Cálculo**: Percentual configurado sobre valor líquido

#### RN-COM-006: Comissão da Plataforma
- **Descrição**: Plataforma pode reter comissão além da taxa
- **Aplicação**: Receita da plataforma
- **Cálculo**: Percentual configurado sobre valor líquido

#### RN-COM-007: Validação de Soma
- **Descrição**: Soma de todas as comissões não deve exceder 100%
- **Validação**: `produtor% + afiliado% + coprodutor% + plataforma% <= 100%`
- **Erro**: `400 Bad Request` quando soma excede 100%

---

## 🤝 Afiliação e Coprodução (Futuro)

### Regras Planejadas

#### RN-AFF-001: Relacionamento Produtor-Afiliado
- **Descrição**: Afiliado pode estar vinculado a um produtor
- **Aplicação**: Afiliado promove produtos do produtor
- **Configuração**: Percentual de comissão por relacionamento

#### RN-AFF-002: Relacionamento Produtor-Coprodutor
- **Descrição**: Coprodutor pode estar vinculado a um produtor
- **Aplicação**: Coprodutor colabora na criação do produto
- **Configuração**: Percentual de comissão por relacionamento

#### RN-AFF-003: Múltiplos Afiliados
- **Descrição**: Um produtor pode ter múltiplos afiliados
- **Aplicação**: Diferentes afiliados promovem o mesmo produto
- **Comissão**: Cada afiliado recebe sua comissão quando traz venda

#### RN-AFF-004: Múltiplos Coprodutores
- **Descrição**: Um produto pode ter múltiplos coprodutores
- **Aplicação**: Colaboração entre vários criadores
- **Comissão**: Cada coprodutor recebe sua comissão em todas as vendas

#### RN-AFF-005: Configuração de Percentuais
- **Descrição**: Percentuais de comissão são configuráveis por relacionamento
- **Aplicação**: Diferentes produtos podem ter diferentes percentuais
- **Validação**: Percentuais devem ser válidos (0-100%)

---

## 🔒 Segurança

### Regras de Segurança

#### RN-SEC-001: Hash de Senhas
- **Descrição**: Senhas são armazenadas com hash bcrypt (10 rounds)
- **Aplicação**: `BcryptPasswordHashService`
- **Nunca**: Senha em texto plano no banco ou nas respostas

#### RN-SEC-002: JWT Secret
- **Descrição**: Secret do JWT deve ser configurado via variável de ambiente
- **Variável**: `JWT_SECRET`
- **Padrão**: "default-secret" (apenas para desenvolvimento)
- **Produção**: Deve ser string forte e aleatória

#### RN-SEC-003: Response DTOs
- **Descrição**: DTOs de resposta não expõem dados sensíveis
- **Aplicação**: Senhas nunca retornadas, apenas dados necessários
- **Exemplo**: `UserResponseDto` não inclui campo `password`

#### RN-SEC-004: Validação de Inputs
- **Descrição**: Todos os inputs são validados com class-validator
- **Aplicação**: DTOs com decorators de validação
- **Erro**: `400 Bad Request` quando validação falha

#### RN-SEC-005: Proteção de Rotas
- **Descrição**: Rotas sensíveis requerem autenticação JWT
- **Aplicação**: `@UseGuards(JwtAuthGuard)`
- **Exceções**: Rotas públicas (`/auth/*`, `/health`)

---

## 📊 Validações e Erros

### Códigos de Status HTTP

- **200 OK**: Operação bem-sucedida
- **201 Created**: Recurso criado com sucesso
- **400 Bad Request**: Erro de validação ou regra de negócio
- **401 Unauthorized**: Falha de autenticação
- **404 Not Found**: Recurso não encontrado
- **409 Conflict**: Conflito (ex: email duplicado, taxa duplicada)
- **500 Internal Server Error**: Erro interno do servidor

### Mensagens de Erro Padronizadas

Todas as mensagens de erro seguem o formato:
```json
{
  "statusCode": 400,
  "timestamp": "2025-11-12T20:00:00.000Z",
  "path": "/endpoint",
  "message": "Mensagem de erro descritiva",
  "error": "ExceptionName"
}
```

### Validações Comuns

- **Email**: Formato válido (RFC 5322)
- **Senha**: Mínimo 6 caracteres
- **Percentuais**: Entre 0 e 100 (inclusive)
- **Valores Monetários**: Positivos, precisão de 2 casas decimais
- **Campos Obrigatórios**: Não podem ser vazios ou nulos
- **Enums**: Apenas valores válidos do enum

---

## 📝 Notas de Implementação

### Atomicidade

- Operações de balance devem ser atômicas (transações)
- Pagamentos futuros devem garantir atomicidade em todas as operações

### Imutabilidade

- Entidades de domínio são imutáveis (métodos retornam novas instâncias)
- Facilita auditoria, testes e thread-safety

### Normalização

- Países são normalizados para UPPERCASE
- Emails são normalizados para lowercase (futuro)

### Precisão Decimal

- Valores monetários: `Decimal(10, 2)` - até 99.999.999,99
- Percentuais: `Decimal(5, 2)` - até 999,99%
- Conversão automática de Prisma Decimal para number

---

## 🔄 Fluxos Principais

### Fluxo de Cadastro e Login

```
1. POST /auth/register
   → Valida email, senha, nome, role
   → Hash da senha
   → Cria usuário
   → Retorna UserResponseDto (sem senha)

2. POST /auth/login
   → Valida email e senha
   → Gera token JWT
   → Retorna token + dados do usuário
```

### Fluxo de Operação de Balance

```
1. PATCH /balance (credit)
   → Verifica autenticação
   → Busca ou cria balance
   → Valida valor positivo
   → Credita valor
   → Atualiza saldo
   → Retorna BalanceResponseDto

2. PATCH /balance (debit)
   → Verifica autenticação
   → Busca balance
   → Valida valor positivo
   → Valida saldo suficiente
   → Debita valor
   → Atualiza saldo
   → Retorna BalanceResponseDto
```

### Fluxo de Criação de Taxa

```
1. POST /taxes
   → Verifica autenticação
   → Valida country, type, percentage
   → Normaliza country
   → Verifica se já existe (country, type)
   → Cria taxa
   → Retorna TaxResponseDto
```

### Fluxo de Pagamento (Futuro)

```
1. POST /payment
   → Verifica autenticação
   → Valida valor, país, participantes
   → Busca taxa por país
   → Calcula taxas
   → Calcula comissões
   → Atualiza saldos (transação atômica)
   → Cria registro de transação
   → Retorna PaymentResponseDto
```

---

## 📚 Referências

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

---

**Última Atualização**: 2025-11-12
**Versão**: 1.0.0

