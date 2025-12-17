-- Script para corrigir constraints da tabela user_profiles
-- Corrige o erro de sintaxe "ADD CONSTRAINT IF NOT EXISTS"

-- Adicionar coluna email se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'email') THEN
        ALTER TABLE user_profiles ADD COLUMN email VARCHAR(255);
    END IF;
END $$;

-- Adicionar coluna full_name se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'full_name') THEN
        ALTER TABLE user_profiles ADD COLUMN full_name VARCHAR(255);
    END IF;
END $$;

-- Adicionar coluna cpf se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'cpf') THEN
        ALTER TABLE user_profiles ADD COLUMN cpf VARCHAR(14);
    END IF;
END $$;

-- Adicionar coluna phone se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'phone') THEN
        ALTER TABLE user_profiles ADD COLUMN phone VARCHAR(20);
    END IF;
END $$;

-- Adicionar coluna birth_date se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'birth_date') THEN
        ALTER TABLE user_profiles ADD COLUMN birth_date DATE;
    END IF;
END $$;

-- Adicionar constraint unique para email se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'user_profiles' AND constraint_name = 'user_profiles_email_unique') THEN
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);
    END IF;
END $$;

-- Adicionar constraint unique para cpf se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'user_profiles' AND constraint_name = 'user_profiles_cpf_unique') THEN
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_cpf_unique UNIQUE (cpf);
    END IF;
END $$;

-- Criar índices para performance se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_profiles_email') THEN
        CREATE INDEX idx_user_profiles_email ON user_profiles(email);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_profiles_cpf') THEN
        CREATE INDEX idx_user_profiles_cpf ON user_profiles(cpf);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_profiles_user_id') THEN
        CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
    END IF;
END $$;

-- Verificar estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;