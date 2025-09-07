# Pricing Service - Serviço de Precificação

Serviço responsável pelo cálculo e gerenciamento de preços de apólices de seguro, incluindo aplicação de regras de desconto, sobretaxas e ajustes.

## 🚀 Funcionalidades

### Core Features
- **Cálculo de Preços**: Cálculo automático de preços baseado em regras configuráveis
- **Regras de Precificação**: Sistema flexível de regras para descontos, sobretaxas e ajustes
- **Histórico de Preços**: Auditoria completa de todas as alterações de preços
- **Aprovação de Preços**: Workflow de aprovação para preços calculados
- **Cache Inteligente**: Cache de regras e cálculos para melhor performance

### Regras de Precificação
- **Descontos**: Porcentagem ou valor fixo
- **Sobretaxas**: Porcentagem ou valor fixo
- **Ajustes**: Valores customizados
- **Condições**: Sistema flexível de condições baseado em metadados
- **Prioridades**: Ordem de aplicação das regras
- **Limites**: Valores mínimos e máximos

## 🏗️ Arquitetura

### Entidades Principais
- **Pricing**: Preços calculados para apólices
- **PricingRule**: Regras de precificação
- **PricingHistory**: Histórico de alterações

### Serviços
- **PricingService**: Gerenciamento de preços
- **PricingCalculationService**: Cálculo de preços
- **PricingHistoryService**: Auditoria e histórico

### Integrações
- **RabbitMQ**: Mensageria assíncrona
- **Redis**: Cache e sessões
- **PostgreSQL**: Persistência de dados

## 🔐 Autenticação

O serviço utiliza JWT para autenticação. Para acessar endpoints protegidos:

1. Faça login via `POST /api/v1/auth/login`
2. Use o token retornado no header: `Authorization: Bearer <token>`

### Roles disponíveis:
- `admin` - Acesso total
- `manager` - Pode gerenciar preços e aprovar
- `analyst` - Pode calcular e visualizar preços

**Nota**: O gerenciamento de usuários é feito pelo Policy Issuance Service.

## 📊 Endpoints Principais

### Autenticação
- `POST /api/v1/auth/login` - Login

### Preços
- `POST /api/v1/pricing` - Criar novo preço
- `GET /api/v1/pricing` - Listar preços
- `GET /api/v1/pricing/:id` - Buscar preço por ID
- `GET /api/v1/pricing/policy/:policyId` - Buscar por policy ID
- `PATCH /api/v1/pricing/:id` - Atualizar preço
- `POST /api/v1/pricing/:id/approve` - Aprovar preço
- `POST /api/v1/pricing/:id/reject` - Rejeitar preço
- `POST /api/v1/pricing/:id/recalculate` - Recalcular preço
- `POST /api/v1/pricing/:id/deactivate` - Desativar preço
- `GET /api/v1/pricing/:id/history` - Ver histórico do preço

## 🔄 Fluxo de Precificação

1. **Criação** - Sistema recebe solicitação de precificação
2. **Aplicação de Regras** - Regras aplicadas baseadas em condições
3. **Cálculo** - Preço final calculado com descontos/sobretaxas
4. **Aprovação** - Preço enviado para aprovação (se necessário)
5. **Ativação** - Preço aprovado e ativado
6. **Notificação** - Eventos enviados via RabbitMQ

## 🎯 Regras de Precificação

### Tipos de Regras
- **DISCOUNT**: Descontos (porcentagem ou valor fixo)
- **SURCHARGE**: Sobretaxas (porcentagem ou valor fixo)
- **ADJUSTMENT**: Ajustes customizados
- **BASE_RATE**: Taxa base

### Condições
- **equals**: Igual a
- **greater_than**: Maior que
- **less_than**: Menor que
- **between**: Entre valores
- **in**: Contido em lista
- **contains**: Contém texto

### Ações
- **percentage**: Porcentagem do prêmio base
- **fixed_amount**: Valor fixo
- **formula**: Fórmula customizada

## 📈 Exemplos de Uso

### Criar Preço
```json
{
  "policyId": "123e4567-e89b-12d3-a456-426614174000",
  "type": "base",
  "basePremium": 1000.00,
  "currency": "BRL",
  "validFrom": "2024-01-01T00:00:00.000Z",
  "calculationMetadata": {
    "riskScore": 0.8,
    "region": "SP",
    "productType": "auto"
  }
}
```

### Aplicar Desconto
```json
{
  "type": "discount",
  "discountPercentage": 10.0,
  "notes": "Desconto para cliente fidelidade"
}
```

## 🔧 Configuração

### Variáveis de Ambiente
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=pricing
DB_SCHEMA=pricing

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# Redis
REDIS_URL=redis://localhost:6379

# Application
PORT=3003
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

# Executar migrações (se necessário)
npm run migration:run

# Iniciar em desenvolvimento
npm run start:dev

# Iniciar em produção
npm run build
npm run start:prod
```

### Testes
```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Coverage
npm run test:cov
```

## 📚 Documentação da API

Acesse a documentação interativa da API em:
- **Swagger UI**: `http://localhost:3003/api/docs`

## 🔍 Monitoramento

### Health Check
- `GET /` - Status básico
- `GET /health` - Status detalhado

### Logs
- Estruturados em JSON
- Níveis: error, warn, info, debug
- Incluem contexto e correlação

## 🛡️ Segurança

- **JWT**: Autenticação baseada em tokens
- **RBAC**: Controle de acesso baseado em roles
- **Validação**: Validação rigorosa de entrada
- **Auditoria**: Log completo de todas as operações
- **Rate Limiting**: Proteção contra abuso (configurável)

## 🔄 Integração com Outros Serviços

### Policy Issuance Service
- Recebe solicitações de precificação
- Envia resultados de precificação

### Credit Assessment Service
- Utiliza dados de análise de crédito
- Aplica regras baseadas em score

### Billing Service
- Envia preços aprovados
- Recebe confirmações de cobrança

## 📊 Métricas e KPIs

- Tempo de cálculo de preços
- Taxa de aprovação de preços
- Uso de regras de precificação
- Performance do cache
- Disponibilidade do serviço

## 🚨 Troubleshooting

### Problemas Comuns
1. **Erro de conexão com banco**: Verificar configurações do PostgreSQL
2. **Token JWT inválido**: Verificar JWT_SECRET e expiração
3. **Cache não funciona**: Verificar conexão com Redis
4. **Mensagens não chegam**: Verificar RabbitMQ

### Logs Importantes
- `Pricing created for policy` - Preço criado
- `Final premium calculated` - Cálculo concluído
- `Pricing approved` - Preço aprovado
- `History logged` - Auditoria registrada
