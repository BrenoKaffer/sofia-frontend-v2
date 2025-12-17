-- Função para obter estatísticas horárias de logs
CREATE OR REPLACE FUNCTION get_hourly_log_stats(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  hour TIMESTAMP WITH TIME ZONE,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('hour', created_at) as hour,
    COUNT(*) as count
  FROM system_logs
  WHERE created_at >= start_date 
    AND created_at <= end_date
  GROUP BY date_trunc('hour', created_at)
  ORDER BY hour;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de logs por período
CREATE OR REPLACE FUNCTION get_log_stats_by_period(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  total_logs BIGINT,
  error_count BIGINT,
  warn_count BIGINT,
  info_count BIGINT,
  debug_count BIGINT,
  error_rate NUMERIC,
  warn_rate NUMERIC
) AS $$
DECLARE
  total_count BIGINT;
BEGIN
  -- Contar total de logs
  SELECT COUNT(*) INTO total_count
  FROM system_logs
  WHERE created_at >= start_date 
    AND created_at <= end_date;

  RETURN QUERY
  SELECT 
    total_count as total_logs,
    COALESCE(SUM(CASE WHEN level = 'ERROR' THEN 1 ELSE 0 END), 0) as error_count,
    COALESCE(SUM(CASE WHEN level = 'WARN' THEN 1 ELSE 0 END), 0) as warn_count,
    COALESCE(SUM(CASE WHEN level = 'INFO' THEN 1 ELSE 0 END), 0) as info_count,
    COALESCE(SUM(CASE WHEN level = 'DEBUG' THEN 1 ELSE 0 END), 0) as debug_count,
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
  FROM system_logs
  WHERE created_at >= start_date 
    AND created_at <= end_date;
END;
$$ LANGUAGE plpgsql;

-- Função para limpeza automática de logs antigos
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS TABLE (
  deleted_count BIGINT,
  cutoff_date TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  cutoff TIMESTAMP WITH TIME ZONE;
  deleted BIGINT;
BEGIN
  -- Calcular data de corte
  cutoff := NOW() - (days_to_keep || ' days')::INTERVAL;
  
  -- Deletar logs antigos
  WITH deleted_logs AS (
    DELETE FROM system_logs 
    WHERE created_at < cutoff
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted FROM deleted_logs;
  
  RETURN QUERY
  SELECT deleted as deleted_count, cutoff as cutoff_date;
END;
$$ LANGUAGE plpgsql;

-- Função para obter top erros únicos
CREATE OR REPLACE FUNCTION get_top_errors(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  message TEXT,
  count BIGINT,
  first_occurrence TIMESTAMP WITH TIME ZONE,
  last_occurrence TIMESTAMP WITH TIME ZONE,
  sample_details JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.message,
    COUNT(*) as count,
    MIN(sl.created_at) as first_occurrence,
    MAX(sl.created_at) as last_occurrence,
    (array_agg(sl.details ORDER BY sl.created_at DESC))[1] as sample_details
  FROM system_logs sl
  WHERE sl.level = 'ERROR'
    AND sl.created_at >= start_date 
    AND sl.created_at <= end_date
  GROUP BY sl.message
  ORDER BY count DESC, last_occurrence DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Função para obter atividade por usuário
CREATE OR REPLACE FUNCTION get_user_activity(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  user_id TEXT,
  total_logs BIGINT,
  error_logs BIGINT,
  warn_logs BIGINT,
  info_logs BIGINT,
  debug_logs BIGINT,
  last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.user_id,
    COUNT(*) as total_logs,
    SUM(CASE WHEN sl.level = 'ERROR' THEN 1 ELSE 0 END) as error_logs,
    SUM(CASE WHEN sl.level = 'WARN' THEN 1 ELSE 0 END) as warn_logs,
    SUM(CASE WHEN sl.level = 'INFO' THEN 1 ELSE 0 END) as info_logs,
    SUM(CASE WHEN sl.level = 'DEBUG' THEN 1 ELSE 0 END) as debug_logs,
    MAX(sl.created_at) as last_activity
  FROM system_logs sl
  WHERE sl.user_id IS NOT NULL
    AND sl.created_at >= start_date 
    AND sl.created_at <= end_date
  GROUP BY sl.user_id
  ORDER BY total_logs DESC, last_activity DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at_level ON system_logs(created_at, level);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id_created_at ON system_logs(user_id, created_at) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_system_logs_context_created_at ON system_logs(context, created_at) WHERE context IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_system_logs_level_message ON system_logs(level, message) WHERE level = 'ERROR';

-- Comentários para documentação
COMMENT ON FUNCTION get_hourly_log_stats IS 'Retorna estatísticas de logs agrupadas por hora';
COMMENT ON FUNCTION get_log_stats_by_period IS 'Retorna estatísticas gerais de logs para um período';
COMMENT ON FUNCTION cleanup_old_logs IS 'Remove logs antigos baseado no número de dias especificado';
COMMENT ON FUNCTION get_top_errors IS 'Retorna os erros mais frequentes em um período';
COMMENT ON FUNCTION get_user_activity IS 'Retorna atividade de logs por usuário';