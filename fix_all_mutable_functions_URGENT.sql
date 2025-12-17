-- =====================================================
-- SCRIPT URGENTE PARA CORRIGIR TODAS AS FUNÇÕES MUTÁVEIS
-- ⚠️  EXECUTE ESTE SCRIPT IMEDIATAMENTE NO SQL EDITOR DO SUPABASE
-- =====================================================

-- VERIFICAÇÃO INICIAL
SELECT 'INICIANDO CORREÇÃO DE SEGURANÇA - TODAS AS FUNÇÕES MUTÁVEIS' as status;

-- =====================================================
-- 1. REMOVER TODAS AS VERSÕES MUTÁVEIS DAS FUNÇÕES
-- =====================================================

-- Remover todas as versões de format_phone_number
DROP FUNCTION IF EXISTS public.format_phone_number(text) CASCADE;
DROP FUNCTION IF EXISTS public.format_phone_number(varchar) CASCADE;
DROP FUNCTION IF EXISTS public.format_phone_number() CASCADE;

-- Remover todas as versões de insert_user_profile_on_registration
DROP FUNCTION IF EXISTS public.insert_user_profile_on_registration() CASCADE;
DROP FUNCTION IF EXISTS public.insert_user_profile_on_registration(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.insert_user_profile_on_registration(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.insert_user_profile_on_registration(uuid, text, text) CASCADE;

-- Remover todas as versões de update_updated_at_column
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

SELECT 'FUNÇÕES MUTÁVEIS REMOVIDAS' as status;

-- =====================================================
-- 2. CRIAR FUNÇÃO format_phone_number SEGURA
-- =====================================================

CREATE OR REPLACE FUNCTION public.format_phone_number(phone_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    cleaned_phone text;
    formatted_phone text;
BEGIN
    -- Remover todos os caracteres não numéricos
    cleaned_phone := regexp_replace(phone_input, '[^0-9]', '', 'g');
    
    -- Verificar se é um número válido
    IF cleaned_phone IS NULL OR length(cleaned_phone) < 10 THEN
        RETURN phone_input; -- Retorna o original se inválido
    END IF;
    
    -- Formatar baseado no tamanho
    CASE length(cleaned_phone)
        WHEN 10 THEN
            -- Formato: (XX) XXXX-XXXX
            formatted_phone := '(' || substring(cleaned_phone, 1, 2) || ') ' || 
                              substring(cleaned_phone, 3, 4) || '-' || 
                              substring(cleaned_phone, 7, 4);
        WHEN 11 THEN
            -- Formato: (XX) 9XXXX-XXXX
            formatted_phone := '(' || substring(cleaned_phone, 1, 2) || ') ' || 
                              substring(cleaned_phone, 3, 5) || '-' || 
                              substring(cleaned_phone, 8, 4);
        ELSE
            -- Retorna o número limpo se não se encaixa nos padrões
            formatted_phone := cleaned_phone;
    END CASE;
    
    RETURN formatted_phone;
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, retorna o input original
        RETURN phone_input;
END;
$$;

SELECT 'FUNÇÃO format_phone_number CRIADA COM SEGURANÇA' as status;

-- =====================================================
-- 3. CRIAR FUNÇÃO update_updated_at_column SEGURA
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

SELECT 'FUNÇÃO update_updated_at_column CRIADA COM SEGURANÇA' as status;

-- =====================================================
-- 4. CRIAR TABELA user_preferences SE NÃO EXISTIR
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

-- Habilitar RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;

CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = id);

SELECT 'TABELA user_preferences CRIADA/VERIFICADA' as status;

-- =====================================================
-- 5. CRIAR FUNÇÃO insert_user_profile_on_registration SEGURA
-- =====================================================

CREATE OR REPLACE FUNCTION public.insert_user_profile_on_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    user_email text;
    user_name text;
    formatted_phone text;
BEGIN
    -- Obter dados do usuário recém-criado
    user_email := NEW.email;
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(user_email, '@', 1)
    );
    
    -- Formatar telefone se fornecido
    IF NEW.raw_user_meta_data->>'phone' IS NOT NULL THEN
        SELECT public.format_phone_number(NEW.raw_user_meta_data->>'phone') INTO formatted_phone;
    END IF;
    
    -- Inserir na tabela user_profiles
    INSERT INTO public.user_profiles (
        user_id,
        full_name,
        cpf,
        email,
        phone,
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
        NEW.id,
        user_name,
        COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
        user_email,
        formatted_phone,
        COALESCE(NEW.raw_user_meta_data::jsonb, '{}'::jsonb),
        '[]'::jsonb,
        'free',
        '["basic_user"]'::jsonb,
        COALESCE((NEW.raw_user_meta_data->>'terms_accepted')::boolean, true),
        'web_form',
        true,
        false,
        NOW(),
        NOW()
    );
    
    -- Inserir na tabela user_preferences
    BEGIN
        INSERT INTO public.user_preferences (
            id,
            theme,
            notifications,
            language,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'theme', 'light'),
            COALESCE((NEW.raw_user_meta_data->>'notifications')::boolean, true),
            COALESCE(NEW.raw_user_meta_data->>'language', 'pt-BR'),
            NOW(),
            NOW()
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Log do erro mas não falhar a transação
            RAISE WARNING 'Erro ao inserir user_preferences: %', SQLERRM;
    END;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro na função insert_user_profile_on_registration: %', SQLERRM;
END;
$$;

SELECT 'FUNÇÃO insert_user_profile_on_registration CRIADA COM SEGURANÇA' as status;

-- =====================================================
-- 6. RECRIAR TRIGGERS NECESSÁRIOS
-- =====================================================

-- Trigger para user_profiles
DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para user_preferences
DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para registro automático
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.insert_user_profile_on_registration();

SELECT 'TRIGGERS RECRIADOS COM SEGURANÇA' as status;

-- =====================================================
-- 7. VERIFICAÇÃO FINAL DE SEGURANÇA
-- =====================================================

-- Verificar todas as funções críticas
SELECT 
    p.proname as function_name,
    COUNT(*) as total_versions,
    COUNT(CASE WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path = ''''%' THEN 1 END) as secure_versions,
    COUNT(CASE WHEN pg_get_functiondef(p.oid) NOT LIKE '%SET search_path = ''''%' THEN 1 END) as mutable_versions,
    CASE 
        WHEN COUNT(CASE WHEN pg_get_functiondef(p.oid) NOT LIKE '%SET search_path = ''''%' THEN 1 END) = 0 
        THEN 'TODAS SEGURAS ✅'
        ELSE 'AINDA HÁ VERSÕES MUTÁVEIS ❌'
    END as overall_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('insert_user_profile_on_registration', 'format_phone_number', 'update_updated_at_column')
GROUP BY p.proname
ORDER BY p.proname;

-- Verificar se todas as funções têm search_path seguro
SELECT 
    'VERIFICAÇÃO INDIVIDUAL' as tipo,
    p.proname as function_name,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path = ''''%' THEN 'SEGURO ✅'
        ELSE 'MUTÁVEL (PRECISA CORREÇÃO) ❌'
    END as security_status,
    'search_path=""' as expected_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('insert_user_profile_on_registration', 'format_phone_number', 'update_updated_at_column')
ORDER BY p.proname, p.oid;

-- Contagem final
SELECT 
    COUNT(*) as total_functions,
    COUNT(CASE WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path = ''''%' THEN 1 END) as secure_functions,
    COUNT(CASE WHEN pg_get_functiondef(p.oid) NOT LIKE '%SET search_path = ''''%' THEN 1 END) as mutable_functions,
    ROUND(
        (COUNT(CASE WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path = ''''%' THEN 1 END) * 100.0) / COUNT(*), 
        2
    ) as security_percentage
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('insert_user_profile_on_registration', 'format_phone_number', 'update_updated_at_column');

SELECT 'CORREÇÃO DE SEGURANÇA CONCLUÍDA - VERIFIQUE OS RESULTADOS ACIMA' as status;

-- =====================================================
-- RESULTADO ESPERADO APÓS EXECUÇÃO
-- =====================================================
/*
✅ TODAS as funções mutáveis removidas
✅ TODAS as funções recriadas com SET search_path = ''
✅ Tabela user_preferences criada/verificada
✅ Triggers recriados com segurança
✅ 100% das funções seguras (3/3)
✅ 0% de funções mutáveis
✅ Sistema completamente seguro contra ataques de search_path
*/