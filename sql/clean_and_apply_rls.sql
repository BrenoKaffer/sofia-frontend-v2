-- =====================================================
-- SCRIPT PARA LIMPAR E APLICAR POLÍTICAS RLS
-- =====================================================

-- Este script remove todas as políticas RLS existentes e suas dependências
-- e depois aplica as políticas corretas

-- =====================================================
-- 1. REMOVER POLÍTICAS RLS EXISTENTES
-- =====================================================

-- Remover políticas de user_profiles
DROP POLICY IF EXISTS user_profiles_select_policy ON user_profiles;
DROP POLICY IF EXISTS user_profiles_insert_policy ON user_profiles;
DROP POLICY IF EXISTS user_profiles_update_policy ON user_profiles;
DROP POLICY IF EXISTS user_profiles_delete_policy ON user_profiles;

-- Remover políticas de user_status_changes
DROP POLICY IF EXISTS user_status_changes_select_policy ON user_status_changes;
DROP POLICY IF EXISTS user_status_changes_insert_policy ON user_status_changes;
DROP POLICY IF EXISTS user_status_changes_update_policy ON user_status_changes;
DROP POLICY IF EXISTS user_status_changes_delete_policy ON user_status_changes;

-- Remover políticas de transactions (se existirem)
DROP POLICY IF EXISTS transactions_select_policy ON transactions;
DROP POLICY IF EXISTS transactions_insert_policy ON transactions;
DROP POLICY IF EXISTS transactions_update_policy ON transactions;
DROP POLICY IF EXISTS transactions_delete_policy ON transactions;

-- Remover políticas de subscriptions (se existirem)
DROP POLICY IF EXISTS subscriptions_select_policy ON subscriptions;
DROP POLICY IF EXISTS subscriptions_insert_policy ON subscriptions;
DROP POLICY IF EXISTS subscriptions_update_policy ON subscriptions;
DROP POLICY IF EXISTS subscriptions_delete_policy ON subscriptions;

-- Remover políticas de coupons (se existirem)
DROP POLICY IF EXISTS coupons_select_policy ON coupons;
DROP POLICY IF EXISTS coupons_insert_policy ON coupons;
DROP POLICY IF EXISTS coupons_update_policy ON coupons;
DROP POLICY IF EXISTS coupons_delete_policy ON coupons;

-- Remover políticas de coupon_usages (se existirem)
DROP POLICY IF EXISTS coupon_usages_select_policy ON coupon_usages;
DROP POLICY IF EXISTS coupon_usages_insert_policy ON coupon_usages;
DROP POLICY IF EXISTS coupon_usages_update_policy ON coupon_usages;
DROP POLICY IF EXISTS coupon_usages_delete_policy ON coupon_usages;

-- Remover políticas de payment_methods (se existirem)
DROP POLICY IF EXISTS payment_methods_select_policy ON payment_methods;
DROP POLICY IF EXISTS payment_methods_insert_policy ON payment_methods;
DROP POLICY IF EXISTS payment_methods_update_policy ON payment_methods;
DROP POLICY IF EXISTS payment_methods_delete_policy ON payment_methods;

-- Remover políticas de payment_webhooks (se existirem)
DROP POLICY IF EXISTS payment_webhooks_select_policy ON payment_webhooks;
DROP POLICY IF EXISTS payment_webhooks_insert_policy ON payment_webhooks;
DROP POLICY IF EXISTS payment_webhooks_update_policy ON payment_webhooks;
DROP POLICY IF EXISTS payment_webhooks_delete_policy ON payment_webhooks;

-- =====================================================
-- 2. REMOVER FUNÇÕES AUXILIARES COM CASCADE
-- =====================================================

DROP FUNCTION IF EXISTS public.get_current_user_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_status() CASCADE;
DROP FUNCTION IF EXISTS public.current_user_is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.current_user_is_superadmin() CASCADE;

-- =====================================================
-- 3. RECRIAR FUNÇÕES AUXILIARES
-- =====================================================

-- Função para obter ID do usuário atual
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
CREATE FUNCTION public.get_current_user_status()
RETURNS text AS $$
DECLARE
  user_status text;
BEGIN
  SELECT up.user_status INTO user_status
  FROM public.user_profiles up
  WHERE up.id = public.get_current_user_id();
  
  RETURN COALESCE(user_status, 'free');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'free';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é admin
