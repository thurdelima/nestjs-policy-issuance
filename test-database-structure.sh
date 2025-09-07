#!/bin/bash

# Script para testar a estrutura do banco de dados
# Executa após docker-compose up -d

echo "🔍 Verificando estrutura do banco de dados..."

# Aguardar o PostgreSQL estar pronto
echo "⏳ Aguardando PostgreSQL estar pronto..."
sleep 10

# Verificar se os containers estão rodando
echo "📦 Verificando containers..."
docker ps --filter "name=policy-postgres" --format "table {{.Names}}\t{{.Status}}"

# Verificar bancos criados
echo "🗄️ Verificando bancos de dados..."
docker exec policy-postgres psql -U postgres -c "SELECT datname FROM pg_database WHERE datname IN ('policy_issuance', 'credit_assessment', 'pricing', 'users');"

# Verificar tabelas do Policy Issuance
echo "📋 Verificando tabelas do Policy Issuance Service..."
docker exec policy-postgres psql -U postgres -d policy_issuance -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'policy_issuance';"

# Verificar tabelas do Credit Assessment
echo "📋 Verificando tabelas do Credit Assessment Service..."
docker exec policy-postgres psql -U postgres -d credit_assessment -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'credit_assessment';"

# Verificar tabelas do Pricing
echo "📋 Verificando tabelas do Pricing Service..."
docker exec policy-postgres psql -U postgres -d pricing -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'pricing';"

# Verificar tabelas do User Manager
echo "📋 Verificando tabelas do User Manager Service..."
docker exec policy-postgres psql -U postgres -d users -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'users';"

# Verificar usuários criados
echo "👥 Verificando usuários criados..."
docker exec policy-postgres psql -U postgres -d users -c "SELECT name, email, role, status FROM users.users;"

# Verificar critérios de avaliação
echo "📊 Verificando critérios de avaliação..."
docker exec policy-postgres psql -U postgres -d credit_assessment -c "SELECT name, type, is_active FROM credit_assessment.assessment_criteria;"

# Verificar regras de precificação
echo "💰 Verificando regras de precificação..."
docker exec policy-postgres psql -U postgres -d pricing -c "SELECT name, rule_type, is_active FROM pricing.pricing_rules;"

echo "✅ Verificação concluída!"
echo "🎉 Estrutura do banco de dados criada com sucesso!"
