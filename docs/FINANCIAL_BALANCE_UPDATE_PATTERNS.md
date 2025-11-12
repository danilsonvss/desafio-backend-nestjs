# Padrões de Segurança Numérica para Atualização de Saldos em Sistemas Financeiros

## 🎯 Padrões Mais Usados e Seguros

### 1. **Decimal/BigDecimal para Valores Monetários** ⭐⭐⭐⭐⭐

**Por quê?**
- JavaScript `number` usa IEEE 754 (ponto flutuante binário)
- Pode causar erros de arredondamento: `0.1 + 0.2 = 0.30000000000000004`
- Em sistemas financeiros, precisão é crítica

**Solução:**
- Usar `Decimal` do Prisma (baseado em `decimal.js` ou `big.js`)
- Armazenar no banco como `DECIMAL(precision, scale)`
- Exemplo: `DECIMAL(10, 2)` = até 99.999.999,99

**Status atual:**
- ✅ Banco de dados: Usa `DECIMAL(10, 2)`
- ⚠️ Aplicação: Converte para `number` (JavaScript)
- 🔧 **Melhoria necessária**: Manter `Decimal` na aplicação

---

### 2. **Transações ACID Atômicas** ⭐⭐⭐⭐⭐

**Por quê?**
- Múltiplas atualizações de saldo devem ser atômicas
- Se uma falhar, todas devem ser revertidas
- Garante consistência dos dados

**Padrão atual:**
```typescript
// ❌ PROBLEMA: Não é atômico
await updateBalance(producer);
await updateBalance(affiliate);
await updateBalance(coproducer);
// Se o terceiro falhar, os dois primeiros já foram commitados
```

**Solução:**
```typescript
// ✅ CORRETO: Transação única
await prisma.$transaction(async (tx) => {
  await updateBalance(producer, tx);
  await updateBalance(affiliate, tx);
  await updateBalance(coproducer, tx);
});
```

**Status atual:**
- ❌ Não usa transações
- 🔧 **Melhoria necessária**: Envolver todas as atualizações em uma transação

---

### 3. **Atualização Atômica no Banco (UPDATE com Cálculo)** ⭐⭐⭐⭐⭐

**Por quê?**
- Evita race conditions
- Garante que o cálculo seja feito no banco de dados
- Mais eficiente que READ-MODIFY-WRITE

**Padrão atual:**
```typescript
// ❌ PROBLEMA: READ-MODIFY-WRITE (vulnerável a race conditions)
const balance = await findByUserId(userId);
const newBalance = balance.credit(amount);
await update(newBalance);
```

**Solução:**
```sql
-- ✅ CORRETO: Atualização atômica no banco
UPDATE balances 
SET amount = amount + :credit_amount
WHERE user_id = :user_id
RETURNING *;
```

**Com Prisma:**
```typescript
// ✅ Usando increment atômico
await prisma.balance.update({
  where: { userId },
  data: {
    amount: { increment: creditAmount }
  }
});
```

**Status atual:**
- ❌ Usa READ-MODIFY-WRITE
- 🔧 **Melhoria necessária**: Usar `increment` ou SQL direto

---

### 4. **Locking para Prevenir Race Conditions** ⭐⭐⭐⭐

**Por quê?**
- Múltiplas requisições simultâneas podem causar perda de atualizações
- Duas transações podem ler o mesmo valor e sobrescrever uma à outra

**Tipos de Locking:**

#### 4.1. Pessimistic Locking
```sql
SELECT * FROM balances 
WHERE user_id = :user_id 
FOR UPDATE;  -- Bloqueia a linha até o commit
```

#### 4.2. Optimistic Locking
```sql
UPDATE balances 
SET amount = amount + :credit, version = version + 1
WHERE user_id = :user_id AND version = :expected_version;
-- Se version mudou, retorna 0 linhas afetadas
```

**Status atual:**
- ❌ Não implementa locking
- 🔧 **Melhoria recomendada**: Adicionar versionamento ou usar `FOR UPDATE`

---

### 5. **Double-Entry Bookkeeping (Contabilidade de Partidas Dobradas)** ⭐⭐⭐⭐