CREATE FUNCTION public.current_user_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_current_user_status() IN ('admin', 'superadmin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é superadmin
CREATE FUNCTION public.current_user_is_superadmin()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_current_user_status() = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. HABILITAR RLS NAS TABELAS
-- =====================================================

-- Habilitar RLS nas tabelas básicas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_status_changes ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS nas tabelas de pagamento (se existirem)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
    ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coupons') THEN
    ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coupon_usages') THEN
    ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_methods') THEN
    ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_webhooks') THEN
    ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =====================================================
-- 5. CRIAR POLÍTICAS RLS PARA USER_PROFILES
-- =====================================================

-- SELECT: Usuários podem ver apenas seu próprio perfil, admins veem todos
CREATE POLICY user_profiles_select_policy ON user_profiles
FOR SELECT USING (
    auth.uid() = id OR 
    public.current_user_is_admin()
);

-- INSERT: Apenas durante registro
CREATE POLICY user_profiles_insert_policy ON user_profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE: Usuários podem atualizar apenas seu próprio perfil, admins podem atualizar qualquer um
CREATE POLICY user_profiles_update_policy ON user_profiles
FOR UPDATE USING (
    auth.uid() = id OR 
    public.current_user_is_admin()
);

-- DELETE: Apenas superadmins podem deletar perfis
CREATE POLICY user_profiles_delete_policy ON user_profiles
FOR DELETE USING (public.current_user_is_superadmin());

-- =====================================================
-- 6. CRIAR POLÍTICAS RLS PARA USER_STATUS_CHANGES
-- =====================================================

-- SELECT: Usuários podem ver apenas suas próprias mudanças, admins veem todas
CREATE POLICY user_status_changes_select_policy ON user_status_changes
FOR SELECT USING (
    user_id = auth.uid() OR 
    public.current_user_is_admin()
);

-- INSERT: Apenas admins podem inserir mudanças de status
CREATE POLICY user_status_changes_insert_policy ON user_status_changes
FOR INSERT WITH CHECK (public.current_user_is_admin());

-- UPDATE: Apenas admins podem atualizar mudanças de status
CREATE POLICY user_status_changes_update_policy ON user_status_changes
FOR UPDATE USING (public.current_user_is_admin());

-- DELETE: Apenas superadmins podem deletar mudanças de status
CREATE POLICY user_status_changes_delete_policy ON user_status_changes
FOR DELETE USING (public.current_user_is_superadmin());

-- =====================================================
-- 7. CRIAR POLÍTICAS RLS PARA TRANSACTIONS
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    -- SELECT: Usuários veem apenas suas próprias transações, admins veem todas
    CREATE POLICY transactions_select_policy ON public.transactions
    FOR SELECT USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );

    -- INSERT: Usuários podem criar transações para si mesmos, admins para qualquer um
    CREATE POLICY transactions_insert_policy ON public.transactions
    FOR INSERT WITH CHECK (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );

    -- UPDATE: Apenas admins podem atualizar transações
    CREATE POLICY transactions_update_policy ON public.transactions
    FOR UPDATE USING (public.current_user_is_admin());

    -- DELETE: Apenas superadmins podem deletar transações
    CREATE POLICY transactions_delete_policy ON public.transactions
    FOR DELETE USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- =====================================================
-- 8. CRIAR POLÍTICAS RLS PARA SUBSCRIPTIONS
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
    -- SELECT: Usuários veem apenas suas próprias assinaturas, admins veem todas
    CREATE POLICY subscriptions_select_policy ON public.subscriptions
    FOR SELECT USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );

    -- INSERT: Usuários podem criar assinaturas para si mesmos, admins para qualquer um
    CREATE POLICY subscriptions_insert_policy ON public.subscriptions
    FOR INSERT WITH CHECK (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );

    -- UPDATE: Usuários podem atualizar suas próprias assinaturas, admins podem atualizar qualquer uma
    CREATE POLICY subscriptions_update_policy ON public.subscriptions
    FOR UPDATE USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );

    -- DELETE: Apenas superadmins podem deletar assinaturas
    CREATE POLICY subscriptions_delete_policy ON public.subscriptions
    FOR DELETE USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- =====================================================
