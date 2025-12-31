-- ========================================
-- SCRIPT DE TESTE PARA VERIFICAR CORREÇÕES RLS
-- Verifica se todas as tabelas estão protegidas
-- ========================================

-- 1. VERIFICAR STATUS ATUAL DAS TABELAS
-- ========================================
SELECT 
    '🔍 VERIFICAÇÃO DE TABELAS UNRESTRICTED' as titulo;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ PROTEGIDA'
        ELSE '❌ UNRESTRICTED'
    END as status,
    CASE 
        WHEN rowsecurity THEN 'Segura'
        ELSE 'PRECISA CORREÇÃO'
    END as resultado
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
-- 2. CONTAR TABELAS PROBLEMÁTICAS
-- ========================================
SELECT 
    '📊 RESUMO GERAL' as titulo;

SELECT 
    COUNT(*) as total_tabelas,
    SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) as tabelas_protegidas,
    SUM(CASE WHEN NOT rowsecurity THEN 1 ELSE 0 END) as tabelas_unrestricted,
    CASE 
        WHEN SUM(CASE WHEN NOT rowsecurity THEN 1 ELSE 0 END) = 0 
        THEN '✅ TODAS PROTEGIDAS'
        ELSE '❌ AINDA HÁ PROBLEMAS'
    END as status_geral
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
);

-- ========================================
-- 3. VERIFICAR POLÍTICAS CRIADAS
-- ========================================
SELECT 
    '🛡️ POLÍTICAS DE SEGURANÇA CRIADAS' as titulo;

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as tipo_operacao,
    CASE 
        WHEN cmd = 'SELECT' THEN '👁️ Visualização'
        WHEN cmd = 'INSERT' THEN '➕ Inserção'
        WHEN cmd = 'UPDATE' THEN '✏️ Atualização'
        WHEN cmd = 'DELETE' THEN '🗑️ Exclusão'
        WHEN cmd = 'ALL' THEN '🔄 Todas Operações'
        ELSE cmd
    END as descricao_operacao
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

-- ========================================
-- 4. VERIFICAR ESTRUTURA DAS TABELAS
-- ========================================
SELECT 
    '🏗️ ESTRUTURA DAS TABELAS (COLUNAS IMPORTANTES)' as titulo;

SELECT 
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN column_name = 'user_id' THEN '👤 Identificação do Usuário'
        WHEN column_name = 'id' THEN '🔑 Chave Primária'
        WHEN column_name LIKE '%created%' THEN '📅 Data de Criação'
        WHEN column_name LIKE '%updated%' THEN '🔄 Data de Atualização'
        ELSE '📋 Outros Dados'
    END as tipo_coluna
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name IN (
    'alert_thresholds',
    'automated_alerts',
    'backup_profiles', 
    'backup_user_preferences',
    'backup_user_profiles',
    'monitoring_logs',
    'system_logs'
)
AND column_name IN ('id', 'user_id', 'created_at', 'updated_at')
ORDER BY table_name, 
         CASE column_name 
             WHEN 'id' THEN 1
             WHEN 'user_id' THEN 2
             WHEN 'created_at' THEN 3
             WHEN 'updated_at' THEN 4
             ELSE 5
         END;

-- ========================================
-- 5. TESTE DE ACESSO (SIMULAÇÃO)
-- ========================================
SELECT 
    '🧪 TESTE DE ACESSO SIMULADO' as titulo;

-- Verificar se as tabelas existem e têm dados
SELECT 
    t.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅ Existe'
        ELSE '❌ Não Existe'
    END as status_tabela,
    CASE 
        WHEN pt.rowsecurity THEN '🔒 RLS Ativo'
        ELSE '🔓 RLS Inativo'
    END as status_rls
FROM information_schema.tables t
LEFT JOIN pg_tables pt ON pt.tablename = t.table_name AND pt.schemaname = 'public'
WHERE t.table_schema = 'public'
AND t.table_name IN (
    'alert_thresholds',
    'automated_alerts',
    'backup_profiles', 
    'backup_user_preferences',
    'backup_user_profiles',
    'monitoring_logs',
    'system_logs'
)
ORDER BY t.table_name;

-- ========================================
-- 6. RELATÓRIO FINAL
-- ========================================
SELECT 
    '📋 RELATÓRIO FINAL DE CORREÇÕES' as titulo;

WITH tabela_status AS (
    SELECT 
        tablename,
        rowsecurity,
        CASE WHEN rowsecurity THEN 1 ELSE 0 END as protegida
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
),
politicas_count AS (
    SELECT 
        tablename,
        COUNT(*) as num_politicas
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
    GROUP BY tablename
)
SELECT 
    ts.tablename as tabela,
    CASE WHEN ts.rowsecurity THEN '✅ PROTEGIDA' ELSE '❌ UNRESTRICTED' END as status_rls,
    COALESCE(pc.num_politicas, 0) as politicas_criadas,
    CASE 
        WHEN ts.rowsecurity AND COALESCE(pc.num_politicas, 0) > 0 THEN '🎯 CORREÇÃO COMPLETA'
        WHEN ts.rowsecurity AND COALESCE(pc.num_politicas, 0) = 0 THEN '⚠️ RLS SEM POLÍTICAS'
        WHEN NOT ts.rowsecurity THEN '❌ PRECISA CORREÇÃO'
        ELSE '❓ STATUS INDEFINIDO'
    END as resultado_final
FROM tabela_status ts
LEFT JOIN politicas_count pc ON pc.tablename = ts.tablename
ORDER BY ts.tablename;

-- Mensagem final
SELECT 
    '🎉 TESTE CONCLUÍDO!' as titulo,
    'Execute este script após aplicar as correções para verificar o resultado.' as instrucao;