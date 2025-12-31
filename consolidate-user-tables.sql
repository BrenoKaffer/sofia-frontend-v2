-- ========================================
-- SCRIPT DE CONSOLIDAÇÃO DAS TABELAS DE USUÁRIO
-- Remove redundâncias entre user_profiles, user_preferences e profiles
-- ========================================

-- 1. BACKUP DAS TABELAS EXISTENTES
-- ========================================

-- Criar backup das tabelas atuais
CREATE TABLE IF NOT EXISTS backup_profiles AS SELECT * FROM profiles;
CREATE TABLE IF NOT EXISTS backup_user_preferences AS SELECT * FROM user_preferences;
CREATE TABLE IF NOT EXISTS backup_user_profiles AS SELECT * FROM user_profiles;

-- 2. CRIAR NOVA TABELA CONSOLIDADA
-- ========================================

-- Remover tabela user_profiles atual se existir
DROP TABLE IF EXISTS user_profiles_new CASCADE;

-- Criar nova tabela consolidada
CREATE TABLE user_profiles_new (
  -- Identificação
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  
  -- Dados Pessoais (consolidados de profiles e user_profiles)
  email text UNIQUE NOT NULL,
  full_name text,
  cpf text UNIQUE,
  phone text,
  birth_date date,
  avatar_url text,
  
  -- Status da Conta
  account_status text NOT NULL DEFAULT 'free',
  email_verified boolean DEFAULT false,
  terms_accepted boolean DEFAULT false,
  profile_completed boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  registration_source text DEFAULT 'web',
  
  -- Preferências Unificadas (JSONB)
  preferences jsonb NOT NULL DEFAULT '{
    "theme": "light",
    "notifications": true,
    "language": "pt-BR"
  }',
  
  -- Dados Adicionais
  notes jsonb NOT NULL DEFAULT '[]',
  permissions jsonb NOT NULL DEFAULT '[]',
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT user_profiles_new_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. MIGRAR DADOS DAS TABELAS EXISTENTES
-- ========================================

-- Inserir dados consolidados na nova tabela
INSERT INTO user_profiles_new (
  user_id,
  email,
  full_name,
  cpf,
  phone,
  birth_date,
  avatar_url,
  account_status,
  email_verified,
  terms_accepted,
  profile_completed,
  onboarding_completed,
  registration_source,
  preferences,
  notes,
  permissions,
  created_at,
  updated_at
)
SELECT DISTINCT
  -- Usar user_id da tabela user_profiles como principal
  COALESCE(up.user_id, p.id) as user_id,
  
  -- Email: priorizar user_profiles, depois profiles
  COALESCE(up.email, p.email) as email,
  
  -- Nome: priorizar user_profiles, depois profiles
  COALESCE(up.full_name, p.full_name) as full_name,
  
  -- Dados específicos de user_profiles
  up.cpf,
  up.phone,
  up.birth_date,
  
  -- Avatar: priorizar user_profiles, depois profiles
  COALESCE(up.avatar_url, p.avatar_url) as avatar_url,
  
  -- Status da conta
  COALESCE(up.account_status, 'free') as account_status,
  COALESCE(up.email_verified, false) as email_verified,
  COALESCE(up.terms_accepted, false) as terms_accepted,
  COALESCE(up.profile_completed, false) as profile_completed,
  COALESCE(up.onboarding_completed, false) as onboarding_completed,
  COALESCE(up.registration_source, 'web') as registration_source,
  
  -- Consolidar preferências
  CASE 
    WHEN up.preferences IS NOT NULL AND up.preferences != '{}' THEN
      -- Se user_profiles tem preferências, mesclar com user_preferences
      CASE 
        WHEN upref.id IS NOT NULL THEN
          jsonb_build_object(
            'theme', COALESCE(upref.theme, 'light'),
            'notifications', COALESCE(upref.notifications, true),
            'language', COALESCE(upref.language, 'pt-BR')
          ) || COALESCE(up.preferences, '{}')
        ELSE
          up.preferences
      END
    WHEN upref.id IS NOT NULL THEN
      -- Se só tem user_preferences
      jsonb_build_object(
        'theme', COALESCE(upref.theme, 'light'),
        'notifications', COALESCE(upref.notifications, true),
        'language', COALESCE(upref.language, 'pt-BR')
      )
    ELSE
      -- Padrão
      '{
        "theme": "light",
        "notifications": true,
        "language": "pt-BR"
      }'::jsonb
  END as preferences,
  
  -- Dados adicionais
  COALESCE(up.notes, '[]'::jsonb) as notes,
  COALESCE(up.permissions, '[]'::jsonb) as permissions,
  
  -- Timestamps: usar o mais antigo
  LEAST(
    COALESCE(up.created_at, now()),
    COALESCE(p.created_at, now()),
    COALESCE(upref.created_at, now())
  ) as created_at,
  
  GREATEST(
    COALESCE(up.updated_at, now()),
    COALESCE(p.updated_at, now()),
    COALESCE(upref.updated_at, now())
  ) as updated_at

FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_preferences upref ON u.id = upref.id
WHERE u.id IS NOT NULL;

-- 4. SUBSTITUIR TABELAS ANTIGAS
-- ========================================

-- Remover constraints que referenciam as tabelas antigas
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Buscar e remover constraints que referenciam user_profiles
    FOR constraint_record IN 
        SELECT tc.constraint_name, tc.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name IN ('user_profiles', 'profiles', 'user_preferences')
        AND tc.table_name NOT LIKE '%backup%'
        AND tc.table_name != 'user_profiles_new'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                      constraint_record.table_name, 
                      constraint_record.constraint_name);
    END LOOP;
END $$;

-- Remover tabelas antigas
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;

-- Renomear nova tabela
ALTER TABLE user_profiles_new RENAME TO user_profiles;

-- 5. RECRIAR ÍNDICES E TRIGGERS
-- ========================================

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_cpf ON user_profiles(cpf);
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_status ON user_profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. RECRIAR POLÍTICAS RLS (se necessário)
-- ========================================

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios dados
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários atualizarem apenas seus próprios dados
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para inserção (registro)
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. ATUALIZAR FUNÇÃO DE REGISTRO
-- ========================================

-- Recriar função de registro para usar a nova estrutura
CREATE OR REPLACE FUNCTION insert_user_profile_on_registration(
    p_user_id uuid,
    p_full_name text,
    p_cpf text,
    p_email text,
    p_phone text DEFAULT NULL,
    p_registration_source text DEFAULT 'web'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_data json;
BEGIN
    -- Inserir perfil do usuário
    INSERT INTO user_profiles (
        user_id,
        email,
        full_name,
        cpf,
        phone,
        registration_source,
        preferences,
        account_status,
        profile_completed
    ) VALUES (
        p_user_id,
        p_email,
        p_full_name,
        p_cpf,
        p_phone,
        p_registration_source,
        '{
            "theme": "light",
            "notifications": true,
            "language": "pt-BR"
        }'::jsonb,
        'free',
        true
    );
    
    -- Retornar dados inseridos
    SELECT json_build_object(
        'success', true,
        'user_id', p_user_id,
        'message', 'Perfil criado com sucesso'
    ) INTO result_data;
    
    RETURN result_data;
    
EXCEPTION WHEN OTHERS THEN
    -- Log do erro
    INSERT INTO system_logs (level, message, context, source, metadata)
    VALUES (
        'error',
        'Erro ao criar perfil do usuário: ' || SQLERRM,
        'user_registration',
        'insert_user_profile_on_registration',
        json_build_object(
            'user_id', p_user_id,
            'error_code', SQLSTATE,
            'error_message', SQLERRM
        )::jsonb
    );
    
    -- Retornar erro
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE
    );
END;
$$;

-- 8. VERIFICAÇÕES FINAIS
-- ========================================

-- Verificar se a migração foi bem-sucedida
DO $$
DECLARE
    old_count integer;
    new_count integer;
BEGIN
    -- Contar registros nas tabelas de backup
    SELECT 
        COALESCE((SELECT COUNT(*) FROM backup_user_profiles), 0) +
        COALESCE((SELECT COUNT(*) FROM backup_profiles), 0) +
        COALESCE((SELECT COUNT(*) FROM backup_user_preferences), 0)
    INTO old_count;
    
    -- Contar registros na nova tabela
    SELECT COUNT(*) FROM user_profiles INTO new_count;
    
    -- Log do resultado
    INSERT INTO system_logs (level, message, context, source, metadata)
    VALUES (
        'info',
        'Migração de tabelas de usuário concluída',
        'database_migration',
        'consolidate_user_tables',
        json_build_object(
            'backup_records', old_count,
            'migrated_records', new_count,
            'migration_timestamp', now()
        )::jsonb
    );
    
    RAISE NOTICE 'Migração concluída: % registros de backup, % registros migrados', old_count, new_count;
END $$;

-- Verificar estrutura final
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- ========================================
-- MIGRAÇÃO CONCLUÍDA
-- ========================================

-- IMPORTANTE: 
-- 1. As tabelas antigas foram salvas como backup_*
-- 2. A nova tabela user_profiles consolida todos os dados
-- 3. As preferências agora estão em um campo JSONB unificado
-- 4. A função de registro foi atualizada
-- 5. Políticas RLS foram recriadas

-- Para remover os backups após confirmar que tudo está funcionando:
-- DROP TABLE IF EXISTS backup_profiles;
-- DROP TABLE IF EXISTS backup_user_preferences; 
-- DROP TABLE IF EXISTS backup_user_profiles;