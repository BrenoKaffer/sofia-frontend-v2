-- =====================================================
-- SCRIPT DE VERIFICAÇÃO DAS POLÍTICAS RLS
-- =====================================================

-- Este script verifica se todas as políticas RLS foram criadas corretamente
-- e se o RLS está habilitado nas tabelas

-- =====================================================
-- 1. VERIFICAR TABELAS COM RLS HABILITADO
-- =====================================================

SELECT 
    'TABELAS COM RLS HABILITADO:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_status_changes')
ORDER BY tablename;

-- =====================================================
-- 2. VERIFICAR POLÍTICAS CRIADAS
-- =====================================================

SELECT 
    'POLÍTICAS RLS CRIADAS:' as info,
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    permissive,
    roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_status_changes')
ORDER BY tablename, policyname;

-- =====================================================
-- 3. VERIFICAR FUNÇÕES AUXILIARES
-- =====================================================

SELECT 
    'FUNÇÕES AUXILIARES:' as info,
    proname as function_name,
    pg_get_function_result(oid) as return_type,
    prosecdef as security_definer
FROM pg_proc 
WHERE proname IN (
    'get_current_user_id',
    'get_current_user_status', 
    'current_user_is_admin',
    'current_user_is_superadmin',
    'test_rls_policies'
)
ORDER BY proname;

-- =====================================================
-- 4. VERIFICAR PERMISSÕES NAS TABELAS
-- =====================================================

SELECT 
    'PERMISSÕES NAS TABELAS:' as info,
    table_schema as schemaname,
    table_name as tablename,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'user_status_changes')
ORDER BY table_name, grantee, privilege_type;

-- =====================================================
-- 5. CONTAGEM DE POLÍTICAS POR TABELA
-- =====================================================

SELECT 
    'CONTAGEM DE POLÍTICAS:' as info,
    tablename,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_status_changes')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- 6. VERIFICAR SE TODAS AS POLÍTICAS ESPERADAS EXISTEM
-- =====================================================

WITH expected_policies AS (
    SELECT 'user_profiles' as table_name, 'user_profiles_select_policy' as policy_name
    UNION ALL SELECT 'user_profiles', 'user_profiles_insert_policy'
    UNION ALL SELECT 'user_profiles', 'user_profiles_update_policy'
    UNION ALL SELECT 'user_profiles', 'user_profiles_delete_policy'
    UNION ALL SELECT 'user_profiles', 'superadmin_bypass_user_profiles'
    UNION ALL SELECT 'user_status_changes', 'user_status_changes_select_policy'
    UNION ALL SELECT 'user_status_changes', 'user_status_changes_insert_policy'
    UNION ALL SELECT 'user_status_changes', 'user_status_changes_update_policy'
    UNION ALL SELECT 'user_status_changes', 'user_status_changes_delete_policy'
    UNION ALL SELECT 'user_status_changes', 'superadmin_bypass_user_status_changes'
)
SELECT 
    'STATUS DAS POLÍTICAS ESPERADAS:' as info,
    ep.table_name,
    ep.policy_name,
    CASE 
        WHEN pp.policyname IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ FALTANDO'
    END as status
FROM expected_policies ep
LEFT JOIN pg_policies pp ON (
    pp.schemaname = 'public' 
    AND pp.tablename = ep.table_name 
    AND pp.policyname = ep.policy_name
)
ORDER BY ep.table_name, ep.policy_name;

-- =====================================================
-- 7. RESUMO FINAL
-- =====================================================

SELECT 
    'RESUMO FINAL:' as info,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles') as user_profiles_policies,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_status_changes') as user_status_changes_policies,
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user_profiles', 'user_status_changes') AND rowsecurity = true) as tables_with_rls,
    (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('get_current_user_id', 'get_current_user_status', 'current_user_is_admin', 'current_user_is_superadmin')) as helper_functions;

-- =====================================================
-- 8. TESTE BÁSICO DE FUNCIONAMENTO
-- =====================================================

-- Verificar se as funções auxiliares funcionam (sem definir usuário)
SELECT 
    'TESTE DAS FUNÇÕES:' as info,
    'get_current_user_id()' as function_name,
    CASE 
        WHEN public.get_current_user_id() IS NULL THEN '✅ OK (retorna NULL sem usuário)'
        ELSE '⚠️ Retornou: ' || public.get_current_user_id()::text
    END as result
UNION ALL
SELECT 
    'TESTE DAS FUNÇÕES:' as info,
    'get_current_user_status()' as function_name,
    CASE 
        WHEN public.get_current_user_status() IS NULL THEN '✅ OK (retorna NULL sem usuário)'
        ELSE '⚠️ Retornou: ' || public.get_current_user_status()::text
    END as result;

-- =====================================================
-- 9. INSTRUÇÕES DE USO
-- =====================================================

SELECT 
    'INSTRUÇÕES:' as info,
    'Para testar as políticas RLS:' as step_1,
    '1. Execute: SELECT set_config(''app.current_user_id'', ''seu-uuid-aqui'', true);' as step_2,
    '2. Execute consultas nas tabelas para testar as políticas' as step_3,
    '3. Use a função test_rls_policies(uuid) para testes automatizados' as step_4;