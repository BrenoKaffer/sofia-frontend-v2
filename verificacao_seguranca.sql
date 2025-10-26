-- =====================================================
-- 🔍 SCRIPT DE VERIFICAÇÃO DE SEGURANÇA DAS FUNÇÕES
-- Execute este script no SQL Editor do Supabase
-- =====================================================

SELECT '🔍 INICIANDO VERIFICAÇÃO DE SEGURANÇA' as status;

-- =====================================================
-- 1. VERIFICAÇÃO DETALHADA POR FUNÇÃO
-- =====================================================

SELECT 
    'VERIFICAÇÃO INDIVIDUAL' as tipo,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path = ''''%' THEN 'SEGURO ✅'
        ELSE 'MUTÁVEL ❌'
    END as security_status,
    'search_path=""' as expected_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('insert_user_profile_on_registration', 'format_phone_number', 'update_updated_at_column')
ORDER BY p.proname, p.oid;

-- =====================================================
-- 2. RESUMO POR FUNÇÃO
-- =====================================================

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
-- 3. RESULTADO FINAL CONSOLIDADO
-- =====================================================

SELECT 
    'RESULTADO FINAL' as status,
    COUNT(*) as total_functions,
    COUNT(CASE WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path = ''''%' THEN 1 END) as secure_functions,
    COUNT(CASE WHEN pg_get_functiondef(p.oid) NOT LIKE '%SET search_path = ''''%' THEN 1 END) as mutable_functions,
    ROUND(
        (COUNT(CASE WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path = ''''%' THEN 1 END) * 100.0) / COUNT(*), 
        2
    ) as security_percentage,
    CASE 
        WHEN COUNT(CASE WHEN pg_get_functiondef(p.oid) NOT LIKE '%SET search_path = ''''%' THEN 1 END) = 0 
        THEN '🎉 SISTEMA 100% SEGURO'
        ELSE '🚨 AINDA HÁ PROBLEMAS DE SEGURANÇA'
    END as final_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('insert_user_profile_on_registration', 'format_phone_number', 'update_updated_at_column');

-- =====================================================
-- 4. VERIFICAÇÃO DA TABELA user_preferences
-- =====================================================

SELECT 
    'VERIFICAÇÃO DA TABELA user_preferences' as tipo,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences' AND table_schema = 'public')
        THEN 'EXISTE ✅'
        ELSE 'NÃO EXISTE ❌'
    END as table_status;

-- =====================================================
-- 5. VERIFICAÇÃO DOS TRIGGERS
-- =====================================================

SELECT 
    'VERIFICAÇÃO DOS TRIGGERS' as tipo,
    t.trigger_name,
    t.event_manipulation as trigger_event,
    t.event_object_table as table_name,
    CASE 
        WHEN t.trigger_name IS NOT NULL THEN 'ATIVO ✅'
        ELSE 'INATIVO ❌'
    END as trigger_status
FROM information_schema.triggers t
WHERE t.trigger_schema = 'public'
AND t.event_object_table IN ('user_profiles', 'user_preferences')
AND t.trigger_name LIKE '%updated_at%'
ORDER BY t.event_object_table, t.trigger_name;

SELECT '🔍 VERIFICAÇÃO DE SEGURANÇA CONCLUÍDA' as status;

-- =====================================================
-- INTERPRETAÇÃO DOS RESULTADOS:
-- =====================================================
/*
✅ SEGURO: Função tem "SET search_path = ''" 
❌ MUTÁVEL: Função NÃO tem "SET search_path = ''"

🎯 OBJETIVO: Todas as funções devem mostrar "SEGURO ✅"
🚨 PROBLEMA: Se alguma função mostrar "MUTÁVEL ❌"

📊 RESULTADO ESPERADO:
- security_percentage: 100.00%
- final_status: "🎉 SISTEMA 100% SEGURO"
- mutable_functions: 0
*/