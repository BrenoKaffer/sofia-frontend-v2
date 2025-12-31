-- =====================================================
-- SCRIPT PARA DESABILITAR TRIGGERS AUTOMÁTICOS
-- =====================================================
-- Este script identifica e desabilita triggers que podem estar
-- causando o erro "Database error creating new user"

-- 1. Verificar triggers existentes na tabela auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users';

-- 2. Verificar se existe trigger específico para inserção de usuários
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users'
AND event_manipulation = 'INSERT';

-- 3. Desabilitar trigger comum que pode estar causando o problema
-- (Substitua 'nome_do_trigger' pelo nome real encontrado acima)

-- Exemplo de triggers comuns que podem existir:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
-- DROP TRIGGER IF EXISTS auto_create_profile ON auth.users;

-- 4. Verificar se existe função handle_new_user
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%handle%user%';

-- 5. Verificar se existe função que é executada automaticamente
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (
    routine_name LIKE '%insert_user%' OR
    routine_name LIKE '%handle%user%' OR
    routine_name LIKE '%create%profile%'
);

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================
/*
1. Execute este SQL no Supabase SQL Editor
2. Identifique os triggers que aparecem nos resultados
3. Descomente e execute os comandos DROP TRIGGER apropriados
4. Teste o registro novamente na aplicação
5. Se funcionar, implemente inserção manual de dados do perfil

IMPORTANTE: 
- Anote os nomes dos triggers antes de removê-los
- Você pode recriar os triggers depois se necessário
- Este é um fix temporário para identificar a causa
*/