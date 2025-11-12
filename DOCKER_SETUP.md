# Configuração Docker

## 🐳 Executando com Docker

### Desenvolvimento

1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Inicie os containers em modo desenvolvimento:
```bash
npm run docker:dev
```

Isso irá:
- Subir o PostgreSQL na porta 5432
- Subir a aplicação em modo desenvolvimento na porta 3000
- Executar as migrações automaticamente
- Hot-reload habilitado

### Produção

1. Configure as variáveis de ambiente no arquivo `.env`

2. Construa e inicie os containers:
```bash
npm run docker:build
npm run docker:up
```

3. Para parar os containers:
```bash
npm run docker:down
```

4. Para ver os logs:
```bash
npm run docker:logs
```

## 🔧 Comandos Docker Disponíveis

- `npm run docker:up` - Sobe os containers em modo produção
- `npm run docker:down` - Para os containers
- `npm run docker:dev` - Sobe os containers em modo desenvolvimento
- `npm run docker:build` - Constrói as imagens Docker
- `npm run docker:logs` - Mostra os logs dos containers

## 📝 Notas sobre Prisma

O Prisma Client é gerado automaticamente durante o build do Docker. Se você precisar regenerar localmente:

```bash
npm run prisma:generate
```

## 🗄️ Banco de Dados

O PostgreSQL é iniciado automaticamente com o Docker Compose. As migrações são aplicadas automaticamente quando os containers são iniciados.

Para acessar o banco de dados diretamente:

```bash
docker exec -it desafio-postgres psql -U postgres -d desafio_db
```

Ou use o Prisma Studio:

```bash
npm run prisma:studio
```