**Por quê?**
- Padrão contábil tradicional
- Cada transação tem débito e crédito
- Facilita auditoria e reconciliação

**Estrutura:**
```sql
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY,
  transaction_id UUID,
  account_id UUID,
  debit DECIMAL(10, 2),
  credit DECIMAL(10, 2),
  balance DECIMAL(10, 2),  -- Saldo após a transação
  created_at TIMESTAMP
);
```

**Status atual:**
- ❌ Não implementado
- 💡 **Futuro**: Considerar para auditoria completa

---

### 6. **Event Sourcing** ⭐⭐⭐

**Por quê?**
- Mantém histórico completo de todas as transações
- Permite reconstruir saldo a qualquer momento
- Facilita auditoria e debugging

**Estrutura:**
```sql
CREATE TABLE balance_events (
  id UUID PRIMARY KEY,
  user_id UUID,
  event_type VARCHAR,  -- 'CREDIT', 'DEBIT'
  amount DECIMAL(10, 2),
  balance_before DECIMAL(10, 2),
  balance_after DECIMAL(10, 2),
  transaction_id UUID,
  created_at TIMESTAMP
);
```

**Status atual:**
- ❌ Não implementado
- 💡 **Futuro**: Considerar para sistemas de produção

---

## 🔧 Implementação Recomendada (Híbrida)

### Padrão Híbrido: Transação + Atualização Atômica + Decimal

```typescript
// 1. Usar Decimal na aplicação
import { Decimal } from '@prisma/client/runtime/library';

// 2. Transação única para todas as atualizações
await prisma.$transaction(async (tx) => {
  // 3. Atualização atômica no banco
  await tx.balance.upsert({
    where: { userId: producerId },
    create: {
      userId: producerId,
      amount: producerCommission,
    },
    update: {
      amount: { increment: producerCommission }
    }
  });
  
  // Repetir para outros participantes...
}, {
  isolationLevel: 'Serializable', // Máximo isolamento
  timeout: 5000
});
```

---

## 📊 Comparação de Padrões

| Padrão | Segurança | Performance | Complexidade | Recomendação |
|--------|-----------|-------------|--------------|--------------|
| Decimal | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | **Obrigatório** |
| Transações ACID | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | **Obrigatório** |
| UPDATE Atômico | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | **Altamente Recomendado** |
| Pessimistic Lock | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | Recomendado para alta concorrência |
| Optimistic Lock | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Recomendado para média concorrência |
| Double-Entry | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Para sistemas complexos |
| Event Sourcing | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | Para auditoria completa |

---

## ✅ Checklist de Implementação

- [ ] Usar `Decimal` do Prisma na aplicação (não converter para `number`)
- [ ] Envolver todas as atualizações de saldo em uma transação única
- [ ] Usar `increment`/`decrement` do Prisma para atualizações atômicas
- [ ] Adicionar isolamento de transação adequado (`Serializable` ou `RepeatableRead`)
- [ ] Implementar retry logic para deadlocks
- [ ] Adicionar logging de todas as atualizações de saldo
- [ ] Considerar versionamento para optimistic locking
- [ ] Testes de concorrência (múltiplas requisições simultâneas)

---

## 🎯 Prioridades

### Alta Prioridade (Crítico)
1. ✅ Transações ACID
2. ✅ Atualização atômica no banco
3. ✅ Manter Decimal na aplicação

### Média Prioridade (Importante)
4. ⚠️ Locking (pessimistic ou optimistic)
5. ⚠️ Retry logic para deadlocks

### Baixa Prioridade (Melhorias Futuras)
6. 💡 Double-entry bookkeeping
7. 💡 Event sourcing
8. 💡 Histórico de transações

---

## 📚 Referências

- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [PostgreSQL Decimal Type](https://www.postgresql.org/docs/current/datatype-numeric.html)
- [ACID Properties](https://en.wikipedia.org/wiki/ACID)
- [Double-Entry Bookkeeping](https://en.wikipedia.org/wiki/Double-entry_bookkeeping)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)

