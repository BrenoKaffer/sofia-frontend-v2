-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY) PARA SISTEMA SOFIA - VERSÃO SEGURA
-- =====================================================

-- Este script implementa políticas de segurança em nível de linha para todas as tabelas
-- do sistema, considerando a hierarquia de usuários: user < admin < superadmin
-- VERSÃO SEGURA: Verifica se as políticas já existem antes de criá-las

-- =====================================================
-- 1. HABILITAR RLS NAS TABELAS PRINCIPAIS (SE NÃO ESTIVER HABILITADO)
-- =====================================================

-- Habilitar RLS na tabela de perfis de usuário (apenas se não estiver habilitado)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Habilitar RLS na tabela de mudanças de status (apenas se não estiver habilitado)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'user_status_changes' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.user_status_changes ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Habilitar RLS em outras tabelas importantes (se existirem)
-- ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. FUNÇÕES AUXILIARES PARA RLS
-- =====================================================

-- Função para obter o user_id do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid AS $$
BEGIN
  RETURN COALESCE(
    (current_setting('app.current_user_id', true))::uuid,
    auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter o status do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_user_status()
RETURNS public.account_status_enum AS $$
BEGIN
  RETURN (
    SELECT account_status 
    FROM public.user_profiles 
    WHERE user_id = public.get_current_user_id()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário atual é admin ou superadmin
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN public.user_is_admin(public.get_current_user_status());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário atual é superadmin
CREATE OR REPLACE FUNCTION public.current_user_is_superadmin()
RETURNS boolean AS $$
BEGIN
  RETURN public.user_is_superadmin(public.get_current_user_status());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. POLÍTICAS RLS PARA USER_PROFILES (CRIAÇÃO SEGURA)
-- =====================================================

-- Política de SELECT: Usuários podem ver apenas seu próprio perfil, admins veem todos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles' 
        AND policyname = 'user_profiles_select_policy'
    ) THEN
        CREATE POLICY "user_profiles_select_policy" ON public.user_profiles
          FOR SELECT
          USING (
            user_id = public.get_current_user_id() OR 
            public.current_user_is_admin()
          );
    END IF;
END $$;

-- Política de INSERT: Apenas o próprio usuário pode criar seu perfil
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles' 
        AND policyname = 'user_profiles_insert_policy'
    ) THEN
        CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles
          FOR INSERT
          WITH CHECK (
            user_id = public.get_current_user_id()
          );
    END IF;
END $$;

-- Política de UPDATE: Usuários podem atualizar apenas seu perfil, admins podem atualizar qualquer um
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles' 
        AND policyname = 'user_profiles_update_policy'
    ) THEN
        CREATE POLICY "user_profiles_update_policy" ON public.user_profiles
          FOR UPDATE
          USING (
            user_id = public.get_current_user_id() OR 
            public.current_user_is_admin()
          )
          WITH CHECK (
            -- Se é o próprio usuário, pode atualizar campos básicos mas não account_status
            (user_id = public.get_current_user_id() AND 
             account_status = (SELECT account_status FROM public.user_profiles WHERE user_id = public.get_current_user_id())) OR
            -- Se é admin, pode atualizar tudo exceto promover para admin/superadmin
            (public.current_user_is_admin() AND NOT public.current_user_is_superadmin() AND 
             account_status NOT IN ('admin', 'superadmin')) OR
            -- Se é superadmin, pode atualizar tudo
            public.current_user_is_superadmin()
          );
    END IF;
END $$;

-- Política de DELETE: Apenas superadmins podem deletar perfis
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles' 
        AND policyname = 'user_profiles_delete_policy'
    ) THEN
        CREATE POLICY "user_profiles_delete_policy" ON public.user_profiles
          FOR DELETE
          USING (
            public.current_user_is_superadmin()
          );
    END IF;
END $$;

-- =====================================================
-- 4. POLÍTICAS RLS PARA USER_STATUS_CHANGES (CRIAÇÃO SEGURA)
-- =====================================================

