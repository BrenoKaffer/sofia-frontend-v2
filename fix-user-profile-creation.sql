-- =====================================================
-- SCRIPT PARA CORRIGIR CRIAÇÃO DE PERFIS DE USUÁRIO
-- =====================================================
-- Este script resolve o problema de redirecionamento do dashboard
-- criando as tabelas e funções necessárias para o perfil do usuário

-- 1. VERIFICAR E CRIAR TABELA user_profiles SE NÃO EXISTIR
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name TEXT,
    cpf TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    birth_date DATE,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT false,
    terms_accepted BOOLEAN DEFAULT false NOT NULL,
    profile_completed BOOLEAN DEFAULT true,
    onboarding_completed BOOLEAN DEFAULT false,
    account_status TEXT DEFAULT 'free' CHECK (account_status IN ('free', 'premium', 'enterprise', 'blocked', 'pending', 'inactive')),
    registration_source TEXT DEFAULT 'web_form',
    preferences JSONB DEFAULT '{}' NOT NULL,
    notes JSONB DEFAULT '[]' NOT NULL,
    permissions JSONB DEFAULT '["basic_user"]' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. VERIFICAR E CRIAR TABELA user_preferences SE NÃO EXISTIR
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    notifications BOOLEAN DEFAULT true,
    language TEXT DEFAULT 'pt-BR',
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_status ON public.user_profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_user_preferences_id ON public.user_preferences(id);

-- 4. FUNÇÃO PARA ATUALIZAR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. TRIGGERS PARA ATUALIZAR updated_at
-- =====================================================
DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 6. FUNÇÃO PRINCIPAL PARA CRIAR PERFIL DO USUÁRIO
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_user_profile(
    p_user_id UUID,
    p_full_name TEXT DEFAULT NULL,
    p_cpf TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Inserir em user_preferences
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

    -- Inserir em user_profiles
    INSERT INTO public.user_profiles (
        user_id,
        full_name,
        cpf,
        email,
        email_verified,
        terms_accepted,
        profile_completed,
        onboarding_completed,
        account_status,
        registration_source,
        preferences,
        notes,
        permissions,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        COALESCE(p_full_name, ''),
        COALESCE(p_cpf, ''),
        COALESCE(p_email, ''),
        false,
        true,
        true,
        false,
        'free',
        'web_form',
        '{}',
        '[]',
        '["basic_user"]',
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
        cpf = COALESCE(EXCLUDED.cpf, user_profiles.cpf),
        email = COALESCE(EXCLUDED.email, user_profiles.email),
        updated_at = NOW();

    RAISE NOTICE 'Perfil criado com sucesso para user_id: %', p_user_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao criar perfil do usuário %: %', p_user_id, SQLERRM;
END;
$$;

-- 7. FUNÇÃO PARA TRIGGER AUTOMÁTICO (OPCIONAL)
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar perfil automaticamente quando usuário é criado
    PERFORM public.create_user_profile(
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'cpf',
        NEW.email
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro mas não falhar a criação do usuário
        RAISE WARNING 'Erro ao criar perfil automático para %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. CRIAR TRIGGER AUTOMÁTICO (DESCOMENTE PARA ATIVAR)
-- =====================================================
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION public.handle_new_user();

-- 9. CONCEDER PERMISSÕES
-- =====================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT) TO service_role;

-- 10. HABILITAR RLS (Row Level Security)
-- =====================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para user_preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================
/*
1. Execute este script no SQL Editor do Supabase
2. Verifique se as tabelas foram criadas:
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user_profiles', 'user_preferences');

3. Teste a função manualmente:
   SELECT public.create_user_profile('seu-user-id-aqui'::UUID, 'Nome Teste', '123.456.789-00', 'teste@email.com');

4. Para ativar criação automática de perfis, descomente as linhas do trigger (linhas 148-152)

5. Teste o registro na aplicação

ESTRUTURA DAS TABELAS:
- user_profiles: Dados principais do usuário (nome, CPF, email, status da conta, etc.)
- user_preferences: Preferências do usuário (tema, notificações, idioma, etc.)

SEGURANÇA:
- RLS habilitado em ambas as tabelas
- Usuários só podem ver/editar seus próprios dados
- Função com SECURITY DEFINER para contornar RLS durante criação
*/