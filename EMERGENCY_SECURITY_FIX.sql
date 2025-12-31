-- =====================================================
-- 🚨 SCRIPT DE EMERGÊNCIA - CORREÇÃO FORÇADA DE SEGURANÇA
-- ⚠️  EXECUTE ESTE SCRIPT IMEDIATAMENTE NO SUPABASE SQL EDITOR
-- =====================================================

-- VERIFICAÇÃO INICIAL DETALHADA
SELECT 'INICIANDO CORREÇÃO DE EMERGÊNCIA - ANÁLISE COMPLETA' as status;

-- Listar TODAS as funções problemáticas antes da correção
SELECT 
    'ANTES DA CORREÇÃO' as momento,
    p.proname as function_name,
    p.oid as function_oid,
    pg_get_function_arguments(p.oid) as arguments,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path = ''''%' THEN 'SEGURO ✅'
        ELSE 'MUTÁVEL ❌'
    END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('insert_user_profile_on_registration', 'format_phone_number', 'update_updated_at_column')
ORDER BY p.proname, p.oid;

-- =====================================================
-- FASE 1: REMOÇÃO FORÇADA DE TODAS AS VERSÕES
-- =====================================================

-- Desabilitar triggers temporariamente para evitar conflitos
SET session_replication_role = replica;

-- Remover TODAS as versões de format_phone_number (forçado)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT p.oid, p.proname, pg_get_function_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'format_phone_number'
    LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
                          func_record.proname, func_record.args);
            RAISE NOTICE 'Removida função: % com argumentos: %', func_record.proname, func_record.args;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao remover %: %', func_record.proname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Remover TODAS as versões de insert_user_profile_on_registration (forçado)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT p.oid, p.proname, pg_get_function_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'insert_user_profile_on_registration'
    LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
                          func_record.proname, func_record.args);
            RAISE NOTICE 'Removida função: % com argumentos: %', func_record.proname, func_record.args;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao remover %: %', func_record.proname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Remover TODAS as versões de update_updated_at_column (forçado)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT p.oid, p.proname, pg_get_function_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname IN ('update_updated_at_column', 'handle_updated_at')
    LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
                          func_record.proname, func_record.args);
            RAISE NOTICE 'Removida função: % com argumentos: %', func_record.proname, func_record.args;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao remover %: %', func_record.proname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Verificar se todas foram removidas
SELECT 
    'APÓS REMOÇÃO' as momento,
    COUNT(*) as total_functions_remaining
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('insert_user_profile_on_registration', 'format_phone_number', 'update_updated_at_column');

-- =====================================================
-- FASE 2: CRIAÇÃO FORÇADA DAS FUNÇÕES SEGURAS
-- =====================================================

-- 1. FUNÇÃO format_phone_number SEGURA
CREATE OR REPLACE FUNCTION public.format_phone_number(phone_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
IMMUTABLE
AS $$
DECLARE
    cleaned_phone text;
    formatted_phone text;
BEGIN
    -- Validação de entrada
    IF phone_input IS NULL OR trim(phone_input) = '' THEN
        RETURN phone_input;
    END IF;
    
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

-- 2. FUNÇÃO update_updated_at_column SEGURA
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro mas não falhar
        RAISE WARNING 'Erro em update_updated_at_column: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- 3. GARANTIR QUE user_preferences EXISTE
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

-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 4. FUNÇÃO insert_user_profile_on_registration SEGURA
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
    -- Validação de entrada
    IF NEW.id IS NULL THEN
        RAISE EXCEPTION 'User ID cannot be null';
    END IF;
    
    -- Obter dados do usuário recém-criado
    user_email := COALESCE(NEW.email, '');
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(user_email, '@', 1),
        'Usuário'
    );
    
    -- Formatar telefone se fornecido
    IF NEW.raw_user_meta_data->>'phone' IS NOT NULL THEN
        SELECT public.format_phone_number(NEW.raw_user_meta_data->>'phone') INTO formatted_phone;
    END IF;
    
    -- Inserir na tabela user_profiles (com tratamento de erro)
    BEGIN
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
    EXCEPTION
        WHEN unique_violation THEN
            RAISE WARNING 'User profile already exists for user_id: %', NEW.id;
        WHEN OTHERS THEN
            RAISE WARNING 'Erro ao inserir user_profile: %', SQLERRM;
    END;
    
    -- Inserir na tabela user_preferences (com tratamento de erro)
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
        WHEN unique_violation THEN
            RAISE WARNING 'User preferences already exist for user_id: %', NEW.id;
        WHEN OTHERS THEN
            RAISE WARNING 'Erro ao inserir user_preferences: %', SQLERRM;
    END;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Erro geral na função insert_user_profile_on_registration: %', SQLERRM;
        RETURN NEW; -- Não falhar a criação do usuário
END;
$$;

-- Reabilitar triggers
SET session_replication_role = DEFAULT;

-- =====================================================
-- FASE 3: RECRIAR TRIGGERS COM SEGURANÇA
-- =====================================================

-- Remover triggers existentes
DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON public.user_preferences;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recriar triggers
CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.insert_user_profile_on_registration();

-- =====================================================
-- FASE 4: VERIFICAÇÃO FINAL RIGOROSA
-- =====================================================

-- Verificar TODAS as funções após correção
SELECT 
    'APÓS CORREÇÃO COMPLETA' as momento,
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

-- Verificação individual detalhada
SELECT 
    'VERIFICAÇÃO INDIVIDUAL FINAL' as tipo,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path = ''''%' THEN 'SEGURO ✅'
        ELSE 'MUTÁVEL (CRÍTICO) ❌'
    END as security_status,
    'search_path=""' as expected_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('insert_user_profile_on_registration', 'format_phone_number', 'update_updated_at_column')
ORDER BY p.proname, p.oid;

-- Contagem final absoluta
SELECT 
    'RESULTADO FINAL' as status,
    COUNT(*) as total_functions,
    COUNT(CASE WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path = ''''%' THEN 1 END) as secure_functions,
    COUNT(CASE WHEN pg_get_functiondef(p.oid) NOT LIKE '%SET search_path = ''''%' THEN 1 END) as mutable_functions,
    CASE 
        WHEN COUNT(CASE WHEN pg_get_functiondef(p.oid) NOT LIKE '%SET search_path = ''''%' THEN 1 END) = 0 
        THEN '🎉 SISTEMA 100% SEGURO'
        ELSE '🚨 AINDA HÁ PROBLEMAS DE SEGURANÇA'
    END as final_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('insert_user_profile_on_registration', 'format_phone_number', 'update_updated_at_column');

SELECT '🚨 CORREÇÃO DE EMERGÊNCIA CONCLUÍDA - VERIFIQUE OS RESULTADOS ACIMA' as status;

-- =====================================================
-- INSTRUÇÕES FINAIS
-- =====================================================

/*
🎯 APÓS EXECUTAR ESTE SCRIPT:

1. ✅ Verifique se o resultado final mostra "SISTEMA 100% SEGURO"
2. ✅ Confirme que todas as funções mostram "SEGURO ✅"
3. ✅ Execute novamente o script de verificação original
4. ✅ Teste o registro de novos usuários

Se ainda houver problemas, há um problema estrutural no banco que requer investigação mais profunda.
*/