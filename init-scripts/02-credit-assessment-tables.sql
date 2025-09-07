-- Script de criação das tabelas do Credit Assessment Service
-- Executado automaticamente pelo Docker Compose

-- Conectar ao banco credit_assessment
\c credit_assessment;

-- Criar enums para o Credit Assessment Service
CREATE TYPE credit_assessment.assessment_status_enum AS ENUM (
    'pending',
    'in_progress', 
    'completed',
    'failed',
    'cancelled'
);

CREATE TYPE credit_assessment.risk_level_enum AS ENUM (
    'low',
    'medium',
    'high',
    'very_high'
);

CREATE TYPE credit_assessment.assessment_result_enum AS ENUM (
    'approved',
    'rejected',
    'pending_additional_info'
);

CREATE TYPE credit_assessment.criteria_type_enum AS ENUM (
    'income_ratio',
    'debt_to_income',
    'credit_history',
    'employment_stability',
    'collateral',
    'age',
    'location'
);

CREATE TYPE credit_assessment.criteria_operator_enum AS ENUM (
    'gt',
    'lt',
    'eq',
    'gte',
    'lte',
    'in',
    'not_in'
);

CREATE TYPE credit_assessment.log_level_enum AS ENUM (
    'info',
    'warning',
    'error',
    'debug'
);

CREATE TYPE credit_assessment.log_action_enum AS ENUM (
    'assessment_started',
    'criteria_evaluated',
    'external_api_called',
    'score_calculated',
    'decision_made',
    'assessment_completed',
    'error_occurred'
);

-- Tabela: credit_assessments
CREATE TABLE IF NOT EXISTS credit_assessment.credit_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    policy_number VARCHAR(20) NOT NULL,
    status credit_assessment.assessment_status_enum DEFAULT 'pending',
    result credit_assessment.assessment_result_enum,
    credit_score INTEGER,
    risk_level credit_assessment.risk_level_enum,
    requested_amount DECIMAL(15,2) NOT NULL,
    approved_amount DECIMAL(15,2),
    interest_rate DECIMAL(5,2),
    term_months INTEGER,
    rejection_reason TEXT,
    external_data JSONB,
    assessment_criteria JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: assessment_criteria
CREATE TABLE IF NOT EXISTS credit_assessment.assessment_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type credit_assessment.criteria_type_enum NOT NULL,
    operator credit_assessment.criteria_operator_enum NOT NULL,
    value JSONB NOT NULL,
    weight DECIMAL(5,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: assessment_logs
CREATE TABLE IF NOT EXISTS credit_assessment.assessment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL,
    action credit_assessment.log_action_enum NOT NULL,
    level credit_assessment.log_level_enum NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_credit_assessments_policy_id ON credit_assessment.credit_assessments(policy_id);
CREATE INDEX IF NOT EXISTS idx_credit_assessments_customer_id ON credit_assessment.credit_assessments(customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_assessments_status ON credit_assessment.credit_assessments(status);
CREATE INDEX IF NOT EXISTS idx_credit_assessments_created_at ON credit_assessment.credit_assessments(created_at);

CREATE INDEX IF NOT EXISTS idx_assessment_criteria_type ON credit_assessment.assessment_criteria(type);
CREATE INDEX IF NOT EXISTS idx_assessment_criteria_is_active ON credit_assessment.assessment_criteria(is_active);

CREATE INDEX IF NOT EXISTS idx_assessment_logs_assessment_id ON credit_assessment.assessment_logs(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_logs_action ON credit_assessment.assessment_logs(action);
CREATE INDEX IF NOT EXISTS idx_assessment_logs_level ON credit_assessment.assessment_logs(level);
CREATE INDEX IF NOT EXISTS idx_assessment_logs_created_at ON credit_assessment.assessment_logs(created_at);

-- Criar constraint unique para policy_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_assessments_policy_id_unique ON credit_assessment.credit_assessments(policy_id);

-- Inserir critérios padrão de avaliação
INSERT INTO credit_assessment.assessment_criteria (name, description, type, operator, value, weight, is_active) VALUES
('Income Ratio', 'Ratio between income and requested amount', 'income_ratio', 'lte', '{"max_ratio": 0.3}', 0.25, true),
('Debt to Income', 'Total debt compared to income', 'debt_to_income', 'lte', '{"max_ratio": 0.4}', 0.20, true),
('Credit History', 'Length and quality of credit history', 'credit_history', 'gte', '{"min_months": 12}', 0.20, true),
('Employment Stability', 'Employment history and stability', 'employment_stability', 'gte', '{"min_months": 6}', 0.15, true),
('Age', 'Customer age for risk assessment', 'age', 'gte', '{"min_age": 18, "max_age": 65}', 0.10, true),
('Location', 'Geographic risk assessment', 'location', 'not_in', '{"high_risk_areas": ["area1", "area2"]}', 0.10, true)
ON CONFLICT DO NOTHING;
