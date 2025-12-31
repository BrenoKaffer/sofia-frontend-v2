-- Adicionar coluna acknowledged na tabela logs
ALTER TABLE logs 
ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN DEFAULT FALSE;

-- Criar índice para melhorar performance das consultas de alertas
CREATE INDEX IF NOT EXISTS idx_logs_level_acknowledged 
ON logs(level, acknowledged) 
WHERE level = 'ERROR';

-- Criar índice para consultas por timestamp e nível
CREATE INDEX IF NOT EXISTS idx_logs_error_timestamp 
ON logs(created_at DESC) 
WHERE level = 'ERROR';

-- Comentários
COMMENT ON COLUMN logs.acknowledged IS 'Indica se o alerta de erro foi reconhecido pelo usuário';
COMMENT ON INDEX idx_logs_level_acknowledged IS 'Índice para consultas rápidas de alertas não reconhecidos';
COMMENT ON INDEX idx_logs_error_timestamp IS 'Índice para consultas de erros por timestamp';