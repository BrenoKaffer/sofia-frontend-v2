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

-- =====================================================
-- 2. FUNÇÕES AUXILIARES PARA RLS (CREATE OR REPLACE)
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
-- 5. POLÍTICAS ESPECIAIS PARA BYPASS DE SUPERADMIN (CRIAÇÃO SEGURA)
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
-- 6. CONFIGURAÇÕES DE SEGURANÇA ADICIONAIS
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
-- 7. FUNÇÃO PARA TESTAR AS POLÍTICAS RLS
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
-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION public.get_current_user_id() IS 'Retorna o ID do usuário autenticado atual';
COMMENT ON FUNCTION public.get_current_user_status() IS 'Retorna o status do usuário autenticado atual';
COMMENT ON FUNCTION public.current_user_is_admin() IS 'Verifica se o usuário atual é admin ou superadmin';
COMMENT ON FUNCTION public.current_user_is_superadmin() IS 'Verifica se o usuário atual é superadmin';
COMMENT ON FUNCTION public.test_rls_policies(uuid) IS 'Função para testar as políticas RLS implementadas';

-- =====================================================
-- 9. VERIFICAÇÃO FINAL
-- =====================================================

-- Mostrar todas as políticas criadas
SELECT 
    'Políticas RLS criadas:' as info,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Mostrar tabelas com RLS habilitado
SELECT 
    'Tabelas com RLS habilitado:' as info,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;