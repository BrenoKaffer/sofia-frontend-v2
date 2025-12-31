-- Script para investigar e corrigir problemas na estrutura das tabelas
-- Execute este script no Supabase SQL Editor APÓS aplicar fix_deferred_constraints.sql

-- =====================================================
-- 1. INVESTIGAR ESTRUTURA REAL DAS TABELAS
-- =====================================================

-- Verificar se a tabela user_preferences existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name IN ('user_preferences', 'user_profiles')
AND table_schema = 'public';

-- Verificar estrutura completa da tabela user_preferences (se existir)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estrutura completa da tabela user_profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 2. VERIFICAR FUNÇÃO insert_user_profile_on_registration
-- =====================================================

-- Verificar se a função existe e seu conteúdo
SELECT 
    routine_name, 
    routine_type,
    routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'insert_user_profile_on_registration'
AND routine_schema = 'public';

-- =====================================================
-- 3. VERIFICAR TRIGGERS EXISTENTES
-- =====================================================

-- Verificar triggers na tabela auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND event_object_schema = 'auth';

-- =====================================================
-- 4. CRIAR TABELA user_preferences SE NÃO EXISTIR
-- =====================================================

-- Criar tabela user_preferences com estrutura correta se não existir
DO $$
BEGIN
    -- Verificar se a tabela user_preferences existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_preferences' 
        AND table_schema = 'public'
    ) THEN
        -- Criar tabela user_preferences
        CREATE TABLE public.user_preferences (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL,
            preferences jsonb DEFAULT '{}'::jsonb,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        );
        
        -- Adicionar constraint de chave estrangeira (será convertida para DEFERRED depois)
        ALTER TABLE public.user_preferences 
        ADD CONSTRAINT user_preferences_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users (id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Tabela user_preferences criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela user_preferences já existe';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao criar tabela user_preferences: %', SQLERRM;
END $$;

-- =====================================================
-- 5. VERIFICAR/CORRIGIR ESTRUTURA DA TABELA user_profiles
-- =====================================================

-- Adicionar colunas que podem estar faltando na tabela user_profiles
DO $$
BEGIN
    -- Verificar se a coluna full_name existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'full_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN full_name text;
        RAISE NOTICE 'Coluna full_name adicionada à tabela user_profiles';
    END IF;
    
    -- Verificar se a coluna created_at existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN created_at timestamp with time zone DEFAULT now();
        RAISE NOTICE 'Coluna created_at adicionada à tabela user_profiles';
    END IF;
    
    -- Verificar se a coluna updated_at existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN updated_at timestamp with time zone DEFAULT now();
        RAISE NOTICE 'Coluna updated_at adicionada à tabela user_profiles';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao verificar/adicionar colunas em user_profiles: %', SQLERRM;
END $$;

-- =====================================================
-- 6. RECRIAR FUNÇÃO insert_user_profile_on_registration
-- =====================================================

-- Remover função existente se houver problemas
DROP FUNCTION IF EXISTS public.insert_user_profile_on_registration();

-- Criar função corrigida
CREATE OR REPLACE FUNCTION public.insert_user_profile_on_registration()
RETURNS trigger AS $$
BEGIN
    -- Inserir perfil do usuário
    INSERT INTO public.user_profiles (user_id, full_name, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NOW(),
        NOW()
    );
    
    -- Inserir preferências do usuário
    INSERT INTO public.user_preferences (user_id, preferences, created_at, updated_at)
    VALUES (
        NEW.id,
        '{}'::jsonb,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro mas não falha a transação principal
        RAISE WARNING 'Erro ao inserir perfil/preferências do usuário %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. VERIFICAR ESTRUTURA FINAL
-- =====================================================

-- Verificar estrutura final das tabelas
SELECT 'user_profiles' as tabela, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND table_schema = 'public'
UNION ALL
SELECT 'user_preferences' as tabela, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_preferences' AND table_schema = 'public'
ORDER BY tabela, column_name;

-- Verificar constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.is_deferrable,
    tc.initially_deferred
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('user_profiles', 'user_preferences')
AND tc.table_schema = 'public';

-- =====================================================
-- 8. TESTE DE INSERÇÃO (OPCIONAL)
-- =====================================================

/*
-- Descomente para testar inserção manual
DO $$
DECLARE
    test_user_id uuid := gen_random_uuid();
BEGIN
    -- Simular inserção de usuário (apenas para teste)
    INSERT INTO public.user_profiles (user_id, full_name, created_at, updated_at)
    VALUES (test_user_id, 'Teste Usuario', NOW(), NOW());
    
    INSERT INTO public.user_preferences (user_id, preferences, created_at, updated_at)
    VALUES (test_user_id, '{"theme": "dark", "language": "pt-BR"}'::jsonb, NOW(), NOW());
    
    RAISE NOTICE 'Teste de inserção bem-sucedido para user_id: %', test_user_id;
    
    -- Limpar teste
    DELETE FROM public.user_preferences WHERE user_id = test_user_id;
    DELETE FROM public.user_profiles WHERE user_id = test_user_id;
    
    RAISE NOTICE 'Dados de teste removidos com sucesso';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro no teste de inserção: %', SQLERRM;
END $$;
*/