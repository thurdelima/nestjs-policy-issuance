# Webhook Manager Service

Service responsável por gerenciar webhooks e processar pagamentos via RabbitMQ.

## Funcionalidades

- **Consumer RabbitMQ**: Escuta a fila `order_paid` para processar pagamentos
- **Simulação de Transação**: Simula processamento de pagamento com console.log
- **Idempotência**: Evita processamento duplicado usando Redis
- **API REST**: Endpoints para consultar status e estatísticas

## Estrutura

```
src/
├── modules/
│   └── webhook/
│       ├── webhook.controller.ts
│       ├── webhook.service.ts
│       └── webhook.module.ts
├── shared/
│   ├── rabbitmq/
│   │   ├── rabbitmq.service.ts
│   │   └── rabbitmq.module.ts
│   └── redis/
│       ├── redis.service.ts
│       └── redis.module.ts
├── app.controller.ts
├── app.service.ts
├── app.module.ts
└── main.ts
```

## Configuração

### Variáveis de Ambiente

```bash
# RabbitMQ Configuration
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
RABBITMQ_QUEUE_PAYMENT=order_paid

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Application Configuration
PORT=3005
NODE_ENV=development
CORS_ORIGIN=*

# Logging
LOG_LEVEL=debug
```

## Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp env.example .env

# Executar em desenvolvimento
npm run start:dev
```

## Endpoints

### Health Check
- `GET /api/v1/health` - Status do serviço
- `GET /api/v1/webhooks/health` - Status específico do webhook

### Webhooks
- `GET /api/v1/webhooks/stats` - Estatísticas do serviço
- `GET /api/v1/webhooks/payment/:transactionId` - Status de um pagamento

### Documentação
- `GET /api/docs` - Swagger UI

## Fluxo de Processamento

1. **Policy-Issuance-Service** processa pagamento
2. **Mensagem enviada** para fila `order_paid`
3. **Webhook-Manager** consome mensagem
4. **Simulação** de transação com console.log
5. **Idempotência** verificada via Redis
6. **Confirmação** da mensagem (ACK)

## Formato da Mensagem

```json
{
  "policyId": "uuid",
  "policyNumber": "string",
  "customerId": "uuid",
  "premiumAmount": 1000.00,
  "paymentDate": "2024-01-01T00:00:00Z",
  "paymentStatus": "paid",
  "transactionId": "TXN-uuid-timestamp",
  "paymentMethod": "credit_card",
  "coverageAmount": 100000.00,
  "type": "fianca",
  "effectiveDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T00:00:00Z",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Logs

O serviço gera logs detalhados incluindo:
- Conexão com RabbitMQ e Redis
- Processamento de mensagens
- Simulação de transações
- Erros e exceções

## Desenvolvimento

```bash
# Executar testes
npm test

# Executar com coverage
npm run test:cov

# Linting
npm run lint

# Build
npm run build
```
