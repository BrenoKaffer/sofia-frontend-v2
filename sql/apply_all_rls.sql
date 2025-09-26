-- =====================================================
-- SCRIPT PARA APLICAR TODAS AS POLÍTICAS RLS
-- =====================================================

-- Este script aplica todas as políticas RLS de forma segura
-- Execute este script completo no seu cliente SQL (Supabase, pgAdmin, etc.)

-- =====================================================
-- INICIANDO APLICAÇÃO DAS POLÍTICAS RLS
-- =====================================================

-- =====================================================
-- 1. POLÍTICAS BÁSICAS (user_profiles e user_status_changes)
-- =====================================================

-- Habilitar RLS nas tabelas básicas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_status_changes ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
DO $$ 
BEGIN
    -- SELECT: Usuários podem ver apenas seu próprio perfil, admins veem todos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_select_policy') THEN
        CREATE POLICY user_profiles_select_policy ON user_profiles
        FOR SELECT USING (
            auth.uid() = id OR 
            EXISTS (
                SELECT 1 FROM user_profiles up 
                WHERE up.id = auth.uid() 
                AND up.user_status IN ('admin', 'superadmin')
            )
        );
    END IF;

    -- INSERT: Apenas durante registro (sem restrições específicas por enquanto)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_insert_policy') THEN
        CREATE POLICY user_profiles_insert_policy ON user_profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;

    -- UPDATE: Usuários podem atualizar apenas seu próprio perfil, admins podem atualizar qualquer um
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_update_policy') THEN
        CREATE POLICY user_profiles_update_policy ON user_profiles
        FOR UPDATE USING (
            auth.uid() = id OR 
            EXISTS (
                SELECT 1 FROM user_profiles up 
                WHERE up.id = auth.uid() 
                AND up.user_status IN ('admin', 'superadmin')
            )
        );
    END IF;

    -- DELETE: Apenas superadmins podem deletar perfis
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_delete_policy') THEN
        CREATE POLICY user_profiles_delete_policy ON user_profiles
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM user_profiles up 
                WHERE up.id = auth.uid() 
                AND up.user_status = 'superadmin'
            )
        );
    END IF;
 END $$;

-- =====================================================
-- 2. POLÍTICAS ABRANGENTES (TABELAS DE PAGAMENTO)
-- =====================================================

-- =====================================================
-- FUNÇÕES AUXILIARES (se não existirem)
-- =====================================================

-- Função para obter ID do usuário atual
DROP FUNCTION IF EXISTS public.get_current_user_id();
CREATE FUNCTION public.get_current_user_id()
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
DROP FUNCTION IF EXISTS public.get_current_user_status();
CREATE FUNCTION public.get_current_user_status()
RETURNS text AS $$
DECLARE
  user_status text;
BEGIN
  SELECT user_status INTO user_status
  FROM public.user_profiles
  WHERE id = public.get_current_user_id();
  
  RETURN COALESCE(user_status, 'free');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'free';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é admin
DROP FUNCTION IF EXISTS public.current_user_is_admin();
CREATE FUNCTION public.current_user_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_current_user_status() IN ('admin', 'superadmin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é superadmin
DROP FUNCTION IF EXISTS public.current_user_is_superadmin();
CREATE FUNCTION public.current_user_is_superadmin()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_current_user_status() = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HABILITAR RLS NAS TABELAS DE PAGAMENTO
-- =====================================================

-- Habilitar RLS nas tabelas de pagamento (se existirem)
DO $$
BEGIN
  -- transactions
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- subscriptions
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
    ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- coupons
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coupons') THEN
    ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- coupon_usages
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coupon_usages') THEN
    ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- payment_methods
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_methods') THEN
    ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- payment_webhooks
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_webhooks') THEN
    ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =====================================================
-- POLÍTICAS RLS PARA TRANSACTIONS
-- =====================================================

DO $$
BEGIN
  -- SELECT: Usuários veem apenas suas próprias transações, admins veem todas
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'transactions_select_policy') THEN
    CREATE POLICY transactions_select_policy ON public.transactions
    FOR SELECT USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;

  -- INSERT: Usuários podem criar transações para si mesmos, admins para qualquer um
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'transactions_insert_policy') THEN
    CREATE POLICY transactions_insert_policy ON public.transactions
    FOR INSERT WITH CHECK (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;

  -- UPDATE: Apenas admins podem atualizar transações
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'transactions_update_policy') THEN
    CREATE POLICY transactions_update_policy ON public.transactions
    FOR UPDATE USING (public.current_user_is_admin());
  END IF;

  -- DELETE: Apenas superadmins podem deletar transações
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'transactions_delete_policy') THEN
    CREATE POLICY transactions_delete_policy ON public.transactions
    FOR DELETE USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- =====================================================
