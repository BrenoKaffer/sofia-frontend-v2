-- =====================================================
-- POLÍTICAS RLS ABRANGENTES PARA TODAS AS TABELAS
-- =====================================================

-- Este script cria políticas RLS para todas as tabelas que precisam de restrições
-- baseadas no sistema de usuários e hierarquia de acesso

-- =====================================================
-- FUNÇÕES AUXILIARES (se não existirem)
-- =====================================================

-- Função para obter ID do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid AS $$
BEGIN
  RETURN COALESCE(
    (current_setting('app.current_user_id', true))::uuid,
    auth.uid()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter status do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_user_status()
RETURNS public.account_status_enum AS $$
DECLARE
  user_status public.account_status_enum;
BEGIN
  SELECT account_status INTO user_status
  FROM public.user_profiles
  WHERE user_id = public.get_current_user_id();
  
  RETURN COALESCE(user_status, 'free'::public.account_status_enum);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'free'::public.account_status_enum;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_current_user_status() IN ('admin', 'superadmin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é superadmin
CREATE OR REPLACE FUNCTION public.current_user_is_superadmin()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_current_user_status() = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HABILITAR RLS NAS TABELAS
-- =====================================================

-- Habilitar RLS nas tabelas de pagamento
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    IF NOT (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
      ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
    IF NOT (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
      ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coupons') THEN
    IF NOT (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coupons') THEN
      ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coupon_usages') THEN
    IF NOT (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coupon_usages') THEN
      ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_methods') THEN
    IF NOT (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_methods') THEN
      ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_webhooks') THEN
    IF NOT (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_webhooks') THEN
      ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;
    END IF;
  END IF;
END $$;

-- =====================================================
-- POLÍTICAS RLS PARA TRANSACTIONS
-- =====================================================

-- SELECT: Usuários veem apenas suas próprias transações, admins veem todas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'transactions_select_policy') THEN
    CREATE POLICY transactions_select_policy ON public.transactions
    FOR SELECT
    USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;
END $$;

-- INSERT: Usuários podem criar transações para si mesmos, admins para qualquer um
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'transactions_insert_policy') THEN
    CREATE POLICY transactions_insert_policy ON public.transactions
    FOR INSERT
    WITH CHECK (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;
END $$;

-- UPDATE: Apenas admins podem atualizar transações
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'transactions_update_policy') THEN
    CREATE POLICY transactions_update_policy ON public.transactions
    FOR UPDATE
    USING (public.current_user_is_admin());
  END IF;
END $$;

-- DELETE: Apenas superadmins podem deletar transações
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'transactions_delete_policy') THEN
    CREATE POLICY transactions_delete_policy ON public.transactions
    FOR DELETE
    USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- =====================================================
-- POLÍTICAS RLS PARA SUBSCRIPTIONS
-- =====================================================

-- SELECT: Usuários veem apenas suas próprias assinaturas, admins veem todas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'subscriptions_select_policy') THEN
    CREATE POLICY subscriptions_select_policy ON public.subscriptions
    FOR SELECT
    USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;
END $$;

-- INSERT: Usuários podem criar assinaturas para si mesmos, admins para qualquer um
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'subscriptions_insert_policy') THEN
    CREATE POLICY subscriptions_insert_policy ON public.subscriptions
    FOR INSERT
    WITH CHECK (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;
END $$;

-- UPDATE: Usuários podem atualizar suas próprias assinaturas, admins todas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'subscriptions_update_policy') THEN
    CREATE POLICY subscriptions_update_policy ON public.subscriptions
    FOR UPDATE
    USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;
END $$;

-- DELETE: Apenas superadmins podem deletar assinaturas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'subscriptions_delete_policy') THEN
    CREATE POLICY subscriptions_delete_policy ON public.subscriptions
    FOR DELETE
    USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- =====================================================
-- POLÍTICAS RLS PARA COUPONS
-- =====================================================

-- SELECT: Todos podem ver cupons ativos, admins veem todos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coupons' AND policyname = 'coupons_select_policy') THEN
    CREATE POLICY coupons_select_policy ON public.coupons
    FOR SELECT
    USING (
      is_active = true OR 
      public.current_user_is_admin()
    );
  END IF;
END $$;

-- INSERT: Apenas admins podem criar cupons
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coupons' AND policyname = 'coupons_insert_policy') THEN
    CREATE POLICY coupons_insert_policy ON public.coupons
    FOR INSERT
    WITH CHECK (public.current_user_is_admin());
  END IF;
END $$;

-- UPDATE: Apenas admins podem atualizar cupons
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coupons' AND policyname = 'coupons_update_policy') THEN
    CREATE POLICY coupons_update_policy ON public.coupons
    FOR UPDATE
    USING (public.current_user_is_admin());
  END IF;
END $$;

-- DELETE: Apenas superadmins podem deletar cupons
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coupons' AND policyname = 'coupons_delete_policy') THEN
    CREATE POLICY coupons_delete_policy ON public.coupons
    FOR DELETE
    USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- =====================================================
-- POLÍTICAS RLS PARA COUPON_USAGES
-- =====================================================

-- SELECT: Usuários veem apenas seus próprios usos, admins veem todos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coupon_usages' AND policyname = 'coupon_usages_select_policy') THEN
    CREATE POLICY coupon_usages_select_policy ON public.coupon_usages
    FOR SELECT
    USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;
END $$;

-- INSERT: Usuários podem registrar uso para si mesmos, admins para qualquer um
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coupon_usages' AND policyname = 'coupon_usages_insert_policy') THEN
    CREATE POLICY coupon_usages_insert_policy ON public.coupon_usages
    FOR INSERT
    WITH CHECK (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;
END $$;

-- UPDATE: Apenas admins podem atualizar usos de cupons
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coupon_usages' AND policyname = 'coupon_usages_update_policy') THEN
    CREATE POLICY coupon_usages_update_policy ON public.coupon_usages
    FOR UPDATE
    USING (public.current_user_is_admin());
  END IF;
END $$;

-- DELETE: Apenas superadmins podem deletar usos de cupons
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coupon_usages' AND policyname = 'coupon_usages_delete_policy') THEN
    CREATE POLICY coupon_usages_delete_policy ON public.coupon_usages
    FOR DELETE
    USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- =====================================================
-- POLÍTICAS RLS PARA PAYMENT_METHODS
-- =====================================================

-- SELECT: Usuários veem apenas seus próprios métodos, admins veem todos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_methods' AND policyname = 'payment_methods_select_policy') THEN
    CREATE POLICY payment_methods_select_policy ON public.payment_methods
    FOR SELECT
    USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;
END $$;

-- INSERT: Usuários podem criar métodos para si mesmos, admins para qualquer um
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_methods' AND policyname = 'payment_methods_insert_policy') THEN
    CREATE POLICY payment_methods_insert_policy ON public.payment_methods
    FOR INSERT
    WITH CHECK (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;
END $$;

-- UPDATE: Usuários podem atualizar seus próprios métodos, admins todos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_methods' AND policyname = 'payment_methods_update_policy') THEN
    CREATE POLICY payment_methods_update_policy ON public.payment_methods
    FOR UPDATE
    USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;
END $$;

-- DELETE: Usuários podem deletar seus próprios métodos, admins todos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_methods' AND policyname = 'payment_methods_delete_policy') THEN
    CREATE POLICY payment_methods_delete_policy ON public.payment_methods
    FOR DELETE
    USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;
END $$;

-- =====================================================
-- POLÍTICAS RLS PARA PAYMENT_WEBHOOKS
-- =====================================================

-- SELECT: Apenas admins podem ver webhooks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_webhooks' AND policyname = 'payment_webhooks_select_policy') THEN
    CREATE POLICY payment_webhooks_select_policy ON public.payment_webhooks
    FOR SELECT
    USING (public.current_user_is_admin());
  END IF;
END $$;

-- INSERT: Apenas sistema pode inserir webhooks (sem restrição para permitir webhooks externos)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_webhooks' AND policyname = 'payment_webhooks_insert_policy') THEN
    CREATE POLICY payment_webhooks_insert_policy ON public.payment_webhooks
    FOR INSERT
    WITH CHECK (true); -- Permite inserção para webhooks externos
  END IF;
END $$;

-- UPDATE: Apenas admins podem atualizar webhooks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_webhooks' AND policyname = 'payment_webhooks_update_policy') THEN
    CREATE POLICY payment_webhooks_update_policy ON public.payment_webhooks
    FOR UPDATE
    USING (public.current_user_is_admin());
  END IF;
END $$;

-- DELETE: Apenas superadmins podem deletar webhooks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_webhooks' AND policyname = 'payment_webhooks_delete_policy') THEN
    CREATE POLICY payment_webhooks_delete_policy ON public.payment_webhooks
    FOR DELETE
    USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- =====================================================
-- POLÍTICAS ESPECIAIS PARA VIEWS (se existirem como tabelas)
-- =====================================================

-- As views (active_users, blocked_users, etc.) são baseadas em user_profiles
-- que já tem RLS, então herdam as restrições automaticamente

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION public.get_current_user_id IS 'Obtém o ID do usuário atual do contexto da aplicação ou auth.uid()';
COMMENT ON FUNCTION public.get_current_user_status IS 'Obtém o status do usuário atual';
COMMENT ON FUNCTION public.current_user_is_admin IS 'Verifica se o usuário atual é admin ou superadmin';
COMMENT ON FUNCTION public.current_user_is_superadmin IS 'Verifica se o usuário atual é superadmin';

-- =====================================================
-- RESUMO DAS POLÍTICAS CRIADAS
-- =====================================================

/*
RESUMO DAS POLÍTICAS RLS CRIADAS:

1. TRANSACTIONS (4 políticas)
   - SELECT: Usuários veem suas transações, admins veem todas
   - INSERT: Usuários criam para si, admins para qualquer um
   - UPDATE: Apenas admins
   - DELETE: Apenas superadmins

2. SUBSCRIPTIONS (4 políticas)
   - SELECT: Usuários veem suas assinaturas, admins veem todas
   - INSERT: Usuários criam para si, admins para qualquer um
   - UPDATE: Usuários atualizam suas, admins todas
   - DELETE: Apenas superadmins

3. COUPONS (4 políticas)
   - SELECT: Todos veem cupons ativos, admins veem todos
   - INSERT: Apenas admins
   - UPDATE: Apenas admins
   - DELETE: Apenas superadmins

4. COUPON_USAGES (4 políticas)
   - SELECT: Usuários veem seus usos, admins veem todos
   - INSERT: Usuários registram para si, admins para qualquer um
   - UPDATE: Apenas admins
   - DELETE: Apenas superadmins

5. PAYMENT_METHODS (4 políticas)
   - SELECT: Usuários veem seus métodos, admins veem todos
   - INSERT: Usuários criam para si, admins para qualquer um
   - UPDATE: Usuários atualizam seus, admins todos
   - DELETE: Usuários deletam seus, admins todos

6. PAYMENT_WEBHOOKS (4 políticas)
   - SELECT: Apenas admins
   - INSERT: Sem restrição (para webhooks externos)
   - UPDATE: Apenas admins
   - DELETE: Apenas superadmins

TOTAL: 24 políticas RLS criadas
*/