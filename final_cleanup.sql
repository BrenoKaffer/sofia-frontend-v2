-- =====================================================
-- LIMPEZA FINAL - REMOVER VERSÃO MUTÁVEL ESPECÍFICA
-- =====================================================

-- 1. IDENTIFICAR A VERSÃO PROBLEMÁTICA
SELECT 
    p.oid,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN p.proconfig IS NULL THEN 'MUTÁVEL ❌'
        WHEN array_to_string(p.proconfig, ', ') LIKE '%search_path%' THEN 'SEGURO ✅'
        ELSE 'MUTÁVEL ❌'
    END as search_path_status,
    array_to_string(p.proconfig, ', ') as current_config,
    'DROP FUNCTION IF EXISTS ' || n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ');' as drop_command
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'insert_user_profile_on_registration'
AND p.proconfig IS NULL  -- Esta é a versão mutável
ORDER BY p.oid;

-- 2. REMOVER APENAS A VERSÃO MUTÁVEL
-- Execute o comando DROP que apareceu na consulta acima

-- 3. GARANTIR QUE A VERSÃO CORRETA EXISTE
CREATE OR REPLACE FUNCTION insert_user_profile_on_registration(
    p_user_id uuid,
    p_full_name text,
    p_cpf text,
    p_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    result json;
BEGIN
    -- Log da execução da função
    RAISE NOTICE 'Executando insert_user_profile_on_registration para user_id: %', p_user_id;
    
    -- Insere nas preferências do usuário
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

    -- Insere no perfil do usuário
    INSERT INTO public.user_profiles (
        user_id,
        full_name,
        cpf,
        email,
        email_verified,
        preferences,
        notes,
        account_status,
        permissions,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_full_name,
        p_cpf,
        p_email,
        false,
        jsonb_build_object(
            'registration_source', 'web_form',
            'profile_completed', true,
            'onboarding_completed', false,
            'terms_accepted', true,
            'registration_date', NOW()::text
        ),
        '[]'::jsonb,
        'free',
        '["basic_user"]'::jsonb,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        cpf = EXCLUDED.cpf,
        email = EXCLUDED.email,
        updated_at = NOW();

    -- Retorna sucesso
    result := json_build_object(
        'success', true,
        'message', 'Perfil do usuário criado com sucesso',
        'user_id', p_user_id,
        'timestamp', NOW()
    );
    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
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
GRANT EXECUTE ON FUNCTION insert_user_profile_on_registration(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_user_profile_on_registration(uuid, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION insert_user_profile_on_registration(uuid, text, text, text) TO service_role;

-- 4. VERIFICAÇÃO FINAL
SELECT 
    'RESULTADO FINAL' as status,
    p.proname as function_name,
    CASE 
        WHEN p.proconfig IS NULL THEN 'MUTÁVEL (PRECISA CORREÇÃO) ❌'
        WHEN array_to_string(p.proconfig, ', ') LIKE '%search_path%' THEN 'SEGURO ✅'
        ELSE 'MUTÁVEL (PRECISA CORREÇÃO) ❌'
    END as search_path_status,
    array_to_string(p.proconfig, ', ') as current_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'insert_user_profile_on_registration',
    'format_phone_number',
    'update_updated_at_column'
)
ORDER BY function_name;

-- =====================================================
-- RESULTADO ESPERADO: TODAS AS FUNÇÕES "SEGURO ✅"
-- =====================================================