-- =====================================================
-- FUNÇÃO PARA INSERIR DADOS DO USUÁRIO APÓS REGISTRO
-- =====================================================
-- Esta função resolve o erro "AuthApiError: Database error saving new user"
-- criando a função insert_user_profile_on_registration que é chamada pelo código

-- Remove a função se ela existir (para evitar conflitos)
DROP FUNCTION IF EXISTS insert_user_profile_on_registration(uuid, text, text, text);

-- Cria a função insert_user_profile_on_registration
CREATE OR REPLACE FUNCTION insert_user_profile_on_registration(
    p_user_id uuid,
    p_full_name text,
    p_cpf text,
    p_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Log da execução da função
    RAISE NOTICE 'Executando insert_user_profile_on_registration para user_id: %', p_user_id;
    
    -- Insere nas preferências do usuário (estrutura correta)
    INSERT INTO user_preferences (
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
    INSERT INTO user_profiles (
        user_id,
        full_name,
        cpf,
        email,
        preferences,
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

    -- Retorna sucesso
    result := json_build_object(
        'success', true,
        'message', 'User profile created successfully',
        'user_id', p_user_id,
        'timestamp', NOW()
    );
    
    RAISE NOTICE 'Função executada com sucesso para user_id: %', p_user_id;
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
'Função para inserir dados do usuário nas tabelas user_preferences e user_profiles após o registro. Usa SECURITY DEFINER para contornar RLS.';

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================
/*
1. Execute este SQL no Supabase SQL Editor
2. Teste o registro na aplicação
3. Verifique os logs no console do navegador para ver os detalhes
4. Os logs da função SQL aparecerão nos logs do Supabase (se habilitados)

Esta função resolve o erro:
"AuthApiError: Database error saving new user"

Características:
- SECURITY DEFINER: Executa com privilégios elevados, contornando RLS
- Tratamento de conflitos: Usa ON CONFLICT para evitar erros de duplicação
- Logs detalhados: RAISE NOTICE para debug
- Tratamento de erros: Captura e retorna erros de forma estruturada
- Permissões adequadas: Permite acesso a usuários autenticados, anônimos e service_role
*/