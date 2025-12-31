-- =====================================================
-- MIGRAÇÃO SEGURA: ADICIONAR ADMIN E SUPERADMIN AO ENUM EXISTENTE
-- =====================================================

-- Este script adiciona os novos valores 'admin' e 'superadmin' ao enum existente
-- de forma segura, verificando se já existem antes de tentar adicioná-los

-- 1. Verificar se o enum existe e quais valores já possui
DO $$
BEGIN
    -- Verificar se o tipo existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status_enum') THEN
        RAISE EXCEPTION 'O tipo account_status_enum não existe. Execute primeiro o script de criação completo.';
    END IF;
    
    RAISE NOTICE 'Enum account_status_enum encontrado. Verificando valores existentes...';
END $$;

-- 2. Adicionar 'admin' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'account_status_enum')
        AND enumlabel = 'admin'
    ) THEN
        ALTER TYPE public.account_status_enum ADD VALUE 'admin';
        RAISE NOTICE 'Valor "admin" adicionado ao enum account_status_enum';
    ELSE
        RAISE NOTICE 'Valor "admin" já existe no enum account_status_enum';
    END IF;
END $$;

-- 3. Adicionar 'superadmin' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'account_status_enum')
        AND enumlabel = 'superadmin'
    ) THEN
        ALTER TYPE public.account_status_enum ADD VALUE 'superadmin';
        RAISE NOTICE 'Valor "superadmin" adicionado ao enum account_status_enum';
    ELSE
        RAISE NOTICE 'Valor "superadmin" já existe no enum account_status_enum';
    END IF;
END $$;

-- 4. Verificar todos os valores do enum após a migração
DO $$
DECLARE
    enum_values text;
BEGIN
    SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder) INTO enum_values
    FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'account_status_enum');
    
    RAISE NOTICE 'Valores atuais do enum account_status_enum: %', enum_values;
END $$;

-- =====================================================
-- CRIAR/ATUALIZAR FUNÇÕES AUXILIARES PARA ADMIN
-- =====================================================

-- Função para verificar se usuário é admin (criar ou substituir)
CREATE OR REPLACE FUNCTION public.user_is_admin(status public.account_status_enum)
RETURNS boolean AS $$
BEGIN
  RETURN status IN ('admin', 'superadmin');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para verificar se usuário é superadmin (criar ou substituir)
CREATE OR REPLACE FUNCTION public.user_is_superadmin(status public.account_status_enum)
RETURNS boolean AS $$
BEGIN
  RETURN status = 'superadmin';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Atualizar função user_has_access para incluir admin e superadmin
CREATE OR REPLACE FUNCTION public.user_has_access(status public.account_status_enum)
RETURNS boolean AS $$
BEGIN
  RETURN status IN ('active', 'free', 'premium', 'trial', 'admin', 'superadmin');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- CRIAR/ATUALIZAR VIEWS PARA ADMINISTRADORES
-- =====================================================

-- View com usuários administradores (criar ou substituir)
CREATE OR REPLACE VIEW public.admin_users AS
SELECT 
  up.*,
  au.email as auth_email,
  au.created_at as auth_created_at
FROM public.user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE public.user_is_admin(up.account_status);

-- View com super administradores (criar ou substituir)
CREATE OR REPLACE VIEW public.superadmin_users AS
SELECT 
  up.*,
  au.email as auth_email,
  au.created_at as auth_created_at
FROM public.user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE public.user_is_superadmin(up.account_status);

-- =====================================================
-- COMENTÁRIOS E EXEMPLOS DE USO
-- =====================================================

-- Atualizar comentário do tipo
COMMENT ON TYPE public.account_status_enum IS 'Status da conta do usuário: active/free/premium/trial/admin/superadmin (acesso liberado), blocked/suspended/banned (acesso negado), inactive (limitado), pending (verificação)';

-- Exemplos de uso dos novos status:
/*
-- Promover usuário para admin
UPDATE public.user_profiles 
SET account_status = 'admin' 
WHERE user_id = 'uuid-do-usuario';

-- Promover usuário para superadmin
UPDATE public.user_profiles 
SET account_status = 'superadmin' 
WHERE user_id = 'uuid-do-usuario';

-- Consultar todos os administradores
SELECT * FROM public.admin_users;

-- Consultar apenas super administradores
SELECT * FROM public.superadmin_users;

-- Verificar se usuário é admin
SELECT public.user_is_admin(account_status) as is_admin
FROM public.user_profiles 
WHERE user_id = 'uuid-do-usuario';

-- Verificar se usuário é superadmin
SELECT public.user_is_superadmin(account_status) as is_superadmin
FROM public.user_profiles 
WHERE user_id = 'uuid-do-usuario';
*/

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Mostrar estrutura final do enum
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'account_status_enum'
ORDER BY e.enumsortorder;