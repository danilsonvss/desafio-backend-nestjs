# Regras de Negócio - Taxas

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

## 🔄 Fluxo de Criação de Taxa

```
1. POST /taxes
   → Verifica autenticação
   → Valida country, type, percentage
   → Normaliza country
   → Verifica se já existe (country, type)
   → Cria taxa
   → Retorna TaxResponseDto
```

