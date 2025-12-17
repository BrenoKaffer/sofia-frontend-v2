-- Script para adicionar colunas faltantes na tabela user_profiles
-- Execute este script no Supabase SQL Editor

-- Adicionar colunas faltantes na tabela user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS registration_source text DEFAULT 'web';

-- Adicionar constraints para email único
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);

-- Adicionar constraint para CPF único (se não for nulo)
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_cpf_unique UNIQUE (cpf);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_cpf ON public.user_profiles(cpf);
CREATE INDEX IF NOT EXISTS idx_user_profiles_full_name ON public.user_profiles(full_name);

-- Verificar a estrutura atualizada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Comentário da tabela atualizada
COMMENT ON TABLE public.user_profiles IS 'Tabela unificada de perfis de usuário com informações pessoais e preferências';
COMMENT ON COLUMN public.user_profiles.email IS 'Email do usuário (único)';
COMMENT ON COLUMN public.user_profiles.full_name IS 'Nome completo do usuário';
COMMENT ON COLUMN public.user_profiles.cpf IS 'CPF do usuário (único, opcional)';
COMMENT ON COLUMN public.user_profiles.phone IS 'Telefone do usuário';
COMMENT ON COLUMN public.user_profiles.birth_date IS 'Data de nascimento';
COMMENT ON COLUMN public.user_profiles.avatar_url IS 'URL do avatar do usuário';
COMMENT ON COLUMN public.user_profiles.email_verified IS 'Se o email foi verificado';
COMMENT ON COLUMN public.user_profiles.terms_accepted IS 'Se os termos foram aceitos';
COMMENT ON COLUMN public.user_profiles.profile_completed IS 'Se o perfil foi completado';
COMMENT ON COLUMN public.user_profiles.onboarding_completed IS 'Se o onboarding foi completado';
COMMENT ON COLUMN public.user_profiles.registration_source IS 'Fonte do registro (web, mobile, etc.)';