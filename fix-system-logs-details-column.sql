-- =====================================================
-- SCRIPT PARA CORRIGIR A COLUNA 'details' NA TABELA system_logs
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Verificar se a tabela system_logs existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_logs'
    ) THEN
        RAISE NOTICE 'Tabela system_logs não existe. Criando...';
        
        -- Criar a tabela completa se não existir
        CREATE TABLE public.system_logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            
            -- Informações básicas do log
            level TEXT NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
            message TEXT NOT NULL,
            timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            
            -- Contexto e origem
            context TEXT, -- 'api', 'auth', 'database', 'websocket', etc.
            source TEXT, -- arquivo ou componente que gerou o log
            user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            session_id TEXT,
            
            -- Detalhes técnicos
            details JSONB DEFAULT '{}' NOT NULL, -- dados adicionais em formato JSON
            stack_trace TEXT, -- stack trace para erros
            request_id TEXT, -- ID da requisição para rastreamento
            
            -- Metadados
            environment TEXT DEFAULT 'development' CHECK (environment IN ('development', 'staging', 'production')),
            version TEXT, -- versão da aplicação
            ip_address INET,
            user_agent TEXT,
            
            -- Índices para performance
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );
        
        RAISE NOTICE 'Tabela system_logs criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela system_logs já existe. Verificando coluna details...';
    END IF;
END $$;

-- 2. Verificar e adicionar a coluna 'details' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'system_logs' 
        AND column_name = 'details'
    ) THEN
        RAISE NOTICE 'Coluna details não existe. Adicionando...';
        ALTER TABLE public.system_logs ADD COLUMN details JSONB DEFAULT '{}' NOT NULL;
        RAISE NOTICE 'Coluna details adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna details já existe.';
    END IF;
END $$;

-- 3. Verificar e corrigir o tipo da coluna details se necessário
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'system_logs' 
        AND column_name = 'details'
        AND data_type != 'jsonb'
    ) THEN
        RAISE NOTICE 'Corrigindo tipo da coluna details para JSONB...';
        ALTER TABLE public.system_logs ALTER COLUMN details TYPE JSONB USING details::JSONB;
        ALTER TABLE public.system_logs ALTER COLUMN details SET DEFAULT '{}';
        ALTER TABLE public.system_logs ALTER COLUMN details SET NOT NULL;
        RAISE NOTICE 'Tipo da coluna details corrigido!';
    END IF;
END $$;

-- 4. Criar índices necessários se não existirem
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON public.system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_context ON public.system_logs(context);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_environment ON public.system_logs(environment);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_details ON public.system_logs USING GIN(details);

-- Índices compostos para consultas comuns
CREATE INDEX IF NOT EXISTS idx_system_logs_level_timestamp ON public.system_logs(level, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_context_level ON public.system_logs(context, level);

-- 5. Habilitar Row Level Security (RLS) se não estiver habilitado
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas de RLS se não existirem
DO $$
BEGIN
    -- Política para usuários autenticados visualizarem logs
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'system_logs' 
        AND policyname = 'Authenticated users can view logs'
    ) THEN
        CREATE POLICY "Authenticated users can view logs" ON public.system_logs
            FOR SELECT USING (auth.role() = 'authenticated');
        RAISE NOTICE 'Política "Authenticated users can view logs" criada.';
    END IF;

    -- Política para service role inserir logs
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'system_logs' 
        AND policyname = 'Service role can insert logs'
    ) THEN
        CREATE POLICY "Service role can insert logs" ON public.system_logs
            FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');
        RAISE NOTICE 'Política "Service role can insert logs" criada.';
    END IF;

    -- Política para admins visualizarem todos os logs
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'system_logs' 
        AND policyname = 'Admins can view all logs'
    ) THEN
        CREATE POLICY "Admins can view all logs" ON public.system_logs
            FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
        RAISE NOTICE 'Política "Admins can view all logs" criada.';
    END IF;
END $$;

-- 7. Criar trigger para updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_system_logs_updated_at ON public.system_logs;
CREATE TRIGGER trigger_system_logs_updated_at
    BEFORE UPDATE ON public.system_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Inserir log de teste para verificar se tudo está funcionando
INSERT INTO public.system_logs (level, message, context, source, details) VALUES
('INFO', 'Script de correção da tabela system_logs executado com sucesso', 'database', 'migration', '{"script": "fix-system-logs-details-column.sql", "action": "table_structure_fix"}');

-- 9. Verificação final
SELECT 
    'VERIFICAÇÃO FINAL - system_logs' as info,
    COUNT(*) as total_columns,
    ARRAY_AGG(column_name ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'system_logs' AND table_schema = 'public';

-- Verificar se a coluna details existe especificamente
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'system_logs' 
            AND column_name = 'details'
        ) 
        THEN '✅ Coluna details existe e está configurada corretamente'
        ELSE '❌ Coluna details ainda não existe'
    END as status_details;

-- Verificar políticas RLS
SELECT 
    'POLÍTICAS RLS' as info,
    COUNT(*) as total_policies,
    ARRAY_AGG(policyname) as policy_names
FROM pg_policies 
WHERE tablename = 'system_logs' AND schemaname = 'public';

RAISE NOTICE '🎉 Script de correção executado com sucesso!';
RAISE NOTICE '📋 Próximos passos:';
RAISE NOTICE '1. Verificar se não há mais erros de "details column not found"';
RAISE NOTICE '2. Testar inserção de logs através da aplicação';
RAISE NOTICE '3. Verificar se os logs estão sendo persistidos corretamente';