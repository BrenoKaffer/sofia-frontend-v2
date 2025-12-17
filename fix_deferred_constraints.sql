-- =====================================================
-- SOLUÇÃO: CONSTRAINTS DEFERRED PARA RESOLVER TIMING DE TRIGGERS
-- =====================================================
-- Este script implementa constraints DEFERRED para resolver o problema
-- de timing entre triggers automáticos e criação de usuários
-- =====================================================

-- 1. VERIFICAR CONSTRAINTS EXISTENTES
-- Primeiro, vamos ver quais constraints de chave estrangeira existem
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.is_deferrable,
    tc.initially_deferred
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND (tc.table_name = 'user_profiles' OR tc.table_name = 'user_preferences')
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- 2. REMOVER CONSTRAINTS EXISTENTES E RECRIAR COMO DEFERRED
-- =====================================================

-- Para user_profiles (se a constraint existir)
DO $$
BEGIN
    -- Verificar se a constraint existe antes de tentar removê-la
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_user_id_fkey' 
        AND table_name = 'user_profiles'
        AND table_schema = 'public'
    ) THEN
        -- Remover constraint existente
        ALTER TABLE public.user_profiles 
        DROP CONSTRAINT user_profiles_user_id_fkey;
        
        RAISE NOTICE 'Constraint user_profiles_user_id_fkey removida com sucesso';
    ELSE
        RAISE NOTICE 'Constraint user_profiles_user_id_fkey não encontrada';
    END IF;
    
    -- Recriar como DEFERRED
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users (id) 
    ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED;
    
    RAISE NOTICE 'Constraint user_profiles_user_id_fkey recriada como DEFERRED';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao processar user_profiles: %', SQLERRM;
END $$;

-- Para user_preferences (se a constraint existir)
DO $$
BEGIN
    -- Verificar se a constraint existe antes de tentar removê-la
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_preferences_id_fkey' 
        AND table_name = 'user_preferences'
        AND table_schema = 'public'
    ) THEN
        -- Remover constraint existente
        ALTER TABLE public.user_preferences 
        DROP CONSTRAINT user_preferences_id_fkey;
        
        RAISE NOTICE 'Constraint user_preferences_id_fkey removida com sucesso';
    ELSE
        RAISE NOTICE 'Constraint user_preferences_id_fkey não encontrada';
    END IF;
    
    -- Recriar como DEFERRED
    ALTER TABLE public.user_preferences 
    ADD CONSTRAINT user_preferences_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users (id) 
    ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED;
    
    RAISE NOTICE 'Constraint user_preferences_id_fkey recriada como DEFERRED';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao processar user_preferences: %', SQLERRM;
END $$;

-- =====================================================
-- 3. VERIFICAR CONFIGURAÇÃO FINAL
-- =====================================================

-- Verificar se as constraints foram configuradas corretamente como DEFERRED
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN tc.is_deferrable = 'YES' THEN '✅ DEFERRABLE'
        ELSE '❌ NOT DEFERRABLE'
    END AS deferrable_status,
    CASE 
        WHEN tc.initially_deferred = 'YES' THEN '✅ INITIALLY DEFERRED'
        ELSE '❌ NOT INITIALLY DEFERRED'
    END AS deferred_status
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND (tc.table_name = 'user_profiles' OR tc.table_name = 'user_preferences')
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- 4. INSTRUÇÕES DE USO
-- =====================================================

/*
COMO USAR ESTE SCRIPT:

1. Copie todo o conteúdo deste arquivo
2. Abra o Supabase SQL Editor
3. Cole e execute o script
4. Verifique os resultados nas mensagens de NOTICE
5. Confirme que as constraints estão marcadas como DEFERRABLE e INITIALLY DEFERRED

COMO FUNCIONA:

- DEFERRABLE: Permite que a verificação da constraint seja adiada
- INITIALLY DEFERRED: A verificação acontece no final da transação, não imediatamente
- Isso resolve o problema de timing dos triggers automáticos

BENEFÍCIOS:

✅ Mantém a integridade referencial
✅ Permite que triggers executem sem erro de timing
✅ Não requer desabilitar triggers
✅ Solução mais elegante e segura

TESTE APÓS APLICAR:

Execute novamente o teste de registro para verificar se o problema foi resolvido:
http://localhost:3000/api/test-registration

*/