-- Política de SELECT: Usuários veem apenas suas mudanças, admins veem todas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_status_changes' 
        AND policyname = 'user_status_changes_select_policy'
    ) THEN
        CREATE POLICY "user_status_changes_select_policy" ON public.user_status_changes
          FOR SELECT
          USING (
            user_id = public.get_current_user_id() OR 
            public.current_user_is_admin()
          );
    END IF;
END $$;

-- Política de INSERT: Apenas admins podem inserir mudanças de status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_status_changes' 
        AND policyname = 'user_status_changes_insert_policy'
    ) THEN
        CREATE POLICY "user_status_changes_insert_policy" ON public.user_status_changes
          FOR INSERT
          WITH CHECK (
            public.current_user_is_admin()
          );
    END IF;
END $$;

-- Política de UPDATE: Apenas superadmins podem atualizar logs de mudança
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_status_changes' 
        AND policyname = 'user_status_changes_update_policy'
    ) THEN
        CREATE POLICY "user_status_changes_update_policy" ON public.user_status_changes
          FOR UPDATE
          USING (
            public.current_user_is_superadmin()
          );
    END IF;
END $$;

-- Política de DELETE: Apenas superadmins podem deletar logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_status_changes' 
        AND policyname = 'user_status_changes_delete_policy'
    ) THEN
        CREATE POLICY "user_status_changes_delete_policy" ON public.user_status_changes
          FOR DELETE
          USING (
            public.current_user_is_superadmin()
          );
    END IF;
END $$;

-- =====================================================
-- 5. POLÍTICAS RLS PARA TABELAS DE PAGAMENTO
-- =====================================================

-- Assumindo que existem tabelas de pagamento, criar políticas
-- Descomente e ajuste conforme suas tabelas reais

/*
-- Habilitar RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- PAYMENT_METHODS: Usuários veem apenas seus métodos, admins veem todos
CREATE POLICY "payment_methods_select_policy" ON public.payment_methods
  FOR SELECT
  USING (
    user_id = public.get_current_user_id() OR 
    public.current_user_is_admin()
  );

CREATE POLICY "payment_methods_insert_policy" ON public.payment_methods
  FOR INSERT
  WITH CHECK (
    user_id = public.get_current_user_id()
  );

CREATE POLICY "payment_methods_update_policy" ON public.payment_methods
  FOR UPDATE
  USING (
    user_id = public.get_current_user_id() OR 
    public.current_user_is_admin()
  );

CREATE POLICY "payment_methods_delete_policy" ON public.payment_methods
  FOR DELETE
  USING (
    user_id = public.get_current_user_id() OR 
    public.current_user_is_superadmin()
  );

-- TRANSACTIONS: Usuários veem apenas suas transações, admins veem todas
CREATE POLICY "transactions_select_policy" ON public.transactions
  FOR SELECT
  USING (
    user_id = public.get_current_user_id() OR 
    public.current_user_is_admin()
  );

CREATE POLICY "transactions_insert_policy" ON public.transactions
  FOR INSERT
  WITH CHECK (
    user_id = public.get_current_user_id() OR 
    public.current_user_is_admin()
  );

-- Transações não devem ser atualizadas ou deletadas por usuários comuns
CREATE POLICY "transactions_update_policy" ON public.transactions
  FOR UPDATE
  USING (
    public.current_user_is_admin()
  );

CREATE POLICY "transactions_delete_policy" ON public.transactions
  FOR DELETE
  USING (
    public.current_user_is_superadmin()
  );

-- SUBSCRIPTIONS: Usuários veem apenas suas assinaturas, admins veem todas
CREATE POLICY "subscriptions_select_policy" ON public.subscriptions
  FOR SELECT
  USING (
    user_id = public.get_current_user_id() OR 
    public.current_user_is_admin()
  );

CREATE POLICY "subscriptions_insert_policy" ON public.subscriptions
  FOR INSERT
  WITH CHECK (
    user_id = public.get_current_user_id() OR 
    public.current_user_is_admin()
  );

CREATE POLICY "subscriptions_update_policy" ON public.subscriptions
  FOR UPDATE
  USING (
    user_id = public.get_current_user_id() OR 
    public.current_user_is_admin()
  );

CREATE POLICY "subscriptions_delete_policy" ON public.subscriptions
  FOR DELETE
  USING (
    public.current_user_is_superadmin()
  );
*/

