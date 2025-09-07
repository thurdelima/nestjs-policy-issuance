# 🏢 Sistema para Emissão de Apólices

Sistema completo de microserviços para gestão e emissão de apólices de seguro, desenvolvido com arquitetura moderna e tecnologias atuais.

## 🏗️ Arquitetura

![Arquitetura do Sistema](./arquitecture.png)

## 🚀 Como Executar

### 1. Subir a Infraestrutura

```bash
docker-compose up -d
./test-database-structure.sh
```

### 2. Executar os Microserviços

Execute em terminais separados:

```bash
# Policy Issuance Service
cd policy-issuance-service && npm run start:dev

# Credit Assessment Service  
cd credit-assessment-service && npm run start:dev

# Pricing Service
cd pricing-service && npm run start:dev

# User Manager Service
cd user-manager-service && npm run start:dev

# Webhook Manager Service
cd webhook-manager-service && npm run start:dev
```

## 🛠️ Tecnologias Utilizadas

- **Backend:** NestJS, TypeScript, Node.js
- **Banco de Dados:** PostgreSQL, TypeORM
- **Message Broker:** RabbitMQ
- **Cache:** Redis
- **Testes:** Jest
- **Documentação:** Swagger/OpenAPI
- **Containerização:** Docker, Docker Compose

## 🧪 Testes Unitários

### User Manager Service
- `user.service.spec.ts` - Testes do serviço de usuários
- `user.controller.spec.ts` - Testes do controller de usuários

### Policy Issuance Service
- `policy.service.spec.ts` - Testes do serviço de apólices
- `policy.controller.spec.ts` - Testes do controller de apólices
- `external-integration.service.spec.ts` - Testes de integração externa

## 📚 Documentação das APIs

Cada microserviço possui documentação Swagger disponível em:

- **Policy Issuance Service:** `/api/docs`
- **Credit Assessment Service:** `/api/docs`
- **Pricing Service:** `/api/docs`
- **User Manager Service:** `/api/docs`
- **Webhook Manager Service:** `/api/docs`

## 🎯 Funcionalidades

- ✅ **Gestão de Usuários** - Autenticação e autorização
- ✅ **Emissão de Apólices** - Criação e gestão de apólices
- ✅ **Avaliação de Crédito** - Análise de risco e scoring
- ✅ **Precificação** - Cálculo de prêmios e taxas
- ✅ **Webhooks** - Processamento de pagamentos
- ✅ **Auditoria** - Logs e eventos de sistema

## 🔧 Estrutura do Projeto

```
backend-emition/
├── policy-issuance-service/     # Serviço de emissão de apólices
├── credit-assessment-service/   # Serviço de avaliação de crédito
├── pricing-service/            # Serviço de precificação
├── user-manager-service/       # Serviço de gestão de usuários
├── webhook-manager-service/    # Serviço de webhooks
├── init-scripts/              # Scripts de inicialização do banco
├── docker-compose.yml         # Configuração dos containers
└── test-database-structure.sh # Script de teste da estrutura
```

## 🎉 Pronto para Usar!

Após executar os comandos acima, o sistema estará totalmente funcional com:

- 🗄️ **Banco de dados** configurado automaticamente
- 🔐 **Usuários padrão** criados (admin/admin123)
- 📊 **Dados de exemplo** inseridos
- 🌐 **APIs documentadas** e prontas para uso
- 🧪 **Testes unitários** implementados
