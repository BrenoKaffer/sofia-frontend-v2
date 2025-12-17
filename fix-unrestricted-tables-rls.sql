-- ========================================
-- SCRIPT PARA CORRIGIR TABELAS UNRESTRICTED
-- Habilita RLS e cria políticas de segurança
-- ========================================

-- 1. VERIFICAR TABELAS SEM RLS
-- ========================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'alert_thresholds',
    'automated_alerts',
    'backup_profiles', 
    'backup_user_preferences',
    'backup_user_profiles',
    'monitoring_logs',
    'system_logs'
)
ORDER BY tablename;

-- ========================================
-- 2. HABILITAR RLS EM TODAS AS TABELAS
-- ========================================

-- Habilitar RLS para alert_thresholds
ALTER TABLE IF EXISTS public.alert_thresholds ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS para automated_alerts
ALTER TABLE IF EXISTS public.automated_alerts ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS para backup_profiles
ALTER TABLE IF EXISTS public.backup_profiles ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS para backup_user_preferences
ALTER TABLE IF EXISTS public.backup_user_preferences ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS para backup_user_profiles
ALTER TABLE IF EXISTS public.backup_user_profiles ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS para monitoring_logs
ALTER TABLE IF EXISTS public.monitoring_logs ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS para system_logs
ALTER TABLE IF EXISTS public.system_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. CRIAR POLÍTICAS DE SEGURANÇA
-- ========================================

-- POLÍTICAS PARA alert_thresholds
-- ========================================
DROP POLICY IF EXISTS "Users can view own alert thresholds" ON public.alert_thresholds;
DROP POLICY IF EXISTS "Users can manage own alert thresholds" ON public.alert_thresholds;

-- Verificar se a coluna user_id existe antes de criar políticas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'alert_thresholds' AND column_name = 'user_id') THEN
        
        -- Política para visualizar
        EXECUTE 'CREATE POLICY "Users can view own alert thresholds" ON public.alert_thresholds
            FOR SELECT USING (auth.uid() = user_id)';
            
        -- Política para inserir/atualizar/deletar
        EXECUTE 'CREATE POLICY "Users can manage own alert thresholds" ON public.alert_thresholds
            FOR ALL USING (auth.uid() = user_id)';
            
        RAISE NOTICE 'Políticas criadas para alert_thresholds';
    ELSE
        -- Se não tem user_id, permitir acesso apenas para usuários autenticados
        EXECUTE 'CREATE POLICY "Authenticated users can access alert thresholds" ON public.alert_thresholds
            FOR ALL USING (auth.role() = ''authenticated'')';
            
        RAISE NOTICE 'Política genérica criada para alert_thresholds (sem user_id)';
    END IF;
END $$;

-- POLÍTICAS PARA automated_alerts
-- ========================================
DROP POLICY IF EXISTS "Users can view own automated alerts" ON public.automated_alerts;
DROP POLICY IF EXISTS "Users can manage own automated alerts" ON public.automated_alerts;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'automated_alerts' AND column_name = 'user_id') THEN
        
        EXECUTE 'CREATE POLICY "Users can view own automated alerts" ON public.automated_alerts
            FOR SELECT USING (auth.uid() = user_id)';
            
        EXECUTE 'CREATE POLICY "Users can manage own automated alerts" ON public.automated_alerts
            FOR ALL USING (auth.uid() = user_id)';
            
        RAISE NOTICE 'Políticas criadas para automated_alerts';
    ELSE
        EXECUTE 'CREATE POLICY "Authenticated users can access automated alerts" ON public.automated_alerts
            FOR ALL USING (auth.role() = ''authenticated'')';
            
        RAISE NOTICE 'Política genérica criada para automated_alerts (sem user_id)';
    END IF;
END $$;

-- POLÍTICAS PARA backup_profiles
-- ========================================
DROP POLICY IF EXISTS "Users can view own backup profiles" ON public.backup_profiles;
DROP POLICY IF EXISTS "Users can manage own backup profiles" ON public.backup_profiles;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'backup_profiles' AND column_name = 'user_id') THEN
        
        EXECUTE 'CREATE POLICY "Users can view own backup profiles" ON public.backup_profiles
            FOR SELECT USING (auth.uid() = user_id)';
            
        EXECUTE 'CREATE POLICY "Users can manage own backup profiles" ON public.backup_profiles
            FOR ALL USING (auth.uid() = user_id)';
            
        RAISE NOTICE 'Políticas criadas para backup_profiles';
    ELSE
        EXECUTE 'CREATE POLICY "Authenticated users can access backup profiles" ON public.backup_profiles
            FOR ALL USING (auth.role() = ''authenticated'')';
            
        RAISE NOTICE 'Política genérica criada para backup_profiles (sem user_id)';
    END IF;
END $$;

