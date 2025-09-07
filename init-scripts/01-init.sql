-- Script de inicialização do banco de dados
-- Este script será executado automaticamente quando o container PostgreSQL for criado

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Criar bancos de dados para cada serviço
-- PostgreSQL não suporta IF NOT EXISTS para CREATE DATABASE
-- Os bancos serão criados se não existirem
SELECT 'CREATE DATABASE policy_issuance' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'policy_issuance')\gexec
SELECT 'CREATE DATABASE credit_assessment' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'credit_assessment')\gexec
SELECT 'CREATE DATABASE pricing' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pricing')\gexec
SELECT 'CREATE DATABASE users' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'users')\gexec

-- Conectar ao banco policy_issuance e criar schema
\c policy_issuance;
CREATE SCHEMA IF NOT EXISTS policy_issuance;

-- Conectar ao banco credit_assessment e criar schema
\c credit_assessment;
CREATE SCHEMA IF NOT EXISTS credit_assessment;

-- Conectar ao banco pricing e criar schema
\c pricing;
CREATE SCHEMA IF NOT EXISTS pricing;

-- Conectar ao banco users e criar schema
\c users;
CREATE SCHEMA IF NOT EXISTS users;

-- Voltar ao banco principal
\c policy_issuance;

-- Configurar timezone
SET timezone = 'America/Sao_Paulo';