-- POLÍTICAS RLS PARA SUBSCRIPTIONS
-- =====================================================

DO $$
BEGIN
  -- SELECT: Usuários veem apenas suas próprias assinaturas, admins veem todas
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'subscriptions_select_policy') THEN
    CREATE POLICY subscriptions_select_policy ON public.subscriptions
    FOR SELECT USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;

  -- INSERT: Usuários podem criar assinaturas para si mesmos, admins para qualquer um
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'subscriptions_insert_policy') THEN
    CREATE POLICY subscriptions_insert_policy ON public.subscriptions
    FOR INSERT WITH CHECK (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;

  -- UPDATE: Usuários podem atualizar suas próprias assinaturas, admins podem atualizar qualquer uma
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'subscriptions_update_policy') THEN
    CREATE POLICY subscriptions_update_policy ON public.subscriptions
    FOR UPDATE USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;

  -- DELETE: Apenas superadmins podem deletar assinaturas
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'subscriptions_delete_policy') THEN
    CREATE POLICY subscriptions_delete_policy ON public.subscriptions
    FOR DELETE USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- =====================================================
-- POLÍTICAS RLS PARA COUPONS
-- =====================================================

DO $$
BEGIN
  -- SELECT: Todos podem ver cupons ativos, admins veem todos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'coupons_select_policy') THEN
    CREATE POLICY coupons_select_policy ON public.coupons
    FOR SELECT USING (
      (is_active = true AND expires_at > NOW()) OR 
      public.current_user_is_admin()
    );
  END IF;

  -- INSERT: Apenas admins podem criar cupons
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'coupons_insert_policy') THEN
    CREATE POLICY coupons_insert_policy ON public.coupons
    FOR INSERT WITH CHECK (public.current_user_is_admin());
  END IF;

  -- UPDATE: Apenas admins podem atualizar cupons
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'coupons_update_policy') THEN
    CREATE POLICY coupons_update_policy ON public.coupons
    FOR UPDATE USING (public.current_user_is_admin());
  END IF;

  -- DELETE: Apenas superadmins podem deletar cupons
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'coupons_delete_policy') THEN
    CREATE POLICY coupons_delete_policy ON public.coupons
    FOR DELETE USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- =====================================================
-- POLÍTICAS RLS PARA COUPON_USAGES
-- =====================================================

DO $$
BEGIN
  -- SELECT: Usuários veem apenas seus próprios usos, admins veem todos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupon_usages' AND policyname = 'coupon_usages_select_policy') THEN
    CREATE POLICY coupon_usages_select_policy ON public.coupon_usages
    FOR SELECT USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;

  -- INSERT: Usuários podem registrar uso para si mesmos, admins para qualquer um
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupon_usages' AND policyname = 'coupon_usages_insert_policy') THEN
    CREATE POLICY coupon_usages_insert_policy ON public.coupon_usages
    FOR INSERT WITH CHECK (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;

  -- UPDATE: Apenas admins podem atualizar usos de cupons
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupon_usages' AND policyname = 'coupon_usages_update_policy') THEN
    CREATE POLICY coupon_usages_update_policy ON public.coupon_usages
    FOR UPDATE USING (public.current_user_is_admin());
  END IF;

  -- DELETE: Apenas superadmins podem deletar usos de cupons
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupon_usages' AND policyname = 'coupon_usages_delete_policy') THEN
    CREATE POLICY coupon_usages_delete_policy ON public.coupon_usages
    FOR DELETE USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- =====================================================
-- POLÍTICAS RLS PARA PAYMENT_METHODS
-- =====================================================

DO $$
BEGIN
  -- SELECT: Usuários veem apenas seus próprios métodos, admins veem todos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_methods' AND policyname = 'payment_methods_select_policy') THEN
    CREATE POLICY payment_methods_select_policy ON public.payment_methods
    FOR SELECT USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;

  -- INSERT: Usuários podem criar métodos para si mesmos, admins para qualquer um
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_methods' AND policyname = 'payment_methods_insert_policy') THEN
    CREATE POLICY payment_methods_insert_policy ON public.payment_methods
    FOR INSERT WITH CHECK (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;

  -- UPDATE: Usuários podem atualizar seus próprios métodos, admins podem atualizar qualquer um
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_methods' AND policyname = 'payment_methods_update_policy') THEN
    CREATE POLICY payment_methods_update_policy ON public.payment_methods
    FOR UPDATE USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;

  -- DELETE: Usuários podem deletar seus próprios métodos, admins podem deletar qualquer um
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_methods' AND policyname = 'payment_methods_delete_policy') THEN
    CREATE POLICY payment_methods_delete_policy ON public.payment_methods
    FOR DELETE USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;
END $$;

-- =====================================================
-- POLÍTICAS RLS PARA PAYMENT_WEBHOOKS
-- =====================================================

DO $$
BEGIN
  -- SELECT: Apenas admins podem ver webhooks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_webhooks' AND policyname = 'payment_webhooks_select_policy') THEN
    CREATE POLICY payment_webhooks_select_policy ON public.payment_webhooks
    FOR SELECT USING (public.current_user_is_admin());
  END IF;

  -- INSERT: Apenas sistema pode inserir webhooks (sem restrições específicas)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_webhooks' AND policyname = 'payment_webhooks_insert_policy') THEN
    CREATE POLICY payment_webhooks_insert_policy ON public.payment_webhooks
    FOR INSERT WITH CHECK (true); -- Webhooks são inseridos pelo sistema
  END IF;

  -- UPDATE: Apenas admins podem atualizar webhooks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_webhooks' AND policyname = 'payment_webhooks_update_policy') THEN
    CREATE POLICY payment_webhooks_update_policy ON public.payment_webhooks
    FOR UPDATE USING (public.current_user_is_admin());
  END IF;

  -- DELETE: Apenas superadmins podem deletar webhooks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_webhooks' AND policyname = 'payment_webhooks_delete_policy') THEN
    CREATE POLICY payment_webhooks_delete_policy ON public.payment_webhooks
    FOR DELETE USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- =====================================================
-- 3. VERIFICAÇÃO DAS POLÍTICAS APLICADAS
-- =====================================================

-- Verificar se RLS está habilitado nas tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'user_profiles', 'user_status_changes', 'transactions', 
    'subscriptions', 'coupons', 'coupon_usages', 
    'payment_methods', 'payment_webhooks'
)
ORDER BY tablename;

-- Contar políticas criadas por tabela
SELECT 
    schemaname,
    tablename,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'user_profiles', 'user_status_changes', 'transactions', 
    'subscriptions', 'coupons', 'coupon_usages', 
    'payment_methods', 'payment_webhooks'
)
GROUP BY schemaname, tablename
ORDER BY tablename;

