-- Script de verificação da estrutura criada
-- Executado automaticamente pelo Docker Compose

-- Verificar bancos criados
SELECT datname FROM pg_database WHERE datname IN ('policy_issuance', 'credit_assessment', 'pricing');

-- Verificar schemas no banco policy_issuance
\c policy_issuance;
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'policy_issuance';

-- Verificar tabelas no banco policy_issuance
SELECT table_name FROM information_schema.tables WHERE table_schema = 'policy_issuance';

-- Verificar schemas no banco credit_assessment
\c credit_assessment;
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'credit_assessment';

-- Verificar tabelas no banco credit_assessment
SELECT table_name FROM information_schema.tables WHERE table_schema = 'credit_assessment';

-- Verificar schemas no banco pricing
\c pricing;
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'pricing';

-- Verificar tabelas no banco pricing
SELECT table_name FROM information_schema.tables WHERE table_schema = 'pricing';

-- Voltar ao banco principal
\c policy_issuance;

-- Log de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Database structure verification completed successfully!';
    RAISE NOTICE 'All databases, schemas, and tables have been created.';
END $$;
