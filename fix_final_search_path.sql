-- =====================================================
-- CORREÇÃO FINAL DO SEARCH_PATH PARA A FUNÇÃO
-- insert_user_profile_on_registration
-- =====================================================
-- Este script corrige o último problema de segurança identificado no RLS

-- Recriar a função com search_path seguro
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
    
    -- Insere nas preferências do usuário (estrutura correta)
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

    -- Insere no perfil do usuário (estrutura correta)
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
        p_user_id, -- referência para user_preferences
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

    RAISE NOTICE 'Dados inseridos em user_profiles para user_id: %', p_user_id;

    -- Retorna resultado de sucesso
    result := json_build_object(
        'success', true,
        'message', 'Perfil do usuário criado com sucesso',
        'user_id', p_user_id,
        'timestamp', NOW()
    );
    
    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, log detalhado e retorna informações do erro
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

-- Concede permissões para usuários autenticados e anônimos
GRANT EXECUTE ON FUNCTION insert_user_profile_on_registration(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_user_profile_on_registration(uuid, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION insert_user_profile_on_registration(uuid, text, text, text) TO service_role;

-- Comentário final
COMMENT ON FUNCTION insert_user_profile_on_registration(uuid, text, text, text) IS 
'Função para inserir dados do usuário nas tabelas user_preferences e user_profiles após o registro. Usa SECURITY DEFINER com search_path seguro para contornar RLS.';

-- =====================================================
-- VERIFICAÇÃO DA CORREÇÃO
-- =====================================================

-- Verificar se a função foi criada com search_path seguro
SELECT 
    proname as function_name,
    prosecdef as security_definer,
    proconfig as configuration
FROM pg_proc 
WHERE proname = 'insert_user_profile_on_registration';

-- =====================================================
-- INSTRUÇÕES DE EXECUÇÃO
-- =====================================================
/*
1. Execute este script no Supabase SQL Editor
2. Verifique se a função foi recriada com sucesso
3. Execute novamente o linter RLS para confirmar que o problema foi resolvido
4. A função agora tem SET search_path = '' que previne vulnerabilidades de segurança

MUDANÇA PRINCIPAL:
- Adicionado "SET search_path = ''" na definição da função
- Todas as referências a tabelas agora usam o schema público explicitamente (public.tabela)
- Isso previne ataques de injeção via search_path manipulation
*/