-- =====================================================
-- 6. POLÍTICAS RLS PARA TABELAS DE SISTEMA E LOGS
-- =====================================================

-- Assumindo tabelas de sistema e auditoria
-- Descomente e ajuste conforme suas tabelas reais

/*
-- Habilitar RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_logs ENABLE ROW LEVEL SECURITY;

-- SYSTEM_LOGS: Apenas admins podem ver logs do sistema
CREATE POLICY "system_logs_select_policy" ON public.system_logs
  FOR SELECT
  USING (
    public.current_user_is_admin()
  );

CREATE POLICY "system_logs_insert_policy" ON public.system_logs
  FOR INSERT
  WITH CHECK (
    public.current_user_is_admin()
  );

-- Apenas superadmins podem modificar logs do sistema
CREATE POLICY "system_logs_update_policy" ON public.system_logs
  FOR UPDATE
  USING (
    public.current_user_is_superadmin()
  );

CREATE POLICY "system_logs_delete_policy" ON public.system_logs
  FOR DELETE
  USING (
    public.current_user_is_superadmin()
  );

-- AUDIT_LOGS: Apenas admins podem ver logs de auditoria
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
  FOR SELECT
  USING (
    public.current_user_is_admin()
  );

-- Logs de auditoria são apenas para leitura para admins
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
  FOR INSERT
  WITH CHECK (
    public.current_user_is_admin()
  );

-- Apenas superadmins podem modificar logs de auditoria
CREATE POLICY "audit_logs_update_policy" ON public.audit_logs
  FOR UPDATE
  USING (
    public.current_user_is_superadmin()
  );

CREATE POLICY "audit_logs_delete_policy" ON public.audit_logs
  FOR DELETE
  USING (
    public.current_user_is_superadmin()
  );
*/

-- =====================================================
-- 7. POLÍTICAS RLS PARA DADOS DE APLICAÇÃO
-- =====================================================

-- Exemplo para tabelas específicas da aplicação Sofia
-- Descomente e ajuste conforme suas tabelas reais

/*
-- Assumindo tabelas relacionadas ao sistema de trading/apostas
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roulette_spins ENABLE ROW LEVEL SECURITY;

-- STRATEGIES: Usuários veem apenas suas estratégias, admins veem todas
CREATE POLICY "strategies_select_policy" ON public.strategies
  FOR SELECT
  USING (
    user_id = public.get_current_user_id() OR 
    public.current_user_is_admin()
  );

CREATE POLICY "strategies_insert_policy" ON public.strategies
  FOR INSERT
  WITH CHECK (
    user_id = public.get_current_user_id()
  );

CREATE POLICY "strategies_update_policy" ON public.strategies
  FOR UPDATE
  USING (
    user_id = public.get_current_user_id() OR 
    public.current_user_is_admin()
  );

CREATE POLICY "strategies_delete_policy" ON public.strategies
  FOR DELETE
  USING (
    user_id = public.get_current_user_id() OR 
    public.current_user_is_superadmin()
  );

-- GENERATED_SIGNALS: Usuários premium veem sinais, admins veem todos
CREATE POLICY "generated_signals_select_policy" ON public.generated_signals
  FOR SELECT
  USING (
    public.user_is_premium(public.get_current_user_status()) OR
    public.current_user_is_admin()
  );

-- Apenas admins podem inserir sinais
CREATE POLICY "generated_signals_insert_policy" ON public.generated_signals
  FOR INSERT
  WITH CHECK (
    public.current_user_is_admin()
  );

CREATE POLICY "generated_signals_update_policy" ON public.generated_signals
  FOR UPDATE
  USING (
    public.current_user_is_admin()
  );

CREATE POLICY "generated_signals_delete_policy" ON public.generated_signals
  FOR DELETE
  USING (
    public.current_user_is_superadmin()
  );
*/

-- =====================================================
-- 8. POLÍTICAS ESPECIAIS PARA BYPASS DE SUPERADMIN (CRIAÇÃO SEGURA)
-- =====================================================

