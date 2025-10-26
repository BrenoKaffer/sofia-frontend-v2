-- =====================================================
-- CORREÇÃO MANUAL DO SEARCH_PATH PARA FUNÇÕES CRÍTICAS
-- =====================================================
-- Execute este script no Supabase SQL Editor para corrigir
-- os problemas de "Function Search Path Mutable" identificados
-- no relatório de erro.

-- =====================================================
-- 1. FUNÇÃO insert_user_profile_on_registration
-- =====================================================

CREATE OR REPLACE FUNCTION insert_user_profile_on_registration(
    p_user_id uuid,
    p_full_name text,
    p_cpf text,
    p_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    result json;
BEGIN
    -- Log da execução da função
    RAISE NOTICE 'Executando insert_user_profile_on_registration para user_id: %', p_user_id;
    
    -- Insere nas preferências do usuário (estrutura correta)
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

    RAISE NOTICE 'Dados inseridos em user_preferences para user_id: %', p_user_id;

    -- Insere no perfil do usuário (estrutura correta)
    INSERT INTO public.user_profiles (
        user_id,
        full_name,
        cpf,
        email,
        email_verified,
        preferences,
        notes,
        account_status,
        permissions,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_full_name,
        p_cpf,
        p_email,
        false,
        jsonb_build_object(
            'registration_source', 'web_form',
            'profile_completed', true,
            'onboarding_completed', false,
            'terms_accepted', true,
            'registration_date', NOW()::text
        ),
        '[]'::jsonb,
        'free',
        '["basic_user"]'::jsonb,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        cpf = EXCLUDED.cpf,
        email = EXCLUDED.email,
        updated_at = NOW();

    RAISE NOTICE 'Dados inseridos em user_profiles para user_id: %', p_user_id;

    -- Retorna sucesso
    result := json_build_object(
        'success', true,
        'message', 'Perfil do usuário criado com sucesso',
        'user_id', p_user_id,
        'timestamp', NOW()
    );
    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, log detalhado e retorna informações do erro
        RAISE NOTICE 'ERRO na função insert_user_profile_on_registration: % - %', SQLSTATE, SQLERRM;
        
        result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'error_code', SQLSTATE,
            'user_id', p_user_id,
            'timestamp', NOW()
        );
        RETURN result;
END;
$$;

-- Concede permissões para usuários autenticados e anônimos
GRANT EXECUTE ON FUNCTION insert_user_profile_on_registration(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_user_profile_on_registration(uuid, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION insert_user_profile_on_registration(uuid, text, text, text) TO service_role;

-- =====================================================
-- 2. FUNÇÃO format_phone_number
-- =====================================================

CREATE OR REPLACE FUNCTION format_phone_number(
    country_code text DEFAULT '+55',
    area_code text DEFAULT '',
    phone_number text DEFAULT ''
)
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    -- Se algum parâmetro for nulo ou vazio, retorna string vazia
    IF country_code IS NULL OR area_code IS NULL OR phone_number IS NULL THEN
        RETURN '';
    END IF;
    
    -- Remove caracteres não numéricos
    country_code := regexp_replace(country_code, '[^0-9+]', '', 'g');
    area_code := regexp_replace(area_code, '[^0-9]', '', 'g');
    phone_number := regexp_replace(phone_number, '[^0-9]', '', 'g');
    
    -- Se algum campo ficar vazio após limpeza, retorna vazio
    IF length(area_code) = 0 OR length(phone_number) = 0 THEN
        RETURN '';
    END IF;
    
    -- Formatação específica para Brasil (+55)
    IF country_code = '+55' OR country_code = '55' THEN
        -- Celular (9 dígitos) ou fixo (8 dígitos)
        IF length(phone_number) = 9 THEN
            RETURN '+55 (' || area_code || ') ' || substring(phone_number, 1, 5) || '-' || substring(phone_number, 6, 4);
        ELSIF length(phone_number) = 8 THEN
            RETURN '+55 (' || area_code || ') ' || substring(phone_number, 1, 4) || '-' || substring(phone_number, 5, 4);
        END IF;
    END IF;
    
    -- Formatação genérica para outros países
    RETURN country_code || ' (' || area_code || ') ' || phone_number;
END;
$$;

-- Concede permissões para a função format_phone_number
GRANT EXECUTE ON FUNCTION format_phone_number(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION format_phone_number(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION format_phone_number(text, text, text) TO service_role;

-- =====================================================
-- 3. FUNÇÃO update_updated_at_column (TRIGGER COMUM)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- =====================================================
-- 4. VERIFICAÇÃO DAS CORREÇÕES
-- =====================================================

-- Verificar se as funções foram criadas com search_path seguro
SELECT 
    'VERIFICAÇÃO DE SEARCH_PATH' as status,
    p.proname as function_name,
    CASE 
        WHEN p.proconfig IS NULL THEN 'MUTÁVEL (PRECISA CORREÇÃO) ❌'
        WHEN array_to_string(p.proconfig, ', ') LIKE '%search_path%' THEN 'SEGURO ✅'
        ELSE 'MUTÁVEL (PRECISA CORREÇÃO) ❌'
    END as search_path_status,
    array_to_string(p.proconfig, ', ') as current_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'insert_user_profile_on_registration',
    'format_phone_number',
    'update_updated_at_column'
)
ORDER BY function_name;

-- =====================================================
-- INSTRUÇÕES DE EXECUÇÃO
-- =====================================================

/*
🎯 COMO EXECUTAR:

1. ✅ Copie todo este script
2. ✅ Abra o Supabase SQL Editor
3. ✅ Cole o script e execute
4. ✅ Verifique se a consulta de verificação mostra "SEGURO ✅" para todas as funções
5. ✅ Execute novamente o linter do Supabase para confirmar que os problemas foram resolvidos

🔒 SEGURANÇA IMPLEMENTADA:

- SET search_path = '' previne ataques de injeção via search_path
- Todas as referências a tabelas usam schema público explícito (public.tabela)
- Funções mantêm SECURITY DEFINER para contornar RLS quando necessário
- Permissões adequadas concedidas para authenticated, anon e service_role

🎉 APÓS A EXECUÇÃO:

- Problema "Function Search Path Mutable" será resolvido
- Sistema de registro funcionará corretamente
- Funções estarão seguras contra ataques de search_path
- Linter do Supabase não mostrará mais esses erros
*/