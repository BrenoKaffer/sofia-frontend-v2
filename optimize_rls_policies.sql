-- =====================================================
-- OTIMIZAÇÃO DE POLÍTICAS RLS
-- =====================================================
-- Este script otimiza as políticas RLS para evitar que funções auth()
-- sejam reavaliadas para cada linha, melhorando significativamente a performance

-- =====================================================
-- 1. OTIMIZAR POLÍTICAS DE USER_PROFILES
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow service_role full access to user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated access to user_profiles" ON public.user_profiles;

-- Criar políticas otimizadas com subqueries
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (
        user_id = (SELECT auth.uid())
    );

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (
        user_id = (SELECT auth.uid())
    );

CREATE POLICY "Allow service_role full access to user_profiles" ON public.user_profiles
    FOR ALL USING (
        (SELECT auth.role()) = 'service_role'
    );

CREATE POLICY "Allow authenticated access to user_profiles" ON public.user_profiles
    FOR ALL USING (
        (SELECT auth.role()) = 'authenticated'
    );

-- =====================================================
-- 2. OTIMIZAR POLÍTICAS DE USER_PREFERENCES
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;

-- Criar políticas otimizadas
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (
        id = (SELECT auth.uid())
    );

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (
        id = (SELECT auth.uid())
    );

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (
        id = (SELECT auth.uid())
    );

-- =====================================================
-- 3. OTIMIZAR POLÍTICAS DE AUDIT_LOGS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow authenticated read access to audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow service_role full access to audit_logs" ON public.audit_logs;

-- Criar políticas otimizadas
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT USING (
        (SELECT auth.role()) = 'authenticated' AND 
        (user_id IS NULL OR user_id = (SELECT auth.uid()))
    );

CREATE POLICY "Allow service_role full access to audit_logs" ON public.audit_logs
    FOR ALL USING (
        (SELECT auth.role()) = 'service_role'
    );

-- =====================================================
-- 4. OTIMIZAR POLÍTICAS DE GENERATED_SIGNALS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Allow authenticated read access to generated_signals" ON public.generated_signals;
DROP POLICY IF EXISTS "Allow service_role full access to generated_signals" ON public.generated_signals;

-- Criar políticas otimizadas
CREATE POLICY "Allow authenticated read access to generated_signals" ON public.generated_signals
    FOR SELECT USING (
        (SELECT auth.role()) = 'authenticated'
    );

CREATE POLICY "Allow service_role full access to generated_signals" ON public.generated_signals
    FOR ALL USING (
        (SELECT auth.role()) = 'service_role'
    );

-- =====================================================
-- 5. OTIMIZAR POLÍTICAS DE STRATEGY_SIGNALS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Allow authenticated read access to strategy_signals" ON public.strategy_signals;
DROP POLICY IF EXISTS "Allow service_role full access to strategy_signals" ON public.strategy_signals;

-- Criar políticas otimizadas
CREATE POLICY "Allow authenticated read access to strategy_signals" ON public.strategy_signals
    FOR SELECT USING (
        (SELECT auth.role()) = 'authenticated'
    );

CREATE POLICY "Allow service_role full access to strategy_signals" ON public.strategy_signals
    FOR ALL USING (
        (SELECT auth.role()) = 'service_role'
    );

-- =====================================================
-- 6. OTIMIZAR POLÍTICAS DE STRATEGY_ACTIVATIONS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Allow authenticated read access to strategy_activations" ON public.strategy_activations;
DROP POLICY IF EXISTS "Allow service_role full access to strategy_activations" ON public.strategy_activations;

-- Criar políticas otimizadas
CREATE POLICY "Allow authenticated read access to strategy_activations" ON public.strategy_activations
    FOR SELECT USING (
        (SELECT auth.role()) = 'authenticated'
    );

CREATE POLICY "Allow service_role full access to strategy_activations" ON public.strategy_activations
    FOR ALL USING (
        (SELECT auth.role()) = 'service_role'
    );

-- =====================================================
-- 7. OTIMIZAR POLÍTICAS DE ROULETTE_SPINS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Allow authenticated read access to roulette_spins" ON public.roulette_spins;

-- Criar políticas otimizadas
CREATE POLICY "Allow authenticated read access to roulette_spins" ON public.roulette_spins
    FOR SELECT USING (
        (SELECT auth.role()) = 'authenticated'
    );

-- =====================================================
-- 8. CRIAR FUNÇÃO AUXILIAR PARA CACHE DE AUTH
-- =====================================================

-- Função para cachear o resultado de auth.uid() durante a transação
CREATE OR REPLACE FUNCTION public.cached_auth_uid()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    cached_uid uuid;
BEGIN
    -- Tentar obter do cache da transação
    BEGIN
        cached_uid := current_setting('app.cached_auth_uid', true)::uuid;
        IF cached_uid IS NOT NULL THEN
            RETURN cached_uid;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- Ignorar erro se não estiver definido
            NULL;
    END;
    
    -- Obter e cachear o auth.uid()
    cached_uid := auth.uid();
    PERFORM set_config('app.cached_auth_uid', cached_uid::text, true);
    
    RETURN cached_uid;
END;
$$;

-- Função para cachear o resultado de auth.role() durante a transação
CREATE OR REPLACE FUNCTION public.cached_auth_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    cached_role text;
BEGIN
    -- Tentar obter do cache da transação
    BEGIN
        cached_role := current_setting('app.cached_auth_role', true);
        IF cached_role IS NOT NULL AND cached_role != '' THEN
            RETURN cached_role;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- Ignorar erro se não estiver definido
            NULL;
    END;
    
    -- Obter e cachear o auth.role()
    cached_role := auth.role();
    PERFORM set_config('app.cached_auth_role', cached_role, true);
    
    RETURN cached_role;
END;
$$;

-- =====================================================
-- 9. POLÍTICAS ALTERNATIVAS COM CACHE (OPCIONAL)
-- =====================================================

-- Se quiser usar as funções de cache, descomente e use estas políticas:

/*
-- Exemplo para user_profiles com cache
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (
        user_id = public.cached_auth_uid()
    );
*/

-- =====================================================
-- 10. VERIFICAÇÃO DE PERFORMANCE
-- =====================================================

-- Query para verificar o plano de execução das políticas
-- Execute no psql ou Supabase SQL Editor:

/*
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM public.user_profiles 
WHERE user_id = auth.uid();
*/

-- =====================================================
-- 11. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION public.cached_auth_uid() IS 'Função que cacheia auth.uid() durante a transação para melhor performance em RLS';
COMMENT ON FUNCTION public.cached_auth_role() IS 'Função que cacheia auth.role() durante a transação para melhor performance em RLS';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================

/*
🎯 BENEFÍCIOS DA OTIMIZAÇÃO:

1. ✅ Funções auth() são avaliadas apenas uma vez por query
2. ✅ Subqueries previnem reavaliação para cada linha
3. ✅ Funções de cache opcionais para casos extremos
4. ✅ Melhoria significativa na performance de queries grandes
5. ✅ Redução da carga no servidor de autenticação

📊 IMPACTO ESPERADO:
- Queries com muitas linhas: 50-90% mais rápidas
- Redução no uso de CPU do servidor
- Melhor experiência do usuário
- Menor latência nas consultas
*/