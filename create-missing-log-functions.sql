-- =====================================================
-- FUNÇÕES DE LOGGING FALTANTES
-- Execute este script após o fix-database-errors.sql
-- =====================================================

-- Função para inserir logs no sistema
CREATE OR REPLACE FUNCTION insert_system_log(
    p_level TEXT,
    p_message TEXT,
    p_context TEXT DEFAULT NULL,
    p_source TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.system_logs (
        level,
        message,
        context,
        source,
        user_id,
        session_id,
        ip_address,
        user_agent,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        UPPER(p_level),
        p_message,
        p_context,
        p_source,
        p_user_id,
        p_session_id,
        p_ip_address,
        p_user_agent,
        p_metadata,
        NOW(),
        NOW()
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- Função para buscar logs com filtros
CREATE OR REPLACE FUNCTION get_system_logs(
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0,
    p_level TEXT DEFAULT NULL,
    p_source TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_search_text TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    level TEXT,
    message TEXT,
    context TEXT,
    source TEXT,
    user_id UUID,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sl.id,
        sl.level,
        sl.message,
        sl.context,
        sl.source,
        sl.user_id,
        sl.session_id,
        sl.ip_address,
        sl.user_agent,
        sl.metadata,
        sl.created_at,
        sl.updated_at
    FROM public.system_logs sl
    WHERE 
        (p_level IS NULL OR sl.level = UPPER(p_level))
        AND (p_source IS NULL OR sl.source = p_source)
        AND (p_user_id IS NULL OR sl.user_id = p_user_id)
        AND (p_start_date IS NULL OR sl.created_at >= p_start_date)
        AND (p_end_date IS NULL OR sl.created_at <= p_end_date)
        AND (p_search_text IS NULL OR 
             sl.message ILIKE '%' || p_search_text || '%' OR
             sl.context ILIKE '%' || p_search_text || '%')
    ORDER BY sl.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Função para obter estatísticas de logs
CREATE OR REPLACE FUNCTION get_log_statistics(
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '24 hours',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    total_logs BIGINT,
    error_count BIGINT,
    warn_count BIGINT,
    info_count BIGINT,
    debug_count BIGINT,
    fatal_count BIGINT,
    error_rate NUMERIC,
    warn_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_count BIGINT;
BEGIN
    -- Contar total de logs
    SELECT COUNT(*) INTO total_count
    FROM public.system_logs
    WHERE created_at >= p_start_date 
      AND created_at <= p_end_date;

    RETURN QUERY
    SELECT 
        total_count as total_logs,
        COALESCE(SUM(CASE WHEN level = 'ERROR' THEN 1 ELSE 0 END), 0) as error_count,
        COALESCE(SUM(CASE WHEN level = 'WARN' THEN 1 ELSE 0 END), 0) as warn_count,
        COALESCE(SUM(CASE WHEN level = 'INFO' THEN 1 ELSE 0 END), 0) as info_count,
        COALESCE(SUM(CASE WHEN level = 'DEBUG' THEN 1 ELSE 0 END), 0) as debug_count,
        COALESCE(SUM(CASE WHEN level = 'FATAL' THEN 1 ELSE 0 END), 0) as fatal_count,
        CASE 
            WHEN total_count > 0 THEN 
                ROUND((SUM(CASE WHEN level = 'ERROR' THEN 1 ELSE 0 END)::NUMERIC / total_count) * 100, 2)
            ELSE 0 
        END as error_rate,
        CASE 
            WHEN total_count > 0 THEN 
                ROUND((SUM(CASE WHEN level = 'WARN' THEN 1 ELSE 0 END)::NUMERIC / total_count) * 100, 2)
            ELSE 0 
        END as warn_rate
    FROM public.system_logs
    WHERE created_at >= p_start_date 
      AND created_at <= p_end_date;
END;
$$;

-- Função para limpeza automática de logs antigos
CREATE OR REPLACE FUNCTION cleanup_old_logs(
    p_days_to_keep INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.system_logs
    WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log da limpeza
    INSERT INTO public.system_logs (level, message, source, metadata, created_at, updated_at)
    VALUES (
        'INFO',
        'Limpeza automática de logs executada',
        'system_cleanup',
        jsonb_build_object(
            'deleted_count', deleted_count,
            'days_kept', p_days_to_keep,
            'cleanup_date', NOW()
        ),
        NOW(),
        NOW()
    );
    
    RETURN deleted_count;
END;
$$;

-- Função para obter logs por hora (para gráficos)
CREATE OR REPLACE FUNCTION get_hourly_log_stats(
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '24 hours',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    hour TIMESTAMPTZ,
    total_count BIGINT,
    error_count BIGINT,
    warn_count BIGINT,
    info_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        date_trunc('hour', sl.created_at) as hour,
        COUNT(*) as total_count,
        SUM(CASE WHEN sl.level = 'ERROR' THEN 1 ELSE 0 END) as error_count,
        SUM(CASE WHEN sl.level = 'WARN' THEN 1 ELSE 0 END) as warn_count,
        SUM(CASE WHEN sl.level = 'INFO' THEN 1 ELSE 0 END) as info_count
    FROM public.system_logs sl
    WHERE sl.created_at >= p_start_date 
      AND sl.created_at <= p_end_date
    GROUP BY date_trunc('hour', sl.created_at)
    ORDER BY hour;
END;
$$;

-- Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION insert_system_log(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, INET, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_system_log(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, INET, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION insert_system_log(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, INET, TEXT, JSONB) TO service_role;

GRANT EXECUTE ON FUNCTION get_system_logs(INTEGER, INTEGER, TEXT, TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_logs(INTEGER, INTEGER, TEXT, TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION get_log_statistics(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_log_statistics(TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

GRANT EXECUTE ON FUNCTION cleanup_old_logs(INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION get_hourly_log_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_hourly_log_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela system_logs
DROP TRIGGER IF EXISTS update_system_logs_updated_at ON public.system_logs;
CREATE TRIGGER update_system_logs_updated_at
    BEFORE UPDATE ON public.system_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir alguns logs de teste para verificar se tudo está funcionando
INSERT INTO public.system_logs (level, message, source, context, metadata, created_at, updated_at)
VALUES 
    ('INFO', 'Sistema de logs inicializado com sucesso', 'system_init', 'database_setup', '{"version": "1.0", "setup_date": "' || NOW() || '"}', NOW(), NOW()),
    ('INFO', 'Tabelas e funções de logging criadas', 'database_setup', 'migration', '{"tables_created": ["system_logs"], "functions_created": 5}', NOW(), NOW());

-- Verificação final
SELECT 'VERIFICAÇÃO - Funções de logging criadas:' as info;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN (
    'insert_system_log',
    'get_system_logs', 
    'get_log_statistics',
    'cleanup_old_logs',
    'get_hourly_log_stats'
)
AND routine_schema = 'public';

SELECT 'VERIFICAÇÃO - Logs de teste inseridos:' as info;
SELECT COUNT(*) as total_logs, level
FROM public.system_logs 
GROUP BY level
ORDER BY level;