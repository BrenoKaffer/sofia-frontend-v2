-- =====================================================
-- SCRIPT DE TESTE PARA POLÍTICAS RLS
-- =====================================================

-- Este script testa se as políticas RLS estão funcionando corretamente
-- Execute este script após aplicar as políticas RLS

-- =====================================================
-- 1. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
-- =====================================================

-- Listar todas as políticas RLS criadas
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
ORDER BY tablename, policyname;

-- =====================================================
-- 2. VERIFICAR SE RLS ESTÁ HABILITADO
-- =====================================================

-- Verificar quais tabelas têm RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- =====================================================
-- 3. TESTAR FUNÇÕES AUXILIARES
-- =====================================================

-- Testar função get_current_user_id (deve retornar null se não configurado)
SELECT public.get_current_user_id() as current_user_id;

-- Testar função get_current_user_status (deve retornar null se não configurado)
SELECT public.get_current_user_status() as current_user_status;

-- Testar função current_user_is_admin
SELECT public.current_user_is_admin() as is_admin;

-- Testar função current_user_is_superadmin
SELECT public.current_user_is_superadmin() as is_superadmin;

-- =====================================================
-- 4. CRIAR USUÁRIOS DE TESTE (SE NECESSÁRIO)
-- =====================================================

-- Inserir usuários de teste para validar as políticas
-- Substitua pelos UUIDs reais ou use gen_random_uuid()

/*
-- Usuário comum
INSERT INTO public.user_profiles (user_id, account_status, full_name, email)
VALUES (
    gen_random_uuid(),
    'user',
    'Usuário Teste',
    'usuario@teste.com'
) ON CONFLICT (user_id) DO NOTHING;

-- Usuário premium
INSERT INTO public.user_profiles (user_id, account_status, full_name, email)
VALUES (
    gen_random_uuid(),
    'premium',
    'Premium Teste',
    'premium@teste.com'
) ON CONFLICT (user_id) DO NOTHING;

-- Usuário admin
INSERT INTO public.user_profiles (user_id, account_status, full_name, email)
VALUES (
    gen_random_uuid(),
    'admin',
    'Admin Teste',
    'admin@teste.com'
) ON CONFLICT (user_id) DO NOTHING;

-- Usuário superadmin
INSERT INTO public.user_profiles (user_id, account_status, full_name, email)
VALUES (
    gen_random_uuid(),
    'superadmin',
    'SuperAdmin Teste',
    'superadmin@teste.com'
) ON CONFLICT (user_id) DO NOTHING;
*/

-- =====================================================
-- 5. TESTES DE ACESSO COMO USUÁRIO COMUM
-- =====================================================

-- Simular login como usuário comum
-- Substitua pelo UUID real de um usuário comum
/*
SELECT set_config('app.current_user_id', 'UUID_USUARIO_COMUM', true);

-- Teste: Usuário deve ver apenas seu próprio perfil
SELECT COUNT(*) as profiles_visible FROM public.user_profiles;

-- Teste: Usuário não deve conseguir ver mudanças de status de outros
SELECT COUNT(*) as status_changes_visible FROM public.user_status_changes;

-- Limpar configuração
SELECT set_config('app.current_user_id', '', true);
*/

-- =====================================================
-- 6. TESTES DE ACESSO COMO ADMIN
-- =====================================================

-- Simular login como admin
-- Substitua pelo UUID real de um usuário admin
/*
SELECT set_config('app.current_user_id', 'UUID_USUARIO_ADMIN', true);

-- Teste: Admin deve ver todos os perfis
SELECT COUNT(*) as profiles_visible FROM public.user_profiles;

-- Teste: Admin deve ver todas as mudanças de status
SELECT COUNT(*) as status_changes_visible FROM public.user_status_changes;

-- Limpar configuração
SELECT set_config('app.current_user_id', '', true);
*/

-- =====================================================
-- 7. TESTES DE ACESSO COMO SUPERADMIN
-- =====================================================

-- Simular login como superadmin
-- Substitua pelo UUID real de um usuário superadmin
/*
SELECT set_config('app.current_user_id', 'UUID_USUARIO_SUPERADMIN', true);

-- Teste: Superadmin deve ver todos os perfis
SELECT COUNT(*) as profiles_visible FROM public.user_profiles;

-- Teste: Superadmin deve ver todas as mudanças de status
SELECT COUNT(*) as status_changes_visible FROM public.user_status_changes;

-- Limpar configuração
SELECT set_config('app.current_user_id', '', true);
*/

-- =====================================================
-- 8. TESTES DE INSERÇÃO E ATUALIZAÇÃO
-- =====================================================

-- Teste de inserção como usuário comum
/*
SELECT set_config('app.current_user_id', 'UUID_USUARIO_COMUM', true);

-- Deve funcionar: usuário inserindo seu próprio perfil
INSERT INTO public.user_profiles (user_id, account_status, full_name, email)
VALUES (
    'UUID_USUARIO_COMUM'::uuid,
    'user',
    'Novo Usuário',
    'novo@teste.com'
) ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Deve falhar: usuário tentando inserir perfil de outro
-- Esta operação deve ser bloqueada pela política RLS
BEGIN;
INSERT INTO public.user_profiles (user_id, account_status, full_name, email)
VALUES (
    gen_random_uuid(),
    'user',
    'Outro Usuário',
    'outro@teste.com'
);
ROLLBACK; -- Desfazer a tentativa

SELECT set_config('app.current_user_id', '', true);
*/

-- =====================================================
-- 9. VERIFICAR ERROS E PROBLEMAS
-- =====================================================

-- Verificar se existem políticas conflitantes
SELECT 
    tablename,
    policyname,
    cmd,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename, policyname, cmd
HAVING COUNT(*) > 1;

-- Verificar se todas as funções auxiliares existem
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_current_user_id',
    'get_current_user_status',
    'current_user_is_admin',
    'current_user_is_superadmin',
    'user_is_admin',
    'user_is_superadmin',
    'user_is_premium'
);

-- =====================================================
-- 10. RELATÓRIO DE STATUS
-- =====================================================

-- Gerar relatório completo do status das políticas RLS
SELECT 
    'RLS Status Report' as report_section,
    COUNT(DISTINCT tablename) as tables_with_rls,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public';

-- Mostrar resumo por tabela
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(DISTINCT cmd, ', ') as operations_covered
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;