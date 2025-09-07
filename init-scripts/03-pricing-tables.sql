-- Script de criação das tabelas do Pricing Service
-- Executado automaticamente pelo Docker Compose

-- Conectar ao banco pricing
\c pricing;

-- Criar enums para o Pricing Service
CREATE TYPE pricing.pricing_status_enum AS ENUM (
    'draft',
    'pending_approval',
    'approved',
    'rejected',
    'active',
    'inactive'
);

CREATE TYPE pricing.pricing_type_enum AS ENUM (
    'base_premium',
    'tax',
    'fee',
    'discount',
    'adjustment'
);

CREATE TYPE pricing.rule_type_enum AS ENUM (
    'age',
    'location',
    'coverage_amount',
    'risk_level',
    'customer_segment',
    'policy_type'
);

CREATE TYPE pricing.rule_operator_enum AS ENUM (
    'equals',
    'greater_than',
    'less_than',
    'greater_equal',
    'less_equal',
    'between',
    'in',
    'not_in'
);

-- Tabela: pricings
CREATE TABLE IF NOT EXISTS pricing.pricings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    policy_number VARCHAR(50) NOT NULL,
    status pricing.pricing_status_enum DEFAULT 'draft',
    base_premium DECIMAL(15,2) NOT NULL,
    taxes DECIMAL(15,2) DEFAULT 0,
    fees DECIMAL(15,2) DEFAULT 0,
    discounts DECIMAL(15,2) DEFAULT 0,
    adjustments DECIMAL(15,2) DEFAULT 0,
    total_premium DECIMAL(15,2) NOT NULL,
    coverage_amount DECIMAL(15,2) NOT NULL,
    premium_rate DECIMAL(8,4),
    effective_date DATE NOT NULL,
    expiration_date DATE,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    pricing_details JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: pricing_rules
CREATE TABLE IF NOT EXISTS pricing.pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rule_type pricing.rule_type_enum NOT NULL,
    operator pricing.rule_operator_enum NOT NULL,
    condition_value JSONB NOT NULL,
    adjustment_type pricing.pricing_type_enum NOT NULL,
    adjustment_value DECIMAL(15,2) NOT NULL,
    adjustment_percentage DECIMAL(5,2),
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    effective_date DATE NOT NULL,
    expiration_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: pricing_history
CREATE TABLE IF NOT EXISTS pricing.pricing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pricing_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pricings_policy_id ON pricing.pricings(policy_id);
CREATE INDEX IF NOT EXISTS idx_pricings_customer_id ON pricing.pricings(customer_id);
CREATE INDEX IF NOT EXISTS idx_pricings_status ON pricing.pricings(status);
CREATE INDEX IF NOT EXISTS idx_pricings_effective_date ON pricing.pricings(effective_date);
CREATE INDEX IF NOT EXISTS idx_pricings_created_at ON pricing.pricings(created_at);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_rule_type ON pricing.pricing_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_is_active ON pricing.pricing_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_priority ON pricing.pricing_rules(priority);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_effective_date ON pricing.pricing_rules(effective_date);

CREATE INDEX IF NOT EXISTS idx_pricing_history_pricing_id ON pricing.pricing_history(pricing_id);
CREATE INDEX IF NOT EXISTS idx_pricing_history_action ON pricing.pricing_history(action);
CREATE INDEX IF NOT EXISTS idx_pricing_history_created_at ON pricing.pricing_history(created_at);

-- Criar constraint unique para policy_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_pricings_policy_id_unique ON pricing.pricings(policy_id);

-- Inserir regras de precificação padrão
INSERT INTO pricing.pricing_rules (name, description, rule_type, operator, condition_value, adjustment_type, adjustment_value, adjustment_percentage, priority, is_active, effective_date) VALUES
('Base Premium - Fiança', 'Base premium for fiança policies', 'policy_type', 'equals', '{"policy_type": "fianca"}', 'base_premium', 1000.00, NULL, 1, true, CURRENT_DATE),
('Age Discount - Young', 'Discount for customers under 30', 'age', 'less_than', '{"age": 30}', 'discount', 0, 10.00, 2, true, CURRENT_DATE),
('Age Surcharge - Senior', 'Surcharge for customers over 60', 'age', 'greater_than', '{"age": 60}', 'adjustment', 0, 15.00, 2, true, CURRENT_DATE),
('High Coverage Surcharge', 'Surcharge for coverage over 500k', 'coverage_amount', 'greater_than', '{"amount": 500000}', 'adjustment', 0, 5.00, 3, true, CURRENT_DATE),
('Low Risk Discount', 'Discount for low risk customers', 'risk_level', 'equals', '{"risk_level": "low"}', 'discount', 0, 20.00, 4, true, CURRENT_DATE),
('High Risk Surcharge', 'Surcharge for high risk customers', 'risk_level', 'equals', '{"risk_level": "high"}', 'adjustment', 0, 25.00, 4, true, CURRENT_DATE),
('Tax Rate', 'Standard tax rate', 'policy_type', 'in', '{"policy_types": ["fianca", "capitalizacao"]}', 'tax', 0, 8.50, 5, true, CURRENT_DATE),
('Processing Fee', 'Standard processing fee', 'policy_type', 'in', '{"policy_types": ["fianca", "capitalizacao"]}', 'fee', 150.00, NULL, 6, true, CURRENT_DATE)
ON CONFLICT DO NOTHING;