-- Para user_profiles: Superadmin pode fazer qualquer operação
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles' 
        AND policyname = 'superadmin_bypass_user_profiles'
    ) THEN
        CREATE POLICY "superadmin_bypass_user_profiles" ON public.user_profiles
          FOR ALL
          TO authenticated
          USING (public.current_user_is_superadmin())
          WITH CHECK (public.current_user_is_superadmin());
    END IF;
END $$;

-- Para user_status_changes: Superadmin pode fazer qualquer operação
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_status_changes' 
        AND policyname = 'superadmin_bypass_user_status_changes'
    ) THEN
        CREATE POLICY "superadmin_bypass_user_status_changes" ON public.user_status_changes
          FOR ALL
          TO authenticated
          USING (public.current_user_is_superadmin())
          WITH CHECK (public.current_user_is_superadmin());
    END IF;
END $$;

-- =====================================================
-- 9. CONFIGURAÇÕES DE SEGURANÇA ADICIONAIS
-- =====================================================

-- Garantir que apenas usuários autenticados possam acessar as tabelas
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_status_changes FORCE ROW LEVEL SECURITY;

-- Revogar permissões públicas e conceder apenas para authenticated
REVOKE ALL ON public.user_profiles FROM PUBLIC;
REVOKE ALL ON public.user_status_changes FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_status_changes TO authenticated;

-- =====================================================
-- 10. FUNÇÕES PARA TESTE E VALIDAÇÃO
-- =====================================================

-- Função para testar as políticas RLS
CREATE OR REPLACE FUNCTION public.test_rls_policies(test_user_id uuid)
RETURNS TABLE(
  test_name text,
  result boolean,
  message text
) AS $$
BEGIN
  -- Configurar o usuário de teste
  PERFORM set_config('app.current_user_id', test_user_id::text, true);
  
  -- Teste 1: Usuário pode ver seu próprio perfil
  RETURN QUERY
  SELECT 
    'user_can_see_own_profile'::text,
    EXISTS(SELECT 1 FROM public.user_profiles WHERE user_id = test_user_id),
    'Usuário deve conseguir ver seu próprio perfil'::text;
  
  -- Teste 2: Usuário não pode ver perfis de outros (se não for admin)
  RETURN QUERY
  SELECT 
    'user_cannot_see_others_profiles'::text,
    NOT EXISTS(
      SELECT 1 FROM public.user_profiles 
      WHERE user_id != test_user_id 
      AND NOT public.current_user_is_admin()
    ),
    'Usuário comum não deve ver perfis de outros'::text;
    
  -- Limpar configuração
  PERFORM set_config('app.current_user_id', '', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION public.get_current_user_id() IS 'Retorna o ID do usuário autenticado atual';
COMMENT ON FUNCTION public.get_current_user_status() IS 'Retorna o status do usuário autenticado atual';
COMMENT ON FUNCTION public.current_user_is_admin() IS 'Verifica se o usuário atual é admin ou superadmin';
COMMENT ON FUNCTION public.current_user_is_superadmin() IS 'Verifica se o usuário atual é superadmin';
COMMENT ON FUNCTION public.test_rls_policies(uuid) IS 'Função para testar as políticas RLS implementadas';

-- =====================================================
-- 12. EXEMPLOS DE USO E TESTES
-- =====================================================

/*
-- Para testar as políticas RLS:

-- 1. Conectar como um usuário específico
SELECT set_config('app.current_user_id', 'uuid-do-usuario', true);

-- 2. Testar consultas
SELECT * FROM public.user_profiles; -- Deve retornar apenas o perfil do usuário

-- 3. Testar como admin
-- Primeiro, promover um usuário para admin
UPDATE public.user_profiles SET account_status = 'admin' WHERE user_id = 'uuid-do-admin';

-- Conectar como admin
SELECT set_config('app.current_user_id', 'uuid-do-admin', true);

-- Testar consultas de admin
SELECT * FROM public.user_profiles; -- Deve retornar todos os perfis

-- 4. Executar testes automatizados
SELECT * FROM public.test_rls_policies('uuid-do-usuario');

-- 5. Verificar políticas ativas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
*/