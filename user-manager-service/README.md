# User Manager Service - Serviço de Gerenciamento de Usuários

Serviço centralizado responsável pelo gerenciamento de usuários e autenticação JWT para toda a plataforma de seguros.

## 🚀 Funcionalidades

### Core Features
- **Gerenciamento de Usuários**: CRUD completo de usuários
- **Autenticação JWT**: Geração e validação de tokens
- **Controle de Acesso**: Sistema de roles e permissões
- **Cache de Usuários**: Cache Redis para performance
- **Mensageria**: Eventos de usuário via RabbitMQ

### Roles Disponíveis
- `admin` - Acesso total ao sistema
- `agent` - Agente de seguros
- `customer` - Cliente
- `analyst` - Analista de crédito
- `manager` - Gerente

## 🏗️ Arquitetura

### Entidades
- **User**: Entidade principal de usuário

### Serviços
- **UserService**: Gerenciamento de usuários
- **AuthService**: Autenticação e JWT

### Integrações
- **RabbitMQ**: Mensageria assíncrona
- **Redis**: Cache de usuários
- **PostgreSQL**: Persistência (schema policy_issuance)

## 🔐 Autenticação

### Login
```bash
POST /api/v1/auth/login
{
  "email": "admin@portobank.com",
  "password": "admin123"
}
```

### Resposta
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@portobank.com",
    "role": "admin"
  }
}
```

## 📊 Endpoints Principais

### Autenticação
- `POST /api/v1/auth/login` - Login

### Usuários
- `POST /api/v1/users` - Criar usuário
- `GET /api/v1/users` - Listar usuários
- `GET /api/v1/users/:id` - Buscar usuário por ID
- `GET /api/v1/users/profile` - Perfil do usuário logado
- `PATCH /api/v1/users/:id` - Atualizar usuário
- `PATCH /api/v1/users/profile` - Atualizar perfil
- `PATCH /api/v1/users/:id/status` - Alterar status
- `DELETE /api/v1/users/:id` - Deletar usuário

## 🔄 Integração com Outros Serviços

### Policy Issuance Service
- **JWT**: Tokens gerados pelo User Manager
- **Validação**: Policy Service valida JWT externamente
- **Roles**: Controle de acesso baseado em roles

### Credit Assessment Service
- **JWT**: Tokens gerados pelo User Manager
- **Usuários**: Dados de usuário via JWT payload

### Pricing Service
- **JWT**: Tokens gerados pelo User Manager
- **Usuários**: Dados de usuário via JWT payload

## 🔧 Configuração

### Variáveis de Ambiente
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_DATABASE=policy_issuance
DB_SCHEMA=policy_issuance

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# Redis
REDIS_URL=redis://localhost:6379

# Application
PORT=3004
NODE_ENV=development
```

## 🚀 Execução

### Pré-requisitos
- Node.js 18+
- PostgreSQL 13+
- RabbitMQ 3.8+
- Redis 6+

### Instalação
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp env.example .env

# Iniciar em desenvolvimento
npm run start:dev

# Iniciar em produção
npm run build
npm run start:prod
```

## 📚 Documentação da API

Acesse a documentação interativa da API em:
- **Swagger UI**: `http://localhost:3004/api/docs`

## 🔍 Monitoramento

### Health Check
- `GET /` - Status básico
- `GET /health` - Status detalhado

## 🛡️ Segurança

- **JWT**: Autenticação baseada em tokens
- **RBAC**: Controle de acesso baseado em roles
- **Validação**: Validação rigorosa de entrada
- **Auditoria**: Log completo de todas as operações
- **Hash de Senhas**: bcrypt com salt rounds 12

## 🔄 Fluxo de Autenticação

1. **Login**: Cliente faz login no User Manager
2. **JWT**: User Manager gera token JWT
3. **Uso**: Cliente usa token em outros serviços
4. **Validação**: Serviços validam token JWT
5. **Autorização**: Controle de acesso baseado em roles

## 📊 Exemplos de Uso

### Criar Usuário
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "cpf": "12345678901",
  "password": "password123",
  "role": "customer"
}
```

### Atualizar Usuário
```json
{
  "name": "João Silva Santos",
  "phone": "+5511999999999"
}
```

## 🚨 Troubleshooting

### Problemas Comuns
1. **Erro de conexão com banco**: Verificar configurações do PostgreSQL
2. **Token JWT inválido**: Verificar JWT_SECRET e expiração
3. **Cache não funciona**: Verificar conexão com Redis
4. **Mensagens não chegam**: Verificar RabbitMQ

### Logs Importantes
- `User created` - Usuário criado
- `User updated` - Usuário atualizado
- `User deleted` - Usuário deletado
- `Login successful` - Login realizado
- `JWT generated` - Token gerado
