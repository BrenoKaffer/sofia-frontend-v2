-- =====================================================
-- CRIAÇÃO DO ENUM PARA STATUS DE CONTA DE USUÁRIO
-- =====================================================

-- 1. Criar o tipo ENUM para status de conta
CREATE TYPE public.account_status_enum AS ENUM (
    'active',      -- ✅ Usuário ativo (acesso liberado)
    'free',        -- ✅ Usuário gratuito (acesso liberado) 
    'premium',     -- ✅ Usuário premium (acesso liberado)
    'trial',       -- ✅ Usuário em período de teste (acesso liberado)
    'admin',       -- 🔧 Administrador (acesso total + painel admin)
    'superadmin',  -- 👑 Super administrador (acesso total + controle sistema)
    'blocked',     -- ❌ Usuário bloqueado (acesso negado)
    'suspended',   -- ❌ Usuário suspenso (acesso negado)
    'banned',      -- ❌ Usuário banido (acesso negado)
    'inactive',    -- ⏸️ Usuário inativo (acesso limitado)
    'pending'      -- ⏳ Usuário pendente de verificação
);

-- 2. ALTERAR TABELA user_profiles PARA USAR O ENUM
-- Primeiro, vamos adicionar uma nova coluna temporária
ALTER TABLE public.user_profiles 
ADD COLUMN account_status_new public.account_status_enum DEFAULT 'free';

-- 3. MIGRAR DADOS EXISTENTES
-- Mapear valores existentes para o novo enum
UPDATE public.user_profiles 
SET account_status_new = CASE 
  WHEN account_status = 'free' THEN 'free'::public.account_status_enum
  WHEN account_status = 'premium' THEN 'premium'::public.account_status_enum
  WHEN account_status = 'active' THEN 'active'::public.account_status_enum
  WHEN account_status = 'blocked' THEN 'blocked'::public.account_status_enum
  WHEN account_status = 'suspended' THEN 'suspended'::public.account_status_enum
  WHEN account_status = 'banned' THEN 'banned'::public.account_status_enum
  WHEN account_status = 'inactive' THEN 'inactive'::public.account_status_enum
  ELSE 'free'::public.account_status_enum -- Default para valores não reconhecidos
END;

-- 4. REMOVER COLUNA ANTIGA E RENOMEAR A NOVA
ALTER TABLE public.user_profiles DROP COLUMN account_status;
ALTER TABLE public.user_profiles RENAME COLUMN account_status_new TO account_status;

-- 5. DEFINIR NOT NULL E DEFAULT
ALTER TABLE public.user_profiles 
ALTER COLUMN account_status SET NOT NULL,
ALTER COLUMN account_status SET DEFAULT 'free';

-- =====================================================
-- FUNÇÕES AUXILIARES PARA VERIFICAÇÃO DE STATUS
-- =====================================================

-- Função para verificar se usuário tem acesso liberado
CREATE OR REPLACE FUNCTION public.user_has_access(status public.account_status_enum)
RETURNS boolean AS $$
BEGIN
  RETURN status IN ('active', 'free', 'premium', 'trial', 'admin', 'superadmin');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para verificar se usuário está bloqueado
CREATE OR REPLACE FUNCTION public.user_is_blocked(status public.account_status_enum)
RETURNS boolean AS $$
BEGIN
  RETURN status IN ('blocked', 'suspended', 'banned');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para verificar se usuário é premium
CREATE OR REPLACE FUNCTION public.user_is_premium(status public.account_status_enum)
RETURNS boolean AS $$
BEGIN
  RETURN status IN ('premium', 'trial');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para verificar se usuário tem acesso limitado
CREATE OR REPLACE FUNCTION public.user_has_limited_access(status public.account_status_enum)
RETURNS boolean AS $$
BEGIN
  RETURN status IN ('inactive', 'pending');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.user_is_admin(status public.account_status_enum)
RETURNS boolean AS $$
BEGIN
  RETURN status IN ('admin', 'superadmin');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para verificar se usuário é superadmin
CREATE OR REPLACE FUNCTION public.user_is_superadmin(status public.account_status_enum)
RETURNS boolean AS $$
BEGIN
  RETURN status = 'superadmin';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- VIEWS PARA FACILITAR CONSULTAS
