-- =====================================================
-- CORREÇÃO DE PERMISSÕES DE SINCRONIZAÇÃO (RLS) - VERSÃO COMPLETA E SEGURA
-- =====================================================

-- Este script corrige problemas de recursão e permissão que impedem
-- que o usuário leia seu próprio perfil na tabela user_profiles.
-- Remove todas as dependências, recria funções seguras e restaura todas as políticas.

-- =====================================================
-- 1. REMOÇÃO DE POLÍTICAS EXISTENTES (LIMPEZA COMPLETA)
-- =====================================================

-- Função auxiliar para remover políticas com segurança se a tabela existir
DO $$
BEGIN
    -- user_profiles
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
        DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
        DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;
        DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;
        DROP POLICY IF EXISTS "user_profiles_delete_policy" ON public.user_profiles;
        DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
    END IF;

    -- user_status_changes
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_status_changes') THEN
        DROP POLICY IF EXISTS "user_status_changes_select_policy" ON public.user_status_changes;
        DROP POLICY IF EXISTS "user_status_changes_insert_policy" ON public.user_status_changes;
        DROP POLICY IF EXISTS "user_status_changes_update_policy" ON public.user_status_changes;
        DROP POLICY IF EXISTS "user_status_changes_delete_policy" ON public.user_status_changes;
    END IF;

    -- transactions
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
        DROP POLICY IF EXISTS "transactions_select_policy" ON public.transactions;
        DROP POLICY IF EXISTS "transactions_insert_policy" ON public.transactions;
        DROP POLICY IF EXISTS "transactions_update_policy" ON public.transactions;
        DROP POLICY IF EXISTS "transactions_delete_policy" ON public.transactions;
    END IF;

    -- subscriptions
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
        DROP POLICY IF EXISTS "subscriptions_select_policy" ON public.subscriptions;
        DROP POLICY IF EXISTS "subscriptions_insert_policy" ON public.subscriptions;
        DROP POLICY IF EXISTS "subscriptions_update_policy" ON public.subscriptions;
        DROP POLICY IF EXISTS "subscriptions_delete_policy" ON public.subscriptions;
    END IF;

    -- coupons
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coupons') THEN
        DROP POLICY IF EXISTS "coupons_select_policy" ON public.coupons;
        DROP POLICY IF EXISTS "coupons_insert_policy" ON public.coupons;
        DROP POLICY IF EXISTS "coupons_update_policy" ON public.coupons;
        DROP POLICY IF EXISTS "coupons_delete_policy" ON public.coupons;
    END IF;

    -- coupon_usages
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coupon_usages') THEN
        DROP POLICY IF EXISTS "coupon_usages_select_policy" ON public.coupon_usages;
        DROP POLICY IF EXISTS "coupon_usages_insert_policy" ON public.coupon_usages;
        DROP POLICY IF EXISTS "coupon_usages_update_policy" ON public.coupon_usages;
        DROP POLICY IF EXISTS "coupon_usages_delete_policy" ON public.coupon_usages;
    END IF;

    -- payment_methods
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_methods') THEN
        DROP POLICY IF EXISTS "payment_methods_select_policy" ON public.payment_methods;
        DROP POLICY IF EXISTS "payment_methods_insert_policy" ON public.payment_methods;
        DROP POLICY IF EXISTS "payment_methods_update_policy" ON public.payment_methods;
        DROP POLICY IF EXISTS "payment_methods_delete_policy" ON public.payment_methods;
    END IF;

    -- payment_webhooks
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_webhooks') THEN
        DROP POLICY IF EXISTS "payment_webhooks_select_policy" ON public.payment_webhooks;
        DROP POLICY IF EXISTS "payment_webhooks_insert_policy" ON public.payment_webhooks;
        DROP POLICY IF EXISTS "payment_webhooks_update_policy" ON public.payment_webhooks;
        DROP POLICY IF EXISTS "payment_webhooks_delete_policy" ON public.payment_webhooks;
    END IF;
END $$;

-- =====================================================
-- 2. REMOÇÃO DE FUNÇÕES ANTIGAS
-- =====================================================

-- Usamos CASCADE para garantir, mas já limpamos as políticas acima
DROP FUNCTION IF EXISTS public.current_user_is_superadmin() CASCADE;
DROP FUNCTION IF EXISTS public.current_user_is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_status() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_id() CASCADE;

-- =====================================================
-- 3. RECRIAÇÃO DE FUNÇÕES SEGURAS (SEM RECURSÃO)
-- =====================================================

