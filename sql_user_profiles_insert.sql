-- =====================================================
-- SQL PARA INSERIR DADOS DO FORMULÁRIO DE REGISTRO
-- NA TABELA user_profiles
-- =====================================================

-- OPÇÃO 1: INSERÇÃO DIRETA COM VALORES MANUAIS
-- Substitua os valores pelos dados reais do formulário

INSERT INTO public.user_profiles (
    user_id,
    preferences,
    notes,
    account_status,
    permissions,
    created_at,
    updated_at
) VALUES (
    'SEU_USER_UUID_AQUI', -- UUID do usuário (obtido após auth.signUp)
    jsonb_build_object(
        'cpf', '000.000.000-00', -- CPF do formulário
        'full_name', 'Nome Completo do Usuário', -- Nome completo do formulário
        'email', 'usuario@exemplo.com', -- Email do formulário
        'registration_source', 'web_form',
        'email_verified', false,
        'profile_completed', true,
        'onboarding_completed', false,
        'terms_accepted', true, -- Aceite dos termos
        'registration_date', NOW()::text
    ),
    '[]'::jsonb, -- Array vazio de notas
    'free', -- Status da conta (padrão: gratuita)
    '["basic_user"]'::jsonb, -- Permissões básicas
    NOW(),
    NOW()
);

-- =====================================================
-- OPÇÃO 2: FUNÇÃO PARA INSERÇÃO COM PARÂMETROS
-- =====================================================

-- Criar função para inserir dados do formulário na user_profiles
CREATE OR REPLACE FUNCTION insert_user_profile_from_form(
    p_user_id UUID,
    p_email TEXT,
    p_full_name TEXT,
    p_cpf TEXT,
    p_terms_accepted BOOLEAN DEFAULT true
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_profiles (
        user_id,
        preferences,
        notes,
        account_status,
        permissions,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        jsonb_build_object(
            'cpf', p_cpf,
            'full_name', p_full_name,
            'email', p_email,
            'registration_source', 'web_form',
            'email_verified', false,
            'profile_completed', true,
            'onboarding_completed', false,
            'terms_accepted', p_terms_accepted,
            'registration_date', NOW()::text
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
-- SELECT insert_user_profile_from_form(
--     'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID,
--     'usuario@exemplo.com',
--     'João Silva Santos',
--     '123.456.789-00',
--     true
-- );

-- =====================================================
-- OPÇÃO 3: TRIGGER AUTOMÁTICO APÓS REGISTRO
-- =====================================================

-- Função trigger para criar user_profile automaticamente
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        user_id,
        preferences,
        notes,
        account_status,
        permissions,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        jsonb_build_object(
            'registration_source', 'web_form',
            'email_verified', false,
            'profile_completed', false,
            'onboarding_completed', false,
            'registration_date', NOW()::text
        ),
        '[]'::jsonb,
        'free',
        '["basic_user"]'::jsonb,
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que executa após inserção na tabela auth.users
CREATE OR REPLACE TRIGGER trigger_create_user_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile_on_signup();

-- =====================================================
-- CAMPOS COLETADOS NO FORMULÁRIO DE REGISTRO:
-- =====================================================
-- 1. full_name (nome completo)
-- 2. cpf (CPF formatado)
-- 3. email (email do usuário)
-- 4. password (senha - não armazenada na user_profiles)
-- 5. confirmPassword (confirmação - não armazenada)
-- 6. termsAccepted (aceite dos termos)

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. O user_id deve ser o UUID retornado pelo Supabase Auth após o signup
-- 2. A senha não é armazenada na user_profiles (fica no auth.users)
-- 3. O CPF e outros dados do formulário ficam no campo 'preferences' como JSON
-- 4. Use a OPÇÃO 2 (função) para integração com TypeScript
-- 5. Use a OPÇÃO 3 (trigger) para automação completa