-- =====================================================

-- View com usuários ativos (acesso liberado)
CREATE OR REPLACE VIEW public.active_users AS
SELECT 
  up.*,
  au.email as auth_email,
  au.created_at as auth_created_at
FROM public.user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE public.user_has_access(up.account_status);

-- View com usuários bloqueados
CREATE OR REPLACE VIEW public.blocked_users AS
SELECT 
  up.*,
  au.email as auth_email,
  au.created_at as auth_created_at
FROM public.user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE public.user_is_blocked(up.account_status);

-- View com usuários premium
CREATE OR REPLACE VIEW public.premium_users AS
SELECT 
  up.*,
  au.email as auth_email,
  au.created_at as auth_created_at
FROM public.user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE public.user_is_premium(up.account_status);

-- View com usuários pendentes
CREATE OR REPLACE VIEW public.pending_users AS
SELECT 
  up.*,
  au.email as auth_email,
  au.created_at as auth_created_at
FROM public.user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE up.account_status = 'pending';

-- View com usuários inativos
CREATE OR REPLACE VIEW public.inactive_users AS
SELECT 
  up.*,
  au.email as auth_email,
  au.created_at as auth_created_at
FROM public.user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE up.account_status = 'inactive';

-- View com usuários administradores
CREATE OR REPLACE VIEW public.admin_users AS
SELECT 
  up.*,
  au.email as auth_email,
  au.created_at as auth_created_at
FROM public.user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE public.user_is_admin(up.account_status);

-- View com super administradores
CREATE OR REPLACE VIEW public.superadmin_users AS
SELECT 
  up.*,
  au.email as auth_email,
  au.created_at as auth_created_at
FROM public.user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE public.user_is_superadmin(up.account_status);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para consultas por status
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_status 
ON public.user_profiles(account_status);

-- Índice composto para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_user_profiles_status_created 
ON public.user_profiles(account_status, created_at);

-- =====================================================
-- TRIGGERS PARA AUDITORIA DE MUDANÇAS DE STATUS
-- =====================================================

-- Tabela para log de mudanças de status
CREATE TABLE IF NOT EXISTS public.user_status_changes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  old_status public.account_status_enum,
  new_status public.account_status_enum NOT NULL,
  changed_by text, -- Email ou ID de quem fez a mudança
  reason text, -- Motivo da mudança
  metadata jsonb DEFAULT '{}',
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT user_status_changes_pkey PRIMARY KEY (id),
  CONSTRAINT user_status_changes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Função para registrar mudanças de status
CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Só registra se o status realmente mudou
  IF OLD.account_status IS DISTINCT FROM NEW.account_status THEN
    INSERT INTO public.user_status_changes (
      user_id, 
      old_status, 
      new_status,
      changed_by,
      reason
    ) VALUES (
      NEW.user_id,
      OLD.account_status,
      NEW.account_status,
      current_setting('app.current_user_email', true), -- Configurado pela aplicação
      current_setting('app.status_change_reason', true) -- Configurado pela aplicação
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para log automático
CREATE TRIGGER user_profiles_status_change_log
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_status_change();

-- =====================================================
-- DADOS DE EXEMPLO E COMENTÁRIOS
-- =====================================================

-- Comentários sobre cada status:
COMMENT ON TYPE public.account_status_enum IS 'Status da conta do usuário: active/free/premium/trial (acesso liberado), blocked/suspended/banned (acesso negado), inactive (limitado), pending (verificação)';

-- Exemplos de uso:
/*
-- Bloquear usuário
UPDATE public.user_profiles 
SET account_status = 'blocked' 
WHERE user_id = 'uuid-do-usuario';

-- Promover para premium
UPDATE public.user_profiles 
SET account_status = 'premium' 
WHERE user_id = 'uuid-do-usuario';

-- Consultar usuários ativos
SELECT * FROM public.active_users;

-- Verificar se usuário tem acesso (no código da aplicação)
SELECT public.user_has_access(account_status) as has_access
FROM public.user_profiles 
WHERE user_id = 'uuid-do-usuario';
*/