-- Função simples para obter ID do usuário
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função de status com SECURITY DEFINER para bypassar RLS ao checar status
-- Isso evita o loop infinito: Policy -> is_admin -> get_status -> Select user_profiles -> Policy
CREATE OR REPLACE FUNCTION public.get_current_user_status()
RETURNS public.account_status_enum AS $$
BEGIN
  -- Como é SECURITY DEFINER, este SELECT ignora RLS se o dono da função (postgres) tiver acesso
  RETURN (
    SELECT account_status 
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'free'::public.account_status_enum;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Funções de verificação de admin
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_current_user_status() IN ('admin', 'superadmin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_is_superadmin()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_current_user_status() = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. RECRIAÇÃO DE TODAS AS POLÍTICAS (RESTAURAÇÃO)
-- =====================================================

-- 4.1 USER_PROFILES (Corrigido para evitar recursão)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_select_policy" ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id OR public.current_user_is_admin());

CREATE POLICY "user_profiles_update_policy" ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id OR public.current_user_is_admin())
  WITH CHECK (auth.uid() = user_id OR public.current_user_is_admin());

CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_delete_policy" ON public.user_profiles
  FOR DELETE
  USING (public.current_user_is_superadmin());

-- 4.2 USER_STATUS_CHANGES
ALTER TABLE public.user_status_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_status_changes_select_policy" ON public.user_status_changes
  FOR SELECT
  USING (user_id = auth.uid() OR public.current_user_is_admin());

CREATE POLICY "user_status_changes_insert_policy" ON public.user_status_changes
  FOR INSERT
  WITH CHECK (public.current_user_is_admin());

CREATE POLICY "user_status_changes_update_policy" ON public.user_status_changes
  FOR UPDATE
  USING (public.current_user_is_superadmin());

CREATE POLICY "user_status_changes_delete_policy" ON public.user_status_changes
  FOR DELETE
  USING (public.current_user_is_superadmin());

-- 4.3 TRANSACTIONS
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY transactions_select_policy ON public.transactions FOR SELECT USING (user_id = public.get_current_user_id() OR public.current_user_is_admin());
    CREATE POLICY transactions_insert_policy ON public.transactions FOR INSERT WITH CHECK (user_id = public.get_current_user_id() OR public.current_user_is_admin());
    CREATE POLICY transactions_update_policy ON public.transactions FOR UPDATE USING (public.current_user_is_admin());
    CREATE POLICY transactions_delete_policy ON public.transactions FOR DELETE USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- 4.4 SUBSCRIPTIONS
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
    ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY subscriptions_select_policy ON public.subscriptions FOR SELECT USING (user_id = public.get_current_user_id() OR public.current_user_is_admin());
    CREATE POLICY subscriptions_insert_policy ON public.subscriptions FOR INSERT WITH CHECK (user_id = public.get_current_user_id() OR public.current_user_is_admin());
    CREATE POLICY subscriptions_update_policy ON public.subscriptions FOR UPDATE USING (user_id = public.get_current_user_id() OR public.current_user_is_admin());
    CREATE POLICY subscriptions_delete_policy ON public.subscriptions FOR DELETE USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- 4.5 COUPONS
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coupons') THEN
    ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY coupons_select_policy ON public.coupons FOR SELECT USING (is_active = true OR public.current_user_is_admin());
    CREATE POLICY coupons_insert_policy ON public.coupons FOR INSERT WITH CHECK (public.current_user_is_admin());
    CREATE POLICY coupons_update_policy ON public.coupons FOR UPDATE USING (public.current_user_is_admin());
    CREATE POLICY coupons_delete_policy ON public.coupons FOR DELETE USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- 4.6 COUPON_USAGES
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coupon_usages') THEN
    ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY coupon_usages_select_policy ON public.coupon_usages FOR SELECT USING (user_id = public.get_current_user_id() OR public.current_user_is_admin());
    CREATE POLICY coupon_usages_insert_policy ON public.coupon_usages FOR INSERT WITH CHECK (user_id = public.get_current_user_id() OR public.current_user_is_admin());
    CREATE POLICY coupon_usages_update_policy ON public.coupon_usages FOR UPDATE USING (public.current_user_is_admin());
    CREATE POLICY coupon_usages_delete_policy ON public.coupon_usages FOR DELETE USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- 4.7 PAYMENT_METHODS
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_methods') THEN
    ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY payment_methods_select_policy ON public.payment_methods FOR SELECT USING (user_id = public.get_current_user_id() OR public.current_user_is_admin());
    CREATE POLICY payment_methods_insert_policy ON public.payment_methods FOR INSERT WITH CHECK (user_id = public.get_current_user_id() OR public.current_user_is_admin());
    CREATE POLICY payment_methods_update_policy ON public.payment_methods FOR UPDATE USING (user_id = public.get_current_user_id() OR public.current_user_is_admin());
    CREATE POLICY payment_methods_delete_policy ON public.payment_methods FOR DELETE USING (user_id = public.get_current_user_id() OR public.current_user_is_admin());
  END IF;
END $$;

-- 4.8 PAYMENT_WEBHOOKS
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_webhooks') THEN
    ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY payment_webhooks_select_policy ON public.payment_webhooks FOR SELECT USING (public.current_user_is_admin());
    CREATE POLICY payment_webhooks_insert_policy ON public.payment_webhooks FOR INSERT WITH CHECK (true);
    CREATE POLICY payment_webhooks_update_policy ON public.payment_webhooks FOR UPDATE USING (public.current_user_is_admin());
    CREATE POLICY payment_webhooks_delete_policy ON public.payment_webhooks FOR DELETE USING (public.current_user_is_superadmin());
  END IF;
END $$;

-- 5. Garantir permissões básicas
GRANT SELECT, UPDATE, INSERT ON public.user_profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Confirmação
COMMENT ON TABLE public.user_profiles IS 'Tabela de perfis com RLS corrigido e restaurado';