-- 9. CRIAR POLÍTICAS RLS PARA COUPONS
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coupons') THEN
    -- SELECT: Todos podem ver cupons ativos, admins veem todos
    CREATE POLICY coupons_select_policy ON public.coupons
    FOR SELECT USING (
      (is_active = true AND expires_at > NOW()) OR 
      public.current_user_is_admin()
    );

    -- INSERT: Apenas admins podem criar cupons
    CREATE POLICY coupons_insert_policy ON public.coupons
    FOR INSERT WITH CHECK (public.current_user_is_admin());

    -- UPDATE: Apenas admins podem atualizar cupons
    CREATE POLICY coupons_update_policy ON public.coupons
    FOR UPDATE USING (public.current_user_is_admin());

    -- DELETE: Apenas superadmins podem deletar cupons
    CREATE POLICY coupons_delete_policy ON public.coupons
    FOR DELETE USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- =====================================================
-- 10. CRIAR POLÍTICAS RLS PARA COUPON_USAGES
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coupon_usages') THEN
    -- SELECT: Usuários veem apenas seus próprios usos, admins veem todos
    CREATE POLICY coupon_usages_select_policy ON public.coupon_usages
    FOR SELECT USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );

    -- INSERT: Usuários podem registrar uso para si mesmos, admins para qualquer um
    CREATE POLICY coupon_usages_insert_policy ON public.coupon_usages
    FOR INSERT WITH CHECK (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );

    -- UPDATE: Apenas admins podem atualizar usos de cupons
    CREATE POLICY coupon_usages_update_policy ON public.coupon_usages
    FOR UPDATE USING (public.current_user_is_admin());

    -- DELETE: Apenas superadmins podem deletar usos de cupons
    CREATE POLICY coupon_usages_delete_policy ON public.coupon_usages
    FOR DELETE USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- =====================================================
-- 11. CRIAR POLÍTICAS RLS PARA PAYMENT_METHODS
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_methods') THEN
    -- SELECT: Usuários veem apenas seus próprios métodos, admins veem todos
    CREATE POLICY payment_methods_select_policy ON public.payment_methods
    FOR SELECT USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );

    -- INSERT: Usuários podem criar métodos para si mesmos, admins para qualquer um
    CREATE POLICY payment_methods_insert_policy ON public.payment_methods
    FOR INSERT WITH CHECK (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );

    -- UPDATE: Usuários podem atualizar seus próprios métodos, admins podem atualizar qualquer um
    CREATE POLICY payment_methods_update_policy ON public.payment_methods
    FOR UPDATE USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );

    -- DELETE: Usuários podem deletar seus próprios métodos, admins podem deletar qualquer um
    CREATE POLICY payment_methods_delete_policy ON public.payment_methods
    FOR DELETE USING (
      user_id = public.get_current_user_id() OR 
      public.current_user_is_admin()
    );
  END IF;
END $$;

-- =====================================================
-- 12. CRIAR POLÍTICAS RLS PARA PAYMENT_WEBHOOKS
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_webhooks') THEN
    -- SELECT: Apenas admins podem ver webhooks
    CREATE POLICY payment_webhooks_select_policy ON public.payment_webhooks
    FOR SELECT USING (public.current_user_is_admin());

    -- INSERT: Sistema pode inserir webhooks (sem restrições específicas)
    CREATE POLICY payment_webhooks_insert_policy ON public.payment_webhooks
    FOR INSERT WITH CHECK (true);

    -- UPDATE: Apenas admins podem atualizar webhooks
    CREATE POLICY payment_webhooks_update_policy ON public.payment_webhooks
    FOR UPDATE USING (public.current_user_is_admin());

    -- DELETE: Apenas superadmins podem deletar webhooks
    CREATE POLICY payment_webhooks_delete_policy ON public.payment_webhooks
    FOR DELETE USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- =====================================================
-- 13. VERIFICAÇÃO FINAL
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
-- RESUMO FINAL
-- =====================================================
-- 
-- ✅ LIMPEZA E APLICAÇÃO CONCLUÍDA:
-- 
-- 🧹 LIMPEZA:
-- • Removidas todas as políticas RLS existentes
-- • Removidas funções auxiliares com CASCADE
-- 
-- 🔧 RECRIAÇÃO:
-- • 4 funções auxiliares recriadas
-- • RLS habilitado em todas as tabelas
-- • 32 políticas RLS aplicadas
-- 
-- 📋 TABELAS COBERTAS:
-- • user_profiles, user_status_changes
-- • transactions, subscriptions, coupons
-- • coupon_usages, payment_methods, payment_webhooks
-- 
-- 🔐 HIERARQUIA DE ACESSO:
-- • SUPERADMIN: Acesso total
-- • ADMIN: Gerencia usuários e transações
-- • USUÁRIO: Apenas seus próprios dados
-- 
-- =====================================================