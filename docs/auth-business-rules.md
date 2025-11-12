# Regras de Negócio - Módulo de Autenticação

## Visão Geral

O módulo de autenticação é responsável por gerenciar o cadastro e autenticação de usuários no sistema, suportando diferentes perfis de usuário conforme as regras de negócio.

## Perfis de Usuário (Roles)

O sistema suporta os seguintes perfis de usuário:

- **PRODUCER**: Produtor de conteúdo
- **AFFILIATE**: Afiliado
- **COPRODUCER**: Coprodutor
- **PLATFORM**: Plataforma

## Regras de Cadastro (Register)

1. **Email único**: Cada email pode ser cadastrado apenas uma vez no sistema
2. **Validação de email**: O email deve estar em formato válido
3. **Senha mínima**: A senha deve ter no mínimo 6 caracteres
4. **Hash de senha**: A senha deve ser armazenada usando hash bcrypt (10 rounds)
5. **Campos obrigatórios**: email, password, name e role são obrigatórios
6. **Role válida**: O role deve ser um dos valores do enum UserRole

## Regras de Login

1. **Credenciais válidas**: Email e senha devem corresponder a um usuário cadastrado
2. **Validação de senha**: A senha fornecida deve corresponder ao hash armazenado
3. **Token JWT**: Após login bem-sucedido, um token JWT é gerado com:
   - Payload contendo: sub (user id), email, role
   - Expiração configurável via variável de ambiente (padrão: 7 dias)
4. **Segurança**: Mensagens de erro genéricas para evitar enumeração de usuários

## Segurança

1. **LGPD Compliance**:
   - Senhas nunca são retornadas nas respostas da API
   - Dados sensíveis são armazenados com hash/criptografia

2. **Armazenamento de Senhas**:
   - Uso de bcrypt com salt rounds = 10
   - Senhas nunca são armazenadas em texto plano

3. **JWT**:
   - Secret configurável via variável de ambiente
   - Validação de token em todas as rotas protegidas
   - Estratégia de validação via Passport JWT

## Estrutura de Dados

### User Entity
- `id`: UUID (gerado automaticamente)
- `email`: String (único)
- `password`: String (hash bcrypt)
- `name`: String
- `role`: UserRole (enum)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Balance (relacionado)
- Cada usuário pode ter um saldo associado
- Criado automaticamente quando necessário (futuro)

## Endpoints

### POST /auth/register
- **Descrição**: Registra um novo usuário
- **Body**: RegisterUserDto
- **Resposta**: Dados do usuário criado (sem senha)
- **Status Codes**:
  - 201: Usuário criado com sucesso
  - 409: Email já existe
  - 400: Dados inválidos

### POST /auth/login
- **Descrição**: Autentica um usuário
- **Body**: LoginDto
- **Resposta**: Token JWT e dados do usuário
- **Status Codes**:
  - 200: Login bem-sucedido
  - 401: Credenciais inválidas
  - 400: Dados inválidos

## Guards e Decorators

### JwtAuthGuard
- Protege rotas que requerem autenticação
- Valida o token JWT no header Authorization

### RolesGuard
- Protege rotas que requerem roles específicos
- Usado em conjunto com o decorator @Roles()

### @Roles(...roles)
- Decorator para especificar roles permitidos em uma rota
- Exemplo: `@Roles(UserRole.PRODUCER, UserRole.PLATFORM)`

### @CurrentUser()
- Decorator para obter o usuário atual da requisição
- Retorna os dados do usuário autenticado

