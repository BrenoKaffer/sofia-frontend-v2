-- =====================================================
-- LIMPEZA DE FUNÇÕES DUPLICADAS OU ANTIGAS
-- =====================================================
-- Este script remove versões antigas das funções que podem
-- ainda estar aparecendo como "MUTÁVEL" no relatório

-- =====================================================
-- 1. VERIFICAR FUNÇÕES DUPLICADAS
-- =====================================================

-- Listar todas as versões da função insert_user_profile_on_registration
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
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'insert_user_profile_on_registration'
ORDER BY p.oid;

-- =====================================================
-- 2. REMOVER VERSÕES ANTIGAS (SE NECESSÁRIO)
-- =====================================================

-- Se houver múltiplas versões, remover as antigas
-- CUIDADO: Execute apenas se confirmar que há versões duplicadas

/*
-- Exemplo de remoção (descomente apenas se necessário):
DROP FUNCTION IF EXISTS insert_user_profile_on_registration(uuid, text, text, text);
*/

-- =====================================================
-- 3. RECRIAR A FUNÇÃO FINAL (GARANTIA)
-- =====================================================

-- Recriar a função com a versão mais atualizada e segura
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

-- =====================================================
-- 4. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se agora todas as instâncias estão seguras
SELECT 
    'VERIFICAÇÃO FINAL' as status,
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
-- INSTRUÇÕES
-- =====================================================

/*
🎯 COMO USAR:

1. Execute a primeira consulta para ver se há funções duplicadas
2. Se houver versões antigas, descomente e execute a remoção
3. Execute a recriação da função (sempre seguro)
4. Execute a verificação final
5. Todas as funções devem mostrar "SEGURO ✅"

🔒 RESULTADO ESPERADO:
- Apenas uma versão de cada função
- Todas com search_path="" 
- Status "SEGURO ✅" para todas
*/