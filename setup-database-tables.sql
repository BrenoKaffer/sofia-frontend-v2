-- =====================================================
-- SCRIPT PARA CRIAR TABELAS NECESSÁRIAS NO SUPABASE
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Criar tabela user_profiles (principal para registro)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    cpf TEXT NOT NULL,
    email TEXT NOT NULL,
    preferences JSONB DEFAULT '{}' NOT NULL,
    notes JSONB DEFAULT '[]' NOT NULL,
    account_status TEXT DEFAULT 'free' CHECK (account_status IN ('free', 'premium', 'enterprise')),
    permissions JSONB DEFAULT '["basic_user"]' NOT NULL,
    terms_accepted BOOLEAN DEFAULT false NOT NULL,
    registration_source TEXT DEFAULT 'web_form',
    profile_completed BOOLEAN DEFAULT true,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabela profiles removida - dados centralizados em user_profiles

-- 3. Criar tabela user_preferences (configurações do usuário)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    notifications BOOLEAN DEFAULT true,
    language TEXT DEFAULT 'pt-BR',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_status ON public.user_profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_cpf ON public.user_profiles(cpf);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
-- Índices da tabela profiles removidos - dados centralizados em user_profiles

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
-- RLS da tabela profiles removido - dados centralizados em user_profiles
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas de segurança
-- Usuários podem ver e editar apenas seus próprios dados

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
-- Políticas da tabela profiles removidas - dados centralizados em user_profiles
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;

-- Políticas para user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas da tabela profiles removidas - dados centralizados em user_profiles

-- Políticas para user_preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 7. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar triggers para atualizar updated_at
-- Remover triggers existentes se houver
DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON public.user_profiles;
-- Trigger da tabela profiles removido - dados centralizados em user_profiles
DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON public.user_preferences;

CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger da tabela profiles removido - dados centralizados em user_profiles

CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 9. Criar função para criar perfil automaticamente (OPCIONAL)
-- Esta função pode ser usada com trigger para automação completa
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserção na tabela profiles removida - dados centralizados em user_profiles
    
    -- Inserir na tabela user_preferences
    INSERT INTO public.user_preferences (id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW());
    
    -- Inserir na tabela user_profiles
    INSERT INTO public.user_profiles (
        user_id,
        full_name,
        cpf,
        email,
        terms_accepted,
        registration_source,
        profile_completed,
        onboarding_completed,
        preferences,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
        NEW.email,
        true,
        'web_form',
        true,
        false,
        jsonb_build_object(
            'registration_date', NOW()::text,
            'email_verified', false
        ),
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Criar trigger automático (OPCIONAL - descomente se quiser automação)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VERIFICAÇÃO DAS TABELAS CRIADAS
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'profiles', 'user_preferences')
ORDER BY tablename;

-- Verificar estrutura da tabela user_profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

/*
APÓS EXECUTAR ESTE SCRIPT:

1. Todas as tabelas necessárias estarão criadas
2. RLS estará habilitado para segurança
3. Políticas de acesso estarão configuradas
4. Triggers para updated_at estarão ativos
5. Função de automação estará disponível (mas não ativa)

PARA ATIVAR AUTOMAÇÃO COMPLETA:
- Descomente as linhas do trigger on_auth_user_created
- Isso criará automaticamente os perfis quando um usuário se registrar

PARA USAR INSERÇÃO MANUAL:
- Mantenha o trigger comentado
- Use as funções TypeScript para inserir dados após o registro

RECOMENDAÇÃO:
- Use inserção manual para ter mais controle sobre o processo
- Monitore os logs para identificar problemas
- Teste o registro com dados reais
*/