# 🗄️ Database Setup - Estrutura Automática

Este documento explica como a estrutura do banco de dados é criada automaticamente com `docker-compose up -d`.

## 🚀 Setup Automático

### 1. Iniciar Infraestrutura
```bash
docker-compose up -d
```

### 2. Verificar Estrutura
```bash
./test-database-structure.sh
```

## 📁 Scripts de Inicialização

Os scripts são executados automaticamente na ordem:

### `01-init.sql`
- Cria extensões PostgreSQL (uuid-ossp, pg_trgm)
- Cria bancos de dados para cada serviço
- Cria schemas em cada banco
- Configura timezone

### `02-credit-assessment-tables.sql`
- Cria enums para Credit Assessment
- Cria tabelas: `credit_assessments`, `assessment_criteria`, `assessment_logs`
- Cria índices para performance
- Insere critérios padrão de avaliação

### `03-pricing-tables.sql`
- Cria enums para Pricing
- Cria tabelas: `pricings`, `pricing_rules`, `pricing_history`
- Cria índices para performance
- Insere regras padrão de precificação

### `04-policy-issuance-tables.sql`
- Cria enums para Policy Issuance
- Cria tabelas: `users`, `policies`, `policy_events`
- Cria índices para performance
- Insere usuários admin padrão

### `05-verify-structure.sql`
- Verifica se toda estrutura foi criada
- Lista bancos, schemas e tabelas
- Log de sucesso

## 🏗️ Estrutura Criada

### Bancos de Dados
- `policy_issuance` - Policy Issuance Service + User Manager
- `credit_assessment` - Credit Assessment Service
- `pricing` - Pricing Service

### Schemas
- `policy_issuance.policy_issuance`
- `credit_assessment.credit_assessment`
- `pricing.pricing`

### Tabelas por Serviço

#### Policy Issuance Service
- `users` - Usuários do sistema
- `policies` - Apólices de seguro
- `policy_events` - Eventos de auditoria

#### Credit Assessment Service
- `credit_assessments` - Avaliações de crédito
- `assessment_criteria` - Critérios de avaliação
- `assessment_logs` - Logs de auditoria

#### Pricing Service
- `pricings` - Precificações
- `pricing_rules` - Regras de precificação
- `pricing_history` - Histórico de mudanças

## 👥 Usuários Padrão

### Admin Users
- **Email**: `admin@portobank.com`
- **Password**: `admin123`
- **Role**: `admin`

- **Email**: `test@portobank.com`
- **Password**: `test123`
- **Role**: `admin`

## 📊 Dados Padrão

### Critérios de Avaliação
- Income Ratio (25% weight)
- Debt to Income (20% weight)
- Credit History (20% weight)
- Employment Stability (15% weight)
- Age (10% weight)
- Location (10% weight)

### Regras de Precificação
- Base Premium para Fiança
- Desconto para jovens (< 30 anos)
- Sobretaxa para idosos (> 60 anos)
- Sobretaxa para cobertura alta (> 500k)
- Desconto para baixo risco
- Sobretaxa para alto risco
- Taxa de imposto padrão
- Taxa de processamento

## 🔧 Comandos Úteis

### Verificar Containers
```bash
docker ps --filter "name=policy-"
```

### Acessar PostgreSQL
```bash
docker exec -it policy-postgres psql -U postgres
```

### Verificar Bancos
```bash
docker exec policy-postgres psql -U postgres -c "\l"
```

### Verificar Tabelas
```bash
docker exec policy-postgres psql -U postgres -d policy_issuance -c "\dt policy_issuance.*"
docker exec policy-postgres psql -U postgres -d credit_assessment -c "\dt credit_assessment.*"
docker exec policy-postgres psql -U postgres -d pricing -c "\dt pricing.*"
```

### Resetar Banco
```bash
docker-compose down -v
docker-compose up -d
```

## ⚠️ Notas Importantes

1. **Primeira Execução**: Scripts só executam na primeira criação do container
2. **Reset Completo**: Use `docker-compose down -v` para resetar volumes
3. **Desenvolvimento**: TypeORM `synchronize: true` ainda funciona
4. **Produção**: Use migrations ao invés de `synchronize: true`

## 🎯 Benefícios

- ✅ **Setup Automático**: `docker-compose up -d` cria tudo
- ✅ **Desenvolvimento**: Sem dependência de rodar serviços
- ✅ **CI/CD**: Deploy sem problemas de estrutura
- ✅ **Onboarding**: Novos desenvolvedores funcionam imediatamente
- ✅ **Consistência**: Estrutura sempre igual em todos os ambientes
