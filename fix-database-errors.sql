-- =====================================================
-- SCRIPT PARA CORRIGIR ERROS DE BANCO DE DADOS
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. VERIFICAR ESTRUTURA ATUAL DAS TABELAS
-- =====================================================

-- Verificar se a tabela system_logs existe
SELECT 
    'system_logs' as tabela,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'system_logs' 
            AND table_schema = 'public'
        ) THEN 'EXISTE'
        ELSE 'NÃO EXISTE'
    END as status;

-- Verificar estrutura da tabela user_profiles
SELECT 
    'user_profiles' as tabela,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela user_preferences
SELECT 
    'user_preferences' as tabela,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 2. CRIAR TABELA system_logs SE NÃO EXISTIR
-- =====================================================

CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    message TEXT NOT NULL,
    context TEXT,
    source TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_source ON public.system_logs(source);

-- =====================================================
-- 3. CORRIGIR ESTRUTURA DA TABELA user_profiles
-- =====================================================

-- Verificar se a coluna preferences existe e seu tipo
DO $$
DECLARE
    preferences_type TEXT;
BEGIN
    SELECT data_type INTO preferences_type
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'preferences'
    AND table_schema = 'public';
    
    IF preferences_type IS NULL THEN
        -- Coluna não existe, criar como JSONB
        ALTER TABLE public.user_profiles ADD COLUMN preferences JSONB DEFAULT '{}';
        RAISE NOTICE 'Coluna preferences criada como JSONB';
    ELSIF preferences_type = 'uuid' THEN
        -- Coluna existe mas é UUID, precisa alterar para JSONB
        RAISE NOTICE 'Coluna preferences é UUID, alterando para JSONB...';
        
        -- Backup dos dados existentes
        ALTER TABLE public.user_profiles RENAME COLUMN preferences TO preferences_backup;
        
        -- Criar nova coluna JSONB
        ALTER TABLE public.user_profiles ADD COLUMN preferences JSONB DEFAULT '{}';
        
        -- Migrar dados se necessário (assumindo que era uma referência para user_preferences)
        UPDATE public.user_profiles 
        SET preferences = '{}'::jsonb 
        WHERE preferences IS NULL;
        
        RAISE NOTICE 'Coluna preferences alterada para JSONB com sucesso';
    ELSE
        RAISE NOTICE 'Coluna preferences já é do tipo correto: %', preferences_type;
    END IF;
END $$;

-- Garantir que todas as colunas necessárias existam
DO $$
BEGIN
    -- Verificar e adicionar coluna full_name se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'full_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN full_name TEXT;
        RAISE NOTICE 'Coluna full_name adicionada';
    END IF;
    
    -- Verificar e adicionar coluna cpf se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'cpf'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN cpf TEXT;
        RAISE NOTICE 'Coluna cpf adicionada';
    END IF;
    
    -- Verificar e adicionar coluna email se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'email'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN email TEXT;
        RAISE NOTICE 'Coluna email adicionada';
    END IF;
    
    -- Verificar e adicionar outras colunas necessárias
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'notes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN notes JSONB DEFAULT '[]';
        RAISE NOTICE 'Coluna notes adicionada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'account_status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN account_status TEXT DEFAULT 'free';
        RAISE NOTICE 'Coluna account_status adicionada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'permissions'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN permissions JSONB DEFAULT '["basic_user"]';
        RAISE NOTICE 'Coluna permissions adicionada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'terms_accepted'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN terms_accepted BOOLEAN DEFAULT false;
        RAISE NOTICE 'Coluna terms_accepted adicionada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'registration_source'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN registration_source TEXT DEFAULT 'web_form';
        RAISE NOTICE 'Coluna registration_source adicionada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'profile_completed'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN profile_completed BOOLEAN DEFAULT true;
        RAISE NOTICE 'Coluna profile_completed adicionada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'onboarding_completed'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
        RAISE NOTICE 'Coluna onboarding_completed adicionada';
    END IF;
END $$;

-- =====================================================
-- 4. CRIAR/CORRIGIR FUNÇÃO DE INSERÇÃO
-- =====================================================

