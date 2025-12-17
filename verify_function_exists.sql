-- Script para verificar se a função insert_user_profile_on_registration existe no Supabase
-- Execute este script no SQL Editor do Supabase para diagnosticar o problema

-- 1. Verificar se a função existe
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'insert_user_profile_on_registration'
    AND routine_schema = 'public';

-- 2. Verificar se as tabelas existem
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('user_profiles', 'user_preferences')
ORDER BY table_name;

-- 3. Verificar estrutura da tabela user_preferences
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_preferences'
ORDER BY ordinal_position;

-- 4. Verificar estrutura da tabela user_profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 5. Teste da função (se existir) - DESCOMENTE APENAS SE A FUNÇÃO EXISTIR
/*
SELECT insert_user_profile_on_registration(
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Teste Usuario',
    '12345678901',
    'teste@exemplo.com'
);
*/

-- 6. Verificar permissões da função (se existir)
/*
SELECT 
    p.proname as function_name,
    r.rolname as role_name,
    p.proacl as permissions
FROM pg_proc p
JOIN pg_roles r ON r.oid = ANY(p.proacl::text::text[]::oid[])
WHERE p.proname = 'insert_user_profile_on_registration';
*/

-- INSTRUÇÕES:
-- 1. Execute as consultas 1-4 primeiro para verificar se tudo existe
-- 2. Se a função existir, descomente e execute a consulta 5 para testá-la
-- 3. Se a função não existir, execute o arquivo create_insert_user_profile_function.sql
-- 4. Após executar, rode este script novamente para confirmar