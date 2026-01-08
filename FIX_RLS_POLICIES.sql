-- FIX RLS POLICIES FOR user_profiles
-- Executar este script no Editor SQL do Supabase para garantir permissões corretas

-- Habilitar RLS (se não estiver)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 1. Política para permitir que usuários autenticados leiam seu próprio perfil
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile" 
ON user_profiles FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Política para permitir que usuários autenticados atualizem seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- 3. Política para permitir inserção (necessário para criação de perfil no login/registro se service role não for usada)
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" 
ON user_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Política para Service Role (Admin) - acesso total
-- Nota: Service Role bypassa RLS automaticamente, mas é boa prática ter explícito se necessário em alguns contextos
-- Opcional, geralmente não necessário se usar service_role key corretamente.

-- Garantir que a tabela existe e tem as colunas certas (fallback)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir grants para authenticated e anon (anon necessário apenas se houver rotas públicas, mas user_profiles é privado)
GRANT ALL ON user_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
