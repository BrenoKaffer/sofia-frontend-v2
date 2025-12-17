-- Função corrigida para resolver o erro "AuthApiError: Database error saving new user"
-- Esta versão alinha com a estrutura real das tabelas user_profiles e user_preferences

-- Remove a função existente se ela existir
DROP FUNCTION IF EXISTS insert_user_profile_on_registration(UUID, TEXT, TEXT, TEXT);

-- Cria a função corrigida
CREATE OR REPLACE FUNCTION insert_user_profile_on_registration(
    p_user_id UUID,
    p_full_name TEXT,
    p_cpf TEXT,
    p_email TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log de início da execução
    RAISE NOTICE 'Iniciando insert_user_profile_on_registration para user_id: %', p_user_id;
    
    -- Inserir nas preferências do usuário (apenas campos que existem na tabela)
    INSERT INTO user_preferences (
        id,
        theme,
        notifications
    ) VALUES (
        p_user_id,
        'light',  -- valor padrão para theme
        true      -- valor padrão para notifications
    )
    ON CONFLICT (id) DO UPDATE SET
        theme = EXCLUDED.theme,
        notifications = EXCLUDED.notifications;
    
    -- Inserir no perfil do usuário (apenas campos que existem na tabela)
    INSERT INTO user_profiles (
        user_id,
        preferences,
        email,
        cpf
    ) VALUES (
        p_user_id,
        p_user_id,  -- referência para user_preferences
        p_email,
        p_cpf
    )
    ON CONFLICT (user_id) DO UPDATE SET
        preferences = EXCLUDED.preferences,
        email = EXCLUDED.email,
        cpf = EXCLUDED.cpf;
    
    -- Log de sucesso
    RAISE NOTICE 'Perfil do usuário criado com sucesso para user_id: %', p_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro
        RAISE LOG 'Erro ao criar perfil do usuário para user_id %: % %', p_user_id, SQLERRM, SQLSTATE;
        -- Re-raise o erro para que seja capturado pela aplicação
        RAISE;
END;
$$;

-- Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION insert_user_profile_on_registration(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_user_profile_on_registration(UUID, TEXT, TEXT, TEXT) TO service_role;

-- Comentário explicativo
COMMENT ON FUNCTION insert_user_profile_on_registration(UUID, TEXT, TEXT, TEXT) IS 
'Função corrigida para inserir dados do usuário nas tabelas user_profiles e user_preferences após registro via Supabase Auth. Alinhada com a estrutura real das tabelas.';

-- Instruções de uso:
-- 1. Execute este script no seu banco de dados Supabase
-- 2. Verifique se a função foi criada corretamente:
--    SELECT proname FROM pg_proc WHERE proname = 'insert_user_profile_on_registration';
-- 3. Teste a função com dados de exemplo se necessário
-- 4. A função será chamada automaticamente pelo código de registro