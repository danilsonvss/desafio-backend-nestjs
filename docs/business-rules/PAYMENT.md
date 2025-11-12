# Regras de Negócio - Pagamentos

## 💸 Pagamentos

### Regras de Processamento

#### RN-PAY-001: Aprovação Imediata
- **Descrição**: Pagamentos são aprovados imediatamente (simulação)
- **Aplicação**: Não integrar com adquirentes reais
- **Status**: Sempre "APPROVED" para fins de teste

#### RN-PAY-002: Cálculo de Taxas por País
- **Descrição**: Taxa é calculada baseada no país da transação
- **Aplicação**: 
  1. Buscar taxa por país e tipo TRANSACTION
  2. Buscar taxa por país e tipo PLATFORM
  3. Calcular valor das taxas: `taxa = valor * percentual / 100`
- **Valor Líquido**: `valorLiquido = valorOriginal - transactionTax`
- **Taxas**: Se taxa não encontrada, assume 0

#### RN-PAY-003: Participantes do Pagamento
- **Descrição**: Pagamento envolve múltiplos participantes:
  - Produtor (obrigatório)
  - Afiliado (opcional)
  - Coprodutor (opcional)
  - Plataforma (sempre presente)
- **Validação**: Produtor deve existir e estar ativo
- **Erro**: `404 Not Found` quando participante não encontrado

#### RN-PAY-004: Cálculo de Comissões
- **Descrição**: Comissões são calculadas sobre valor líquido (após taxas de transação)
- **Fórmula**: `comissao = valorLiquido * percentual / 100`
- **Valor Líquido**: `valorLiquido = valorOriginal - transactionTax`
- **Aplicação**:
  - Afiliado: Busca afiliação entre produtor e afiliado
  - Coprodutor: Busca coprodução entre produtor e coprodutor
  - Plataforma: Taxa PLATFORM é a comissão da plataforma

#### RN-PAY-005: Distribuição de Valores
- **Descrição**: Valor do pagamento é distribuído entre participantes
- **Cálculo**:
  1. Calcular taxas (TRANSACTION e PLATFORM)
  2. Calcular valor líquido: `valorLiquido = valorOriginal - transactionTax`
  3. Calcular comissões (afiliado, coprodutor, plataforma)
  4. Calcular comissão do produtor: `produtorCommission = valorLiquido - totalComissoes - platformCommission`
- **Validação**: Comissão do produtor não pode ser negativa
- **Erro**: `400 Bad Request` quando comissões excedem valor líquido

#### RN-PAY-006: Atualização de Saldos
- **Descrição**: Saldos são atualizados após pagamento aprovado
- **Operações**:
  - Crédito para produtor (comissão do produtor)
  - Crédito para afiliado (se houver, comissão do afiliado)
  - Crédito para coprodutor (se houver, comissão do coprodutor)
  - Crédito para plataforma (comissão da plataforma = platformTax)
- **Atomicidade**: Todas as operações devem ser atômicas (transação)
- **Criação Automática**: Balances são criados automaticamente se não existirem

#### RN-PAY-007: Registro de Pagamento
- **Descrição**: Cada pagamento gera registro na tabela `payments`
- **Campos**: valor, país, participantes, taxas, comissões, status, datas
- **Aplicação**: Auditoria e relatórios futuros
- **Status**: Sempre "APPROVED" (simulação)

#### RN-PAY-008: Validação de Valor
- **Descrição**: Valor do pagamento deve ser positivo
- **Validação**: `amount > 0`
- **Erro**: `400 Bad Request` quando valor <= 0

#### RN-PAY-009: Validação de País
- **Descrição**: País é obrigatório e normalizado para UPPERCASE
- **Validação**: `@IsNotEmpty()` e `@IsString()`
- **Aplicação**: Usado para buscar taxas

---

## 🔄 Fluxo de Pagamento

```
1. POST /payment
   → Verifica autenticação
   → Valida valor, país, participantes
   → Verifica se produtor existe
   → Verifica se afiliado existe (se fornecido)
   → Verifica se coprodutor existe (se fornecido)
   → Busca taxas por país (TRANSACTION e PLATFORM)
   → Calcula taxas
   → Calcula valor líquido
   → Busca afiliação (se afiliado fornecido)
   → Busca coprodução (se coprodutor fornecido)
   → Calcula comissões
   → Valida se comissões não excedem valor líquido
   → Cria registro de pagamento
   → Atualiza saldos (produtor, afiliado, coprodutor, plataforma)
   → Retorna PaymentResponseDto
```

---

## 💵 Comissões

### Regras de Cálculo

#### RN-COM-001: Percentuais de Comissão
- **Descrição**: Cada participante tem percentual de comissão configurável
- **Participantes**:
  - Produtor: recebe o restante após outras comissões
  - Afiliado: percentual configurado na afiliação
  - Coprodutor: percentual configurado na coprodução
  - Plataforma: percentual da taxa PLATFORM
- **Validação**: Soma das comissões não deve exceder valor líquido

#### RN-COM-002: Cálculo de Comissão
- **Descrição**: Comissão é calculada sobre valor líquido (após taxas de transação)
- **Fórmula**: `comissao = valorLiquido * percentual / 100`
- **Valor Líquido**: `valorLiquido = valorOriginal - transactionTax`

#### RN-COM-003: Comissão do Produtor
- **Descrição**: Produtor recebe o restante após outras comissões
- **Cálculo**: `produtorCommission = valorLiquido - affiliateCommission - coproducerCommission - platformCommission`
- **Validação**: Deve ser >= 0

#### RN-COM-004: Comissão do Afiliado
- **Descrição**: Afiliado recebe comissão apenas se vinculado à venda
- **Aplicação**: Afiliado trouxe o cliente
- **Cálculo**: Percentual configurado na afiliação sobre valor líquido

#### RN-COM-005: Comissão do Coprodutor
- **Descrição**: Coprodutor recebe comissão se participou da criação
- **Aplicação**: Coprodutor colaborou no produto
- **Cálculo**: Percentual configurado na coprodução sobre valor líquido

#### RN-COM-006: Comissão da Plataforma
- **Descrição**: Plataforma recebe comissão baseada na taxa PLATFORM
- **Aplicação**: Receita da plataforma
- **Cálculo**: `platformCommission = platformTax = valorOriginal * platformTaxPercentage / 100`

