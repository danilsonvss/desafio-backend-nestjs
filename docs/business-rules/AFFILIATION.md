# Regras de Negócio - Afiliação e Coprodução

## 🤝 Afiliação

### Regras de Criação

#### RN-AFF-001: Relacionamento Produtor-Afiliado
- **Descrição**: Afiliado pode estar vinculado a um produtor
- **Aplicação**: Afiliado promove produtos do produtor
- **Configuração**: Percentual de comissão por relacionamento
- **Validação**: Produtor e afiliado devem existir e serem diferentes

#### RN-AFF-002: Afiliação Única
- **Descrição**: Não pode existir duas afiliações com mesmo produtor e afiliado
- **Validação**: Constraint único `(producerId, affiliateId)` no banco de dados
- **Erro**: `409 Conflict` quando afiliação já existe

#### RN-AFF-003: Percentual de Comissão
- **Descrição**: Percentual de comissão do afiliado (0 a 100)
- **Validação**: `@Min(0)` e `@Max(100)`
- **Aplicação**: Usado no cálculo de comissões em pagamentos

#### RN-AFF-004: Produtor e Afiliado Diferentes
- **Descrição**: Produtor e afiliado não podem ser o mesmo usuário
- **Validação**: `producerId !== affiliateId`
- **Erro**: `400 Bad Request` quando são iguais

#### RN-AFF-005: Múltiplos Afiliados
- **Descrição**: Um produtor pode ter múltiplos afiliados
- **Aplicação**: Diferentes afiliados promovem o mesmo produto
- **Comissão**: Cada afiliado recebe sua comissão quando traz venda

---

## 🤝 Coprodução

### Regras de Criação

#### RN-COP-001: Relacionamento Produtor-Coprodutor
- **Descrição**: Coprodutor pode estar vinculado a um produtor
- **Aplicação**: Coprodutor colabora na criação do produto
- **Configuração**: Percentual de comissão por relacionamento
- **Validação**: Produtor e coprodutor devem existir e serem diferentes

#### RN-COP-002: Coprodução Única
- **Descrição**: Não pode existir duas coproduções com mesmo produtor e coprodutor
- **Validação**: Constraint único `(producerId, coproducerId)` no banco de dados
- **Erro**: `409 Conflict` quando coprodução já existe

#### RN-COP-003: Percentual de Comissão
- **Descrição**: Percentual de comissão do coprodutor (0 a 100)
- **Validação**: `@Min(0)` e `@Max(100)`
- **Aplicação**: Usado no cálculo de comissões em pagamentos

#### RN-COP-004: Produtor e Coprodutor Diferentes
- **Descrição**: Produtor e coprodutor não podem ser o mesmo usuário
- **Validação**: `producerId !== coproducerId`
- **Erro**: `400 Bad Request` quando são iguais

#### RN-COP-005: Múltiplos Coprodutores
- **Descrição**: Um produto pode ter múltiplos coprodutores
- **Aplicação**: Colaboração entre vários criadores
- **Comissão**: Cada coprodutor recebe sua comissão em todas as vendas

---

## 🔄 Fluxos

### Fluxo de Criação de Afiliação

```
1. POST /affiliations
   → Verifica autenticação
   → Valida producerId, affiliateId, percentage
   → Verifica se usuários existem
   → Verifica se são diferentes
   → Verifica se afiliação já existe
   → Cria afiliação
   → Retorna AffiliationResponseDto
```

### Fluxo de Criação de Coprodução

```
1. POST /coproductions
   → Verifica autenticação
   → Valida producerId, coproducerId, percentage
   → Verifica se usuários existem
   → Verifica se são diferentes
   → Verifica se coprodução já existe
   → Cria coprodução
   → Retorna CoproductionResponseDto
```

