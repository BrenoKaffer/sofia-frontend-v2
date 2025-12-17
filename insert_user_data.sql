-- SQL para inserir dados do formulário de cadastro nas tabelas do banco
-- Este script deve ser executado após o usuário ser criado no Supabase Auth

-- =====================================================
-- INSERÇÃO DE DADOS DO USUÁRIO APÓS CADASTRO
-- =====================================================

-- OPÇÃO 1: INSERÇÃO MANUAL COM VALORES DIRETOS
-- Substitua os valores entre aspas pelos dados reais do formulário

-- Inserção na tabela profiles removida - dados centralizados em user_profiles

-- 2. Inserir preferências padrão na tabela user_preferences
-- Esta tabela armazena configurações de preferências do usuário
INSERT INTO public.user_preferences (
    id,
    theme,
    notifications,
    language,
    created_at,
    updated_at
) VALUES (
    'SEU_USER_UUID_AQUI', -- Mesmo UUID do usuário
    'light', -- Tema padrão
    true, -- Notificações habilitadas por padrão
    'pt-BR', -- Idioma padrão
    NOW(),
    NOW()
);

-- 3. Inserir perfil completo na tabela user_profiles (dados centralizados)
-- Esta tabela armazena todas as informações do usuário
INSERT INTO public.user_profiles (
    user_id,
    email,
    full_name,
    cpf,
    email_verified,
    preferences,
    notes,
    account_status,
    permissions,
    created_at,
    updated_at
) VALUES (
    'SEU_USER_UUID_AQUI', -- UUID do usuário
    'email@exemplo.com', -- Email do formulário
    'Nome Completo do Usuário', -- Nome completo do formulário
    '000.000.000-00', -- CPF do formulário
    false, -- Email não verificado inicialmente
    jsonb_build_object(
        'registration_source', 'web_form',
        'profile_completed', true,
        'onboarding_completed', false
    ), -- Preferências em formato JSON
    '[]'::jsonb, -- Array vazio de notas
    'free', -- Status da conta (padrão: gratuita)
    '["basic_user"]'::jsonb, -- Permissões básicas
    NOW(),
    NOW()
);

-- =====================================================
-- OPÇÃO 2: FUNÇÃO PARA INSERÇÃO COM PARÂMETROS
-- =====================================================

-- Criar função para inserir dados do usuário
CREATE OR REPLACE FUNCTION insert_user_registration_data(
    p_user_id UUID,
    p_email TEXT,
    p_full_name TEXT,
    p_cpf TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Inserção na tabela profiles removida - dados centralizados em user_profiles
    
    -- Inserir na tabela user_preferences
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
    );
    
    -- Inserir na tabela user_profiles (dados centralizados)
    INSERT INTO public.user_profiles (
        user_id,
        email,
        full_name,
        cpf,
        email_verified,
        preferences,
        notes,
        account_status,
        permissions,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_email,
        p_full_name,
        p_cpf,
        false,
        jsonb_build_object(
            'registration_source', 'web_form',
            'profile_completed', true,
            'onboarding_completed', false
        ),
        '[]'::jsonb,
        'free',
        '["basic_user"]'::jsonb,
        NOW(),
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Exemplo de uso da função:
-- SELECT insert_user_registration_data(
--     'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID,
--     'usuario@exemplo.com',
--     'João Silva Santos',
--     '123.456.789-00'
-- );

-- =====================================================
-- EXEMPLO DE USO COM DADOS REAIS
-- =====================================================

-- Substitua os valores abaixo pelos dados reais do formulário:
/*
EXEMPLO:

-- Dados do formulário:
-- UUID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
-- Email: 'usuario@exemplo.com'
-- Nome: 'João Silva Santos'
-- CPF: '123.456.789-00'

INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    created_at,
    updated_at
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'usuario@exemplo.com',
    'João Silva Santos',
    NULL,
    NOW(),
    NOW()
);

INSERT INTO public.user_preferences (
    id,
    theme,
    notifications,
    language,
    created_at,
    updated_at
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'light',
    true,
    'pt-BR',
    NOW(),
    NOW()
);

INSERT INTO public.user_profiles (
    user_id,
    preferences,
    notes,
    account_status,
    permissions,
    created_at,
    updated_at
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    jsonb_build_object(
        'cpf', '123.456.789-00',
        'registration_source', 'web_form',
        'email_verified', false,
        'profile_completed', true,
        'onboarding_completed', false
    ),
    '[]'::jsonb,
    'free',
    '["basic_user"]'::jsonb,
    NOW(),
    NOW()
);
*/

-- =====================================================
-- TRIGGER PARA AUTOMAÇÃO (OPCIONAL)
-- =====================================================

-- Função para criar automaticamente os registros quando um usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir na tabela profiles
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NOW(),
        NOW()
    );
    
    -- Inserir na tabela user_preferences
    INSERT INTO public.user_preferences (id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW());
    
    -- Inserir na tabela user_profiles
    INSERT INTO public.user_profiles (
        user_id,
        preferences,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        jsonb_build_object(
            'cpf', COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
            'registration_source', 'web_form',
            'email_verified', false,
            'profile_completed', true,
            'onboarding_completed', false
        ),
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

/*
DADOS COLETADOS NO FORMULÁRIO:
1. fullName (string) - Nome completo do usuário
2. cpf (string) - CPF formatado (000.000.000-00)
3. email (string) - Email do usuário
4. password (string) - Senha (armazenada no auth.users pelo Supabase)
5. acceptTerms (boolean) - Aceite dos termos (não armazenado, apenas validação)

TABELAS AFETADAS:
1. auth.users - Criada automaticamente pelo Supabase Auth
2. public.profiles - Dados básicos do perfil
3. public.user_preferences - Preferências do usuário
4. public.user_profiles - Perfil completo com metadados

FLUXO DE INSERÇÃO:
1. Supabase Auth cria o usuário em auth.users
2. Trigger automático (se implementado) ou inserção manual nas tabelas públicas
3. UUID do auth.users é usado como chave estrangeira nas outras tabelas

SEGURANÇA:
- Nunca armazenar senhas em texto plano
- CPF deve ser tratado como dado sensível
- Implementar RLS (Row Level Security) nas tabelas
- Validar dados antes da inserção
*/