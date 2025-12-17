-- =====================================================
-- SCRIPT PARA CRIAR TABELA DE LOGS NO SUPABASE
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Criar tabela de logs
CREATE TABLE IF NOT EXISTS public.system_logs (
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

-- 2. Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON public.system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_context ON public.system_logs(context);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_environment ON public.system_logs(environment);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);

-- Índice composto para consultas comuns
CREATE INDEX IF NOT EXISTS idx_system_logs_level_timestamp ON public.system_logs(level, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_context_level ON public.system_logs(context, level);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de segurança
-- Política para leitura: usuários autenticados podem ver logs
CREATE POLICY "Authenticated users can view logs" ON public.system_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para inserção: apenas service role pode inserir logs
CREATE POLICY "Service role can insert logs" ON public.system_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Política para administradores: podem ver todos os logs
CREATE POLICY "Admins can view all logs" ON public.system_logs
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM public.user_profiles 
            WHERE permissions @> '["admin"]'::jsonb
        )
    );

-- 5. Criar função para inserir logs via API
CREATE OR REPLACE FUNCTION public.insert_system_log(
    p_level TEXT,
    p_message TEXT,
    p_context TEXT DEFAULT NULL,
    p_source TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::jsonb,
    p_stack_trace TEXT DEFAULT NULL,
    p_request_id TEXT DEFAULT NULL,
    p_environment TEXT DEFAULT 'development',
    p_version TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.system_logs (
        level, message, context, source, user_id, session_id,
        details, stack_trace, request_id, environment, version,
        ip_address, user_agent
    ) VALUES (
        p_level, p_message, p_context, p_source, p_user_id, p_session_id,
        p_details, p_stack_trace, p_request_id, p_environment, p_version,
        p_ip_address, p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- 6. Criar função para limpeza automática de logs antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.system_logs 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log da limpeza
    INSERT INTO public.system_logs (level, message, context, details)
    VALUES (
        'INFO',
        'Limpeza automática de logs executada',
        'system',
        jsonb_build_object(
            'deleted_count', deleted_count,
            'days_kept', days_to_keep,
            'cleanup_date', NOW()
        )
    );
    
    RETURN deleted_count;
END;
$$;

-- 7. Criar função para obter estatísticas de logs
CREATE OR REPLACE FUNCTION public.get_log_statistics(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '24 hours',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    level TEXT,
    count BIGINT,
    percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_logs BIGINT;
BEGIN
    -- Obter total de logs no período
    SELECT COUNT(*) INTO total_logs
    FROM public.system_logs
    WHERE timestamp BETWEEN start_date AND end_date;
    
    -- Retornar estatísticas por nível
    RETURN QUERY
    SELECT 
        l.level,
        COUNT(*) as count,
        CASE 
            WHEN total_logs > 0 THEN ROUND((COUNT(*) * 100.0 / total_logs), 2)
            ELSE 0
        END as percentage
    FROM public.system_logs l
    WHERE l.timestamp BETWEEN start_date AND end_date
    GROUP BY l.level
    ORDER BY count DESC;
END;
$$;

-- 8. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_system_logs_updated_at
    BEFORE UPDATE ON public.system_logs
    FOR EACH ROW EXECUTE FUNCTION public.handle_logs_updated_at();

-- 9. Inserir alguns logs de exemplo para teste
INSERT INTO public.system_logs (level, message, context, source, details) VALUES
('INFO', 'Sistema de logs inicializado', 'system', 'database', '{"version": "1.0.0"}'),
('DEBUG', 'Tabela de logs criada com sucesso', 'database', 'migration', '{"table": "system_logs"}'),
('INFO', 'Políticas de segurança aplicadas', 'security', 'rls', '{"policies_count": 3}');

-- =====================================================
-- VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar se a tabela foi criada
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'system_logs' AND table_schema = 'public';

-- Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'system_logs' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar índices criados
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'system_logs' AND schemaname = 'public';

-- Verificar funções criadas
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%log%'
ORDER BY routine_name;

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================

/*
COMO USAR:

1. Copie todo este script
2. Abra o Supabase SQL Editor
3. Cole e execute o script
4. Verifique se todas as verificações finais retornam resultados

FUNCIONALIDADES CRIADAS:

✅ Tabela system_logs com campos otimizados
✅ Índices para performance
✅ Row Level Security (RLS)
✅ Políticas de segurança
✅ Função para inserir logs
✅ Função para limpeza automática
✅ Função para estatísticas
✅ Trigger para updated_at
✅ Logs de exemplo

PRÓXIMOS PASSOS:

1. Atualizar o logger.ts para usar a tabela
2. Criar API endpoints para CRUD
3. Implementar rotação automática
4. Configurar alertas para erros críticos
*/