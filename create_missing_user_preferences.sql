-- =====================================================
-- SCRIPT PARA CRIAR TABELA user_preferences FALTANTE
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. VERIFICAR SE A TABELA user_preferences EXISTE
-- =====================================================

SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_preferences';

-- =====================================================
-- 2. CRIAR TABELA user_preferences SE NÃO EXISTIR
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

-- =====================================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_preferences_id ON public.user_preferences(id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_theme ON public.user_preferences(theme);
CREATE INDEX IF NOT EXISTS idx_user_preferences_language ON public.user_preferences(language);

-- =====================================================
-- 4. HABILITAR RLS (ROW LEVEL SECURITY)
-- =====================================================

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CRIAR POLÍTICAS DE SEGURANÇA
-- =====================================================

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;

-- Políticas para user_preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own preferences" ON public.user_preferences
    FOR DELETE USING (auth.uid() = id);

-- =====================================================
-- 6. CRIAR TRIGGER PARA ATUALIZAR updated_at
-- =====================================================

-- Criar função se não existir
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON public.user_preferences;

-- Criar trigger
CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 7. INSERIR DADOS PADRÃO PARA USUÁRIOS EXISTENTES
-- =====================================================

-- Inserir preferências padrão para usuários que não têm
INSERT INTO public.user_preferences (id, created_at, updated_at)
SELECT 
    au.id,
    NOW(),
    NOW()
FROM auth.users au
LEFT JOIN public.user_preferences up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 8. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se a tabela foi criada
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_preferences';

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_preferences';

-- Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_preferences'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_preferences';

-- Contar registros
SELECT COUNT(*) as total_preferences FROM public.user_preferences;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
/*
✅ Tabela user_preferences criada com sucesso
✅ RLS habilitado
✅ Políticas de segurança configuradas
✅ Trigger para updated_at configurado
✅ Dados padrão inseridos para usuários existentes
✅ Função de verificação não deve mais reportar erro de tabela faltante
*/