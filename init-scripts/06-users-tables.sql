-- Script de criação das tabelas do User Manager Service
-- Executado automaticamente pelo Docker Compose

-- Conectar ao banco users
\c users;

-- Criar enums para o User Manager Service
CREATE TYPE users.user_role_enum AS ENUM (
    'admin',
    'agent',
    'customer',
    'analyst',
    'manager'
);

CREATE TYPE users.user_status_enum AS ENUM (
    'active',
    'inactive',
    'suspended'
);

-- Tabela: users
CREATE TABLE IF NOT EXISTS users.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role users.user_role_enum NOT NULL,
    status users.user_status_enum DEFAULT 'active',
    phone VARCHAR(20),
    birth_date DATE,
    address JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users.users(email);
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users.users(cpf);
CREATE INDEX IF NOT EXISTS idx_users_role ON users.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users.users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users.users(created_at);

-- Inserir usuário admin padrão
INSERT INTO users.users (name, email, cpf, password, role, status) VALUES
('Admin User', 'admin@portobank.com', '12345678901', '$2a$12$7ugt2cIAdgXoFMT0UAqJheX.bCigmiSGFIN0PpAq2MA1hbXqXzx/m', 'admin', 'active'),
('Test Admin', 'test@portobank.com', '98765432100', '$2a$12$7ugt2cIAdgXoFMT0UAqJheX.bCigmiSGFIN0PpAq2MA1hbXqXzx/m', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;