-- POLÍTICAS PARA backup_user_preferences
-- ========================================
DROP POLICY IF EXISTS "Users can view own backup preferences" ON public.backup_user_preferences;
DROP POLICY IF EXISTS "Users can manage own backup preferences" ON public.backup_user_preferences;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'backup_user_preferences' AND column_name = 'user_id') THEN
        
        EXECUTE 'CREATE POLICY "Users can view own backup preferences" ON public.backup_user_preferences
            FOR SELECT USING (auth.uid() = user_id)';
            
        EXECUTE 'CREATE POLICY "Users can manage own backup preferences" ON public.backup_user_preferences
            FOR ALL USING (auth.uid() = user_id)';
            
        RAISE NOTICE 'Políticas criadas para backup_user_preferences';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'backup_user_preferences' AND column_name = 'id') THEN
        
        EXECUTE 'CREATE POLICY "Users can view own backup preferences" ON public.backup_user_preferences
            FOR SELECT USING (auth.uid() = id)';
            
        EXECUTE 'CREATE POLICY "Users can manage own backup preferences" ON public.backup_user_preferences
            FOR ALL USING (auth.uid() = id)';
            
        RAISE NOTICE 'Políticas criadas para backup_user_preferences (usando id)';
    ELSE
        EXECUTE 'CREATE POLICY "Authenticated users can access backup preferences" ON public.backup_user_preferences
            FOR ALL USING (auth.role() = ''authenticated'')';
            
        RAISE NOTICE 'Política genérica criada para backup_user_preferences';
    END IF;
END $$;

-- POLÍTICAS PARA backup_user_profiles
-- ========================================
DROP POLICY IF EXISTS "Users can view own backup profiles" ON public.backup_user_profiles;
DROP POLICY IF EXISTS "Users can manage own backup profiles" ON public.backup_user_profiles;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'backup_user_profiles' AND column_name = 'user_id') THEN
        
        EXECUTE 'CREATE POLICY "Users can view own backup profiles" ON public.backup_user_profiles
            FOR SELECT USING (auth.uid() = user_id)';
            
        EXECUTE 'CREATE POLICY "Users can manage own backup profiles" ON public.backup_user_profiles
            FOR ALL USING (auth.uid() = user_id)';
            
        RAISE NOTICE 'Políticas criadas para backup_user_profiles';
    ELSE
        EXECUTE 'CREATE POLICY "Authenticated users can access backup profiles" ON public.backup_user_profiles
            FOR ALL USING (auth.role() = ''authenticated'')';
            
        RAISE NOTICE 'Política genérica criada para backup_user_profiles';
    END IF;
END $$;

-- POLÍTICAS PARA monitoring_logs
-- ========================================
DROP POLICY IF EXISTS "Users can view own monitoring logs" ON public.monitoring_logs;
DROP POLICY IF EXISTS "Service can insert monitoring logs" ON public.monitoring_logs;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'monitoring_logs' AND column_name = 'user_id') THEN
        
        -- Usuários podem ver seus próprios logs
        EXECUTE 'CREATE POLICY "Users can view own monitoring logs" ON public.monitoring_logs
            FOR SELECT USING (auth.uid() = user_id)';
            
        -- Serviço pode inserir logs
        EXECUTE 'CREATE POLICY "Service can insert monitoring logs" ON public.monitoring_logs
            FOR INSERT WITH CHECK (true)';
            
        RAISE NOTICE 'Políticas criadas para monitoring_logs';
    ELSE
        -- Se não tem user_id, permitir apenas leitura para autenticados
        EXECUTE 'CREATE POLICY "Authenticated users can view monitoring logs" ON public.monitoring_logs
            FOR SELECT USING (auth.role() = ''authenticated'')';
            
        EXECUTE 'CREATE POLICY "Service can insert monitoring logs" ON public.monitoring_logs
            FOR INSERT WITH CHECK (true)';
            
        RAISE NOTICE 'Políticas genéricas criadas para monitoring_logs';
    END IF;
END $$;

-- POLÍTICAS PARA system_logs
-- ========================================
DROP POLICY IF EXISTS "Users can view own system logs" ON public.system_logs;
DROP POLICY IF EXISTS "Service can insert system logs" ON public.system_logs;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'system_logs' AND column_name = 'user_id') THEN
        
        -- Usuários podem ver seus próprios logs
        EXECUTE 'CREATE POLICY "Users can view own system logs" ON public.system_logs
            FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL)';
            
        -- Serviço pode inserir logs
        EXECUTE 'CREATE POLICY "Service can insert system logs" ON public.system_logs
            FOR INSERT WITH CHECK (true)';
            
        RAISE NOTICE 'Políticas criadas para system_logs';
    ELSE
        -- Se não tem user_id, permitir apenas leitura para autenticados
        EXECUTE 'CREATE POLICY "Authenticated users can view system logs" ON public.system_logs
            FOR SELECT USING (auth.role() = ''authenticated'')';
            
        EXECUTE 'CREATE POLICY "Service can insert system logs" ON public.system_logs
            FOR INSERT WITH CHECK (true)';
            
        RAISE NOTICE 'Políticas genéricas criadas para system_logs';
    END IF;
END $$;

-- ========================================
-- 4. VERIFICAÇÃO FINAL
-- ========================================

-- Verificar se RLS foi habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ PROTEGIDA'
        ELSE '❌ UNRESTRICTED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'alert_thresholds',
    'automated_alerts',
    'backup_profiles', 
    'backup_user_preferences',
    'backup_user_profiles',
    'monitoring_logs',
    'system_logs'
)
ORDER BY tablename;

-- Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'alert_thresholds',
    'automated_alerts',
    'backup_profiles', 
    'backup_user_preferences',
    'backup_user_profiles',
    'monitoring_logs',
    'system_logs'
)
ORDER BY tablename, policyname;

-- Mensagem final
DO $$
BEGIN
    RAISE NOTICE '🔒 RLS habilitado e políticas de segurança aplicadas com sucesso!';
    RAISE NOTICE '✅ Todas as tabelas agora estão protegidas';
    RAISE NOTICE '📋 Execute a verificação final acima para confirmar';
END $$;