-- =====================================================
-- SCRIPT PARA CORRIGIR ERRO: column "cpf" does not exist
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Criar tabela user_profiles com todas as colunas necessárias
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Dados pessoais básicos (incluindo cpf, full_name, email)
    full_name TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    birth_date DATE,
    avatar_url TEXT,
    
    -- Status e verificações
    email_verified BOOLEAN DEFAULT false,
    terms_accepted BOOLEAN DEFAULT false NOT NULL,
    profile_completed BOOLEAN DEFAULT true,
    onboarding_completed BOOLEAN DEFAULT false,
    
    -- Configurações da conta
    account_status TEXT DEFAULT 'free' CHECK (account_status IN ('free', 'premium', 'enterprise')),
    registration_source TEXT DEFAULT 'web_form',
    
    -- Dados estruturados
    preferences JSONB DEFAULT '{}' NOT NULL,
    notes JSONB DEFAULT '[]' NOT NULL,
    permissions JSONB DEFAULT '["basic_user"]' NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Criar tabela user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    notifications BOOLEAN DEFAULT true,
    language TEXT DEFAULT 'pt-BR',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_cpf ON public.user_profiles(cpf);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_full_name ON public.user_profiles(full_name);

-- 4. Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de segurança
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para user_preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;

CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Triggers
DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON public.user_preferences;

CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user_profiles', 'user_preferences');

-- Verificar estrutura da tabela user_profiles (deve incluir cpf, full_name, email)
SELECT column_name, data_type, is_nullable FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Teste: Inserir um usuário de exemplo (substitua pelo UUID real)
/*
INSERT INTO public.user_profiles (
    user_id, full_name, cpf, email, email_verified
) VALUES (
    'seu-uuid-aqui'::UUID,
    'João Silva',
    '123.456.789-00',
    'joao@exemplo.com',
    false
);
*/

-- =====================================================
-- INSTRUÇÕES:
-- 1. Copie todo este script
-- 2. Cole no SQL Editor do Supabase
-- 3. Execute o script
-- 4. Verifique se as tabelas foram criadas com sucesso
-- =====================================================