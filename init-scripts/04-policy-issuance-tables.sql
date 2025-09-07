-- Script de criação das tabelas do Policy Issuance Service
-- Executado automaticamente pelo Docker Compose

-- Conectar ao banco policy_issuance
\c policy_issuance;

-- Criar enums para o Policy Issuance Service
CREATE TYPE policy_issuance.policy_type_enum AS ENUM (
    'fianca',
    'capitalizacao'
);

CREATE TYPE policy_issuance.policy_status_enum AS ENUM (
    'draft',
    'pending_credit_assessment',
    'pending_pricing',
    'pending_payment',
    'active',
    'cancelled',
    'expired',
    'suspended'
);

CREATE TYPE policy_issuance.payment_status_enum AS ENUM (
    'pending',
    'paid',
    'failed',
    'refunded',
    'cancelled'
);

CREATE TYPE policy_issuance.event_type_enum AS ENUM (
    'policy_created',
    'policy_updated',
    'credit_assessment_requested',
    'credit_assessment_completed',
    'pricing_requested',
    'pricing_completed',
    'payment_processed',
    'policy_activated',
    'policy_cancelled',
    'policy_suspended',
    'policy_expired'
);

CREATE TYPE policy_issuance.event_status_enum AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);

CREATE TYPE policy_issuance.user_role_enum AS ENUM (
    'admin',
    'agent',
    'customer',
    'analyst',
    'manager'
);

CREATE TYPE policy_issuance.user_status_enum AS ENUM (
    'active',
    'inactive',
    'suspended'
);

-- Tabela: users (para User Manager Service)
CREATE TABLE IF NOT EXISTS policy_issuance.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role policy_issuance.user_role_enum NOT NULL,
    status policy_issuance.user_status_enum DEFAULT 'active',
    phone VARCHAR(20),
    birth_date DATE,
    address JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: policies
CREATE TABLE IF NOT EXISTS policy_issuance.policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_number VARCHAR(50) UNIQUE NOT NULL,
    type policy_issuance.policy_type_enum NOT NULL,
    status policy_issuance.policy_status_enum DEFAULT 'draft',
    premium_amount DECIMAL(15,2) NOT NULL,
    coverage_amount DECIMAL(15,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    effective_date DATE,
    cancellation_date DATE,
    cancellation_reason TEXT,
    payment_status policy_issuance.payment_status_enum DEFAULT 'pending',
    payment_due_date DATE,
    payment_date DATE,
    coverage_details JSONB NOT NULL,
    pricing_details JSONB,
    credit_assessment JSONB,
    metadata JSONB,
    customer_id UUID NOT NULL,
    agent_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: policy_events
CREATE TABLE IF NOT EXISTS policy_issuance.policy_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL,
    event_type policy_issuance.event_type_enum NOT NULL,
    status policy_issuance.event_status_enum NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON policy_issuance.users(email);
CREATE INDEX IF NOT EXISTS idx_users_cpf ON policy_issuance.users(cpf);
CREATE INDEX IF NOT EXISTS idx_users_role ON policy_issuance.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON policy_issuance.users(status);

CREATE INDEX IF NOT EXISTS idx_policies_policy_number ON policy_issuance.policies(policy_number);
CREATE INDEX IF NOT EXISTS idx_policies_type ON policy_issuance.policies(type);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policy_issuance.policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_customer_id ON policy_issuance.policies(customer_id);
CREATE INDEX IF NOT EXISTS idx_policies_agent_id ON policy_issuance.policies(agent_id);
CREATE INDEX IF NOT EXISTS idx_policies_created_at ON policy_issuance.policies(created_at);

CREATE INDEX IF NOT EXISTS idx_policy_events_policy_id ON policy_issuance.policy_events(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_events_event_type ON policy_issuance.policy_events(event_type);
CREATE INDEX IF NOT EXISTS idx_policy_events_status ON policy_issuance.policy_events(status);
CREATE INDEX IF NOT EXISTS idx_policy_events_created_at ON policy_issuance.policy_events(created_at);

-- Inserir usuário admin padrão
INSERT INTO policy_issuance.users (name, email, cpf, password, role, status) VALUES
('Admin User', 'admin@portobank.com', '12345678901', '$2a$12$7ugt2cIAdgXoFMT0UAqJheX.bCigmiSGFIN0PpAq2MA1hbXqXzx/m', 'admin', 'active'),
('Test Admin', 'test@portobank.com', '98765432100', '$2a$12$7ugt2cIAdgXoFMT0UAqJheX.bCigmiSGFIN0PpAq2MA1hbXqXzx/m', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;
