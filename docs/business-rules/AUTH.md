# Regras de Negócio - Autenticação e Usuários

## 🔐 Autenticação e Autorização

### Regras de Autenticação

#### RN-AUTH-001: Autenticação JWT Obrigatória
- **Descrição**: Todas as rotas protegidas requerem um token JWT válido no header `Authorization: Bearer <token>`
- **Aplicação**: Rotas de Balance, Tax, Affiliation, Coproduction e Payment
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
- **Aplicação**: Usado para identificação e controle de acesso
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

