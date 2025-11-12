# Regras de Negócio

Este documento centraliza todas as regras de negócio do sistema de gateway de pagamentos, organizadas por módulo.

## 📋 Índice

1. [Autenticação e Usuários](business-rules/AUTH.md) - Autenticação JWT, cadastro e login de usuários
2. [Saldos (Balance)](business-rules/BALANCE.md) - Gerenciamento de saldos dos usuários
3. [Taxas](business-rules/TAX.md) - Configuração e cálculo de taxas por país
4. [Afiliação e Coprodução](business-rules/AFFILIATION.md) - Relacionamentos entre produtores, afiliados e coprodutores
5. [Pagamentos](business-rules/PAYMENT.md) - Processamento de pagamentos, cálculo de taxas e comissões

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
- Pagamentos garantem atomicidade em todas as operações (criação de pagamento e atualização de saldos)

### Imutabilidade

- Entidades de domínio são imutáveis (métodos retornam novas instâncias)
- Facilita auditoria, testes e thread-safety

### Normalização

- Países são normalizados para UPPERCASE
- Emails são normalizados para lowercase

### Precisão Decimal

- Valores monetários: `Decimal(10, 2)` - até 99.999.999,99
- Percentuais: `Decimal(5, 2)` - até 999,99%
- Conversão automática de Prisma Decimal para number

---

**Última Atualização**: 2025-11-12
**Versão**: 1.0.0