-- =====================================================
-- RESUMO
-- =====================================================
-- 
-- ✅ POLÍTICAS CRIADAS:
-- 
-- 📋 TABELAS BÁSICAS:
-- • user_profiles (4 políticas)
-- • user_status_changes (4 políticas)
-- 
-- 💳 TABELAS DE PAGAMENTO:
-- • transactions (4 políticas)
-- • subscriptions (4 políticas)
-- • coupons (4 políticas)
-- • coupon_usages (4 políticas)
-- • payment_methods (4 políticas)
-- • payment_webhooks (4 políticas)
-- 
-- 🔐 HIERARQUIA DE ACESSO:
-- • SUPERADMIN: Acesso total (SELECT, INSERT, UPDATE, DELETE)
-- • ADMIN: Gerencia usuários, transações, cupons
-- • USUÁRIO: Apenas seus próprios dados
-- 
-- 📊 TOTAL: 32 políticas RLS criadas
-- 
-- =====================================================

-- Políticas para user_status_changes
DO $$ 
BEGIN
    -- SELECT: Usuários podem ver apenas suas próprias mudanças, admins veem todas
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_status_changes' AND policyname = 'user_status_changes_select_policy') THEN
        CREATE POLICY user_status_changes_select_policy ON user_status_changes
        FOR SELECT USING (
            user_id = auth.uid() OR 
            EXISTS (
                SELECT 1 FROM user_profiles up 
                WHERE up.id = auth.uid() 
                AND up.user_status IN ('admin', 'superadmin')
            )
        );
    END IF;

    -- INSERT: Apenas admins podem inserir mudanças de status
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_status_changes' AND policyname = 'user_status_changes_insert_policy') THEN
        CREATE POLICY user_status_changes_insert_policy ON user_status_changes
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM user_profiles up 
                WHERE up.id = auth.uid() 
                AND up.user_status IN ('admin', 'superadmin')
            )
        );
    END IF;

    -- UPDATE: Apenas admins podem atualizar mudanças de status
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_status_changes' AND policyname = 'user_status_changes_update_policy') THEN
        CREATE POLICY user_status_changes_update_policy ON user_status_changes
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM user_profiles up 
                WHERE up.id = auth.uid() 
                AND up.user_status IN ('admin', 'superadmin')
            )
        );
    END IF;

    -- DELETE: Apenas superadmins podem deletar mudanças de status
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_status_changes' AND policyname = 'user_status_changes_delete_policy') THEN
        CREATE POLICY user_status_changes_delete_policy ON user_status_changes
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM user_profiles up 
                WHERE up.id = auth.uid() 
                AND up.user_status = 'superadmin'
            )
        );
    END IF;
END $$;