-- =====================================================
-- SCRIPT FINAL PARA LIMPAR FUNÇÃO MUTÁVEL RESTANTE
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. VERIFICAR TODAS AS VERSÕES DA FUNÇÃO
-- =====================================================

SELECT 
    p.proname as function_name,
    p.oid as function_oid,
    pg_get_functiondef(p.oid) as function_definition,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path = ''''%' THEN 'SEGURO ✅'
        ELSE 'MUTÁVEL (PRECISA CORREÇÃO) ❌'
    END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'insert_user_profile_on_registration'
ORDER BY p.oid;

-- =====================================================
-- 2. REMOVER TODAS AS VERSÕES DA FUNÇÃO
-- =====================================================

-- Remover todas as versões existentes da função
DROP FUNCTION IF EXISTS public.insert_user_profile_on_registration() CASCADE;
DROP FUNCTION IF EXISTS public.insert_user_profile_on_registration(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.insert_user_profile_on_registration(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.insert_user_profile_on_registration(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.insert_user_profile_on_registration(uuid, text, text, text) CASCADE;

-- Verificar se todas foram removidas
SELECT COUNT(*) as remaining_functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'insert_user_profile_on_registration';

-- =====================================================
-- 3. RECRIAR A FUNÇÃO COM SEGURANÇA MÁXIMA
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
    
    -- Inserir na tabela user_preferences (se existir)
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
        WHEN undefined_table THEN
            -- Tabela user_preferences não existe, continuar sem erro
            NULL;
        WHEN OTHERS THEN
            -- Log do erro mas não falhar a transação
            RAISE WARNING 'Erro ao inserir user_preferences: %', SQLERRM;
    END;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro e re-raise para falhar a transação se necessário
        RAISE EXCEPTION 'Erro na função insert_user_profile_on_registration: %', SQLERRM;
END;
$$;

-- =====================================================
-- 4. RECRIAR O TRIGGER SE NECESSÁRIO
-- =====================================================

-- Remover trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recriar trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.insert_user_profile_on_registration();

-- =====================================================
-- 5. VERIFICAÇÃO FINAL DE SEGURANÇA
-- =====================================================

-- Verificar se a função foi criada corretamente
SELECT 
    p.proname as function_name,
    p.oid as function_oid,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path = ''''%' THEN 'SEGURO ✅'
        ELSE 'MUTÁVEL (PRECISA CORREÇÃO) ❌'
    END as security_status,
    'search_path=""' as search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'insert_user_profile_on_registration';

-- Verificar se o trigger foi criado
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND event_object_schema = 'auth'
AND trigger_name = 'on_auth_user_created';

-- =====================================================
-- 6. TESTE DE VERIFICAÇÃO COMPLETA
-- =====================================================

-- Executar verificação completa de todas as funções críticas
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

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
/*
✅ Todas as versões mutáveis da função removidas
✅ Nova versão segura criada com SET search_path = ''
✅ Trigger recriado corretamente
✅ Função com tratamento de erro robusto
✅ Compatível com tabela user_preferences existente ou não
✅ Verificação de segurança 100% aprovada
*/