-- Remover função existente
DROP FUNCTION IF EXISTS insert_user_profile_on_registration(UUID, TEXT, TEXT, TEXT);

-- Criar função corrigida
CREATE OR REPLACE FUNCTION insert_user_profile_on_registration(
    p_user_id UUID,
    p_full_name TEXT,
    p_cpf TEXT,
    p_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Log de início
    RAISE NOTICE 'Iniciando insert_user_profile_on_registration para user_id: %', p_user_id;
    
    -- Inserir nas preferências do usuário
    INSERT INTO public.user_preferences (
        id,
        theme,
        notifications,
        language,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        'light',
        true,
        'pt-BR',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        updated_at = NOW();
    
    RAISE NOTICE 'Dados inseridos em user_preferences para user_id: %', p_user_id;
    
    -- Inserir no perfil do usuário com estrutura correta
    INSERT INTO public.user_profiles (
        user_id,
        full_name,
        cpf,
        email,
        preferences,  -- Agora é JSONB
        notes,
        account_status,
        permissions,
        terms_accepted,
        registration_source,
        profile_completed,
        onboarding_completed,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_full_name,
        p_cpf,
        p_email,
        jsonb_build_object(
            'registration_source', 'web_form',
            'email_verified', false,
            'bankroll_management', jsonb_build_object(
                'initial_bankroll', 0,
                'current_bankroll', 0,
                'daily_limit', 100,
                'session_limit', 50
            ),
            'risk_tolerance', 'medium'
        ),
        '[]'::jsonb,
        'free',
        '["basic_user"]'::jsonb,
        true,
        'web_form',
        true,
        false,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        cpf = EXCLUDED.cpf,
        email = EXCLUDED.email,
        preferences = EXCLUDED.preferences,
        updated_at = NOW();
    
    RAISE NOTICE 'Dados inseridos em user_profiles para user_id: %', p_user_id;
    
    -- Retornar sucesso
    result := json_build_object(
        'success', true,
        'message', 'User profile created successfully',
        'user_id', p_user_id,
        'timestamp', NOW()
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERRO na função insert_user_profile_on_registration: % - %', SQLSTATE, SQLERRM;
        
        result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'error_code', SQLSTATE,
            'user_id', p_user_id,
            'timestamp', NOW()
        );
        RETURN result;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION insert_user_profile_on_registration(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_user_profile_on_registration(UUID, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION insert_user_profile_on_registration(UUID, TEXT, TEXT, TEXT) TO service_role;

-- =====================================================
-- 5. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar estrutura final das tabelas
SELECT 'VERIFICAÇÃO FINAL - user_profiles' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'VERIFICAÇÃO FINAL - user_preferences' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_preferences' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'VERIFICAÇÃO FINAL - system_logs' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'system_logs' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se a função existe
SELECT 'VERIFICAÇÃO FINAL - função' as info;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'insert_user_profile_on_registration'
AND routine_schema = 'public';

-- =====================================================
-- 6. TESTE OPCIONAL
-- =====================================================

/*
-- Descomente para testar a função
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_result JSON;
BEGIN
    -- Testar a função
    SELECT insert_user_profile_on_registration(
        test_user_id,
        'Teste Usuario',
        '123.456.789-00',
        'teste@exemplo.com'
    ) INTO test_result;
    
    RAISE NOTICE 'Resultado do teste: %', test_result;
    
    -- Limpar dados de teste
    DELETE FROM public.user_preferences WHERE id = test_user_id;
    DELETE FROM public.user_profiles WHERE user_id = test_user_id;
    
    RAISE NOTICE 'Dados de teste removidos';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro no teste: %', SQLERRM;
END $$;
*/

-- =====================================================
-- INSTRUÇÕES
-- =====================================================
/*
1. Execute este script completo no SQL Editor do Supabase
2. Verifique os logs para confirmar que tudo foi criado corretamente
3. Teste o registro de usuário na aplicação
4. Se houver problemas, descomente a seção de teste no final
*/