# Credit Assessment Service

Microserviço para análise e concessão de crédito - Porto Bank Digital

## 🚀 Tecnologias

- **NestJS** - Framework Node.js
- **TypeORM** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados principal
- **RabbitMQ** - Mensageria assíncrona
- **Redis** - Cache e sessões
- **JWT** - Autenticação
- **Swagger** - Documentação da API

## 📋 Funcionalidades

### 🔍 Análise de Crédito
- Criação e processamento de solicitações de crédito
- Cálculo de score de crédito baseado em múltiplos critérios
- Integração com bureaus de crédito (Serasa, SPC)
- Avaliação de risco e aprovação/rejeição automática

### 📊 Critérios de Avaliação
- **Renda vs. Valor Solicitado** (25% do peso)
- **Endividamento** (20% do peso)
- **Histórico de Crédito** (30% do peso)
- **Estabilidade Empregatícia** (15% do peso)
- **Garantias/Colateral** (10% do peso)

### 🔄 Integração
- Comunicação assíncrona com Policy Issuance Service
- Notificação automática de resultados
- Logs detalhados de todo o processo

## 🛠️ Instalação

1. **Navegue para o diretório:**
```bash
cd credit-assessment-service
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
# O arquivo .env já está configurado com valores padrão
```

4. **Execute as migrações do banco:**
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
- **Swagger UI**: http://localhost:3002/api/docs
- **Health Check**: http://localhost:3002/health

## 🔐 Autenticação

O serviço utiliza JWT para autenticação. Para acessar endpoints protegidos:

1. Faça login via `POST /api/v1/auth/login`
2. Use o token retornado no header: `Authorization: Bearer <token>`

### Roles disponíveis:
- `admin` - Acesso total
- `analyst` - Pode processar análises de crédito
- `manager` - Pode gerenciar critérios e visualizar relatórios

**Nota**: O gerenciamento de usuários é feito pelo Policy Issuance Service.

## 📊 Endpoints Principais

### Autenticação
- `POST /api/v1/auth/login` - Login

### Análise de Crédito
- `GET /api/v1/credit-assessments` - Listar análises
- `POST /api/v1/credit-assessments` - Criar análise
- `GET /api/v1/credit-assessments/:id` - Buscar análise por ID
- `GET /api/v1/credit-assessments/policy/:policyId` - Buscar por policy ID
- `POST /api/v1/credit-assessments/:id/process` - Processar análise
- `POST /api/v1/credit-assessments/:id/cancel` - Cancelar análise
- `GET /api/v1/credit-assessments/:id/logs` - Ver logs da análise

### Usuários
- **Nota**: Gerenciamento de usuários é feito pelo Policy Issuance Service

## 🔄 Fluxo de Análise de Crédito

1. **Criação** - Sistema recebe solicitação do Policy Service
2. **Coleta de Dados** - Busca informações em bureaus de crédito
3. **Cálculo de Score** - Aplica algoritmos de scoring
4. **Avaliação de Risco** - Determina nível de risco
5. **Decisão** - Aprova, rejeita ou solicita informações adicionais
6. **Notificação** - Informa resultado ao Policy Service

## 🎯 Algoritmo de Scoring

### Critérios e Pesos:
- **Renda vs. Valor**: 25% - Relação entre renda anual e valor solicitado
- **Endividamento**: 20% - Relação entre gastos mensais e renda
- **Histórico**: 30% - Score de bureaus de crédito e histórico de pagamentos
- **Estabilidade**: 15% - Status empregatício e tempo no emprego
- **Garantias**: 10% - Valor de colateral vs. valor solicitado

### Níveis de Risco:
- **Baixo**: Score ≥ 700 e endividamento ≤ 40%
- **Médio**: Score ≥ 600 e endividamento ≤ 50%
- **Alto**: Score ≥ 500 e endividamento ≤ 60%
- **Muito Alto**: Demais casos

### Decisões:
- **Score ≥ 700 + Risco Baixo**: Aprovação total
- **Score ≥ 600 + Risco Médio**: Aprovação de 80% do valor
- **Score ≥ 500 + Risco Médio**: Aprovação de 60% do valor
- **Demais casos**: Rejeição

## 🐳 Docker

### Serviços necessários:
- **PostgreSQL**: localhost:5432
- **RabbitMQ Management**: http://localhost:15672 (admin/admin123)
- **Redis**: localhost:6379

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
DB_DATABASE=credit_assessment

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Porta do serviço
PORT=3002
```

## 🔄 Integração com Policy Service

O Credit Assessment Service se comunica com o Policy Issuance Service através do RabbitMQ:

### Filas:
- **credit.assessment.queue** - Recebe solicitações de análise
- **policy.issuance.queue** - Envia resultados de análise

### Mensagens:
```json
{
  "policyId": "uuid",
  "assessmentId": "uuid",
  "result": "approved|rejected",
  "creditScore": 750,
  "riskLevel": "low|medium|high|very_high",
  "approvedAmount": 80000.00,
  "rejectionReason": "string",
  "completedAt": "2024-01-01T00:00:00Z"
}
```

## 📈 Monitoramento

- **Health Check**: `/health`
- **Logs**: Console e arquivos de log
- **Métricas**: Via Swagger UI
- **Auditoria**: Logs detalhados de todas as operações

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

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto é propriedade do Porto Bank Digital.
