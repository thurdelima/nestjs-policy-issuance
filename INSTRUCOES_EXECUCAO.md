# 🚀 Instruções para Executar o Policy Issuance Service

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 18+ instalado
- npm ou yarn instalado

## 🛠️ Passos para Execução

### 1. Iniciar os Serviços de Infraestrutura

Na raiz do projeto (`backend-emition`), execute:

```bash
docker-compose up -d
```

Isso irá iniciar:
- PostgreSQL (porta 5432)
- RabbitMQ (porta 5672) + Management UI (porta 15672)
- Redis (porta 6379)

### 2. Configurar o Policy Issuance Service

```bash
cd policy-issuance-service
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Configurar Variáveis de Ambiente

```bash
cp env.example env.local
```

Edite o arquivo `env.local` se necessário (as configurações padrão já estão corretas para o Docker).

### 5. Compilar o Projeto

```bash
npm run build
```

### 6. Executar o Seed (Dados de Exemplo)

```bash
npm run seed
```

Isso criará usuários de exemplo:
- **Admin**: admin@portobank.com / admin123
- **Agente**: agente@portobank.com / agente123  
- **Cliente**: joao.silva@example.com / customer123

### 7. Iniciar o Serviço

```bash
npm run start:dev
```

O serviço estará disponível em: http://localhost:3001

## 📚 Acessar a Documentação

- **Swagger UI**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/health

## 🧪 Testar a API

Use o arquivo `test-api.http` no VS Code com a extensão REST Client, ou use qualquer cliente HTTP como Postman/Insomnia.

### Exemplo de Teste Rápido:

1. **Login como Admin:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@portobank.com", "password": "admin123"}'
```

2. **Criar uma Apólice:**
```bash
curl -X POST http://localhost:3001/api/v1/policies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "type": "fianca",
    "customerId": "ID_DO_CLIENTE",
    "coverageAmount": 100000.00,
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "coverageDetails": {
      "description": "Fiança locatícia",
      "terms": ["Cobertura por 12 meses"],
      "exclusions": ["Danos por terceiros"],
      "conditions": ["Pagamento em dia"]
    }
  }'
```

## 🔍 Verificar Serviços

### PostgreSQL
```bash
docker exec -it policy-postgres psql -U postgres -d policy_issuance
```

### RabbitMQ Management
Acesse: http://localhost:15672
- Usuário: admin
- Senha: admin123

### Redis
```bash
docker exec -it policy-redis redis-cli
```

## 🛑 Parar os Serviços

```bash
# Parar apenas os containers
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados)
docker-compose down -v
```

## 🐛 Troubleshooting

### Erro de Conexão com Banco
- Verifique se o PostgreSQL está rodando: `docker ps`
- Confirme as credenciais no `env.local`

### Erro de Conexão com RabbitMQ
- Verifique se o RabbitMQ está rodando: `docker ps`
- Acesse http://localhost:15672 para verificar

### Erro de Compilação
- Execute `npm run build` para verificar erros
- Verifique se todas as dependências estão instaladas

### Porta já em uso
- Verifique se a porta 3001 está livre: `lsof -i :3001`
- Mude a porta no `env.local` se necessário

## 📊 Estrutura do Projeto

```
policy-issuance-service/
├── src/
│   ├── auth/                 # Autenticação e autorização
│   ├── entities/             # Entidades do banco de dados
│   ├── modules/
│   │   ├── policy/           # Módulo de apólices
│   │   └── user/             # Módulo de usuários
│   ├── shared/               # Serviços compartilhados
│   │   ├── rabbitmq/         # Integração RabbitMQ
│   │   └── redis/            # Integração Redis
│   └── config/               # Configurações
├── scripts/                  # Scripts utilitários
├── test-api.http            # Testes da API
└── README.md                # Documentação completa
```

## 🎯 Próximos Passos

Após testar este microserviço, você pode:

1. **Criar os outros microserviços:**
   - Credit Assessment Service
   - Pricing Service  
   - Billing Service
   - Accounting Service

2. **Implementar integrações:**
   - Webhooks para comunicação entre serviços
   - Monitoramento e logs centralizados
   - Testes automatizados

3. **Deploy:**
   - Containerização com Docker
   - Orquestração com Kubernetes
   - CI/CD pipeline
