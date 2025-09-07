# Policy Issuance Service

Microserviço para emissão de apólices de seguro - Porto Bank Digital

## 🚀 Tecnologias

- **NestJS** - Framework Node.js
- **TypeORM** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados principal
- **RabbitMQ** - Mensageria assíncrona
- **Redis** - Cache e sessões
- **JWT** - Autenticação
- **Swagger** - Documentação da API

## 📋 Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- npm ou yarn

## 🛠️ Instalação

1. **Clone o repositório e navegue para o diretório:**
```bash
cd policy-issuance-service
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Inicie os serviços de infraestrutura:**
```bash
# Na raiz do projeto (backend-emition)
docker-compose up -d
```

5. **Execute as migrações do banco:**
```bash
npm run build
npm run start:prod
```

## 🏃‍♂️ Executando o projeto

### Desenvolvimento
```bash
npm run start:dev
```

### Produção
```bash
npm run build
npm run start:prod
```

## 📚 Documentação da API

Após iniciar o serviço, acesse:
- **Swagger UI**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/health

## 🔐 Autenticação

O serviço utiliza JWT para autenticação. Para acessar endpoints protegidos:

1. Faça login via `POST /api/v1/auth/login`
2. Use o token retornado no header: `Authorization: Bearer <token>`

### Roles disponíveis:
- `admin` - Acesso total
- `agent` - Pode criar e gerenciar apólices
- `customer` - Pode visualizar suas próprias apólices

## 📊 Endpoints Principais

### Autenticação
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Registro

### Usuários
- `GET /api/v1/users` - Listar usuários (admin/agent)
- `GET /api/v1/users/profile` - Perfil do usuário logado
- `POST /api/v1/users` - Criar usuário (admin)
- `PATCH /api/v1/users/:id` - Atualizar usuário (admin)

### Apólices
- `GET /api/v1/policies` - Listar apólices
- `POST /api/v1/policies` - Criar apólice (agent/admin)
- `GET /api/v1/policies/:id` - Buscar apólice por ID
- `GET /api/v1/policies/number/:policyNumber` - Buscar por número da apólice
- `POST /api/v1/policies/:id/credit-assessment` - Iniciar análise de crédito
- `POST /api/v1/policies/:id/payment` - Processar pagamento
- `POST /api/v1/policies/:id/cancel` - Cancelar apólice

## 🔄 Fluxo de Emissão de Apólice

1. **Criação** - Agente cria apólice (status: DRAFT)
2. **Análise de Crédito** - Sistema solicita análise (status: PENDING_CREDIT_ASSESSMENT)
3. **Precificação** - Sistema calcula preço (status: PENDING_PRICING)
4. **Pagamento** - Cliente efetua pagamento (status: PENDING_PAYMENT)
5. **Ativação** - Apólice é ativada (status: ACTIVE)

## 🐳 Docker

### Serviços disponíveis:
- **PostgreSQL**: localhost:5432
- **RabbitMQ Management**: http://localhost:15672 (admin/admin123)
- **Redis**: localhost:6379

### Comandos úteis:
```bash
# Ver logs dos containers
docker-compose logs -f

# Parar todos os serviços
docker-compose down

# Remover volumes (CUIDADO: apaga dados)
docker-compose down -v
```

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura de testes
npm run test:cov
```

## 📝 Scripts Disponíveis

- `npm run build` - Compilar o projeto
- `npm run start` - Iniciar em modo produção
- `npm run start:dev` - Iniciar em modo desenvolvimento
- `npm run start:debug` - Iniciar em modo debug
- `npm run lint` - Executar linter
- `npm run format` - Formatar código

## 🔧 Configuração

### Variáveis de Ambiente Importantes:

```env
# Banco de dados
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_DATABASE=policy_issuance

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 🚨 Troubleshooting

### Problemas comuns:

1. **Erro de conexão com banco:**
   - Verifique se o PostgreSQL está rodando
   - Confirme as credenciais no .env

2. **Erro de conexão com RabbitMQ:**
   - Verifique se o RabbitMQ está rodando
   - Acesse http://localhost:15672 para verificar

3. **Erro de JWT:**
   - Verifique se JWT_SECRET está configurado
   - Confirme se o token está sendo enviado corretamente

## 📈 Monitoramento

- **Health Check**: `/health`
- **Logs**: Console e arquivos de log
- **Métricas**: Via Swagger UI

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto é propriedade do Porto Bank Digital.
