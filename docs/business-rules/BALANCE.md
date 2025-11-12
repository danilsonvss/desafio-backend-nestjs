# Regras de Negócio - Saldos (Balance)

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

## 🔄 Fluxo de Operação de Balance

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

