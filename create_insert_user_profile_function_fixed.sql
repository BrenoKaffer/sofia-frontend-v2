DROP FUNCTION IF EXISTS public.insert_user_profile_on_registration(uuid, text, text, text);
CREATE OR REPLACE FUNCTION public.insert_user_profile_on_registration(
  p_user_id uuid,
  p_full_name text,
  p_cpf text,
  p_email text
)
RETURNS public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile public.user_profiles;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  IF p_user_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  INSERT INTO public.user_profiles (user_id, email, full_name, cpf)
  VALUES (p_user_id, p_email, COALESCE(p_full_name, split_part(p_email, '@', 1)), NULLIF(p_cpf, ''))
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    cpf = EXCLUDED.cpf
  RETURNING * INTO v_profile;
  RETURN v_profile;
END;
$$;
GRANT EXECUTE ON FUNCTION public.insert_user_profile_on_registration(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_user_profile_on_registration(uuid, text, text, text) TO service_role;

-- Instruções de uso:
-- 1. Execute este script no seu banco de dados Supabase
-- 2. Verifique se a função foi criada corretamente:
--    SELECT proname FROM pg_proc WHERE proname = 'insert_user_profile_on_registration';
-- 3. Teste a função com dados de exemplo se necessário
-- 4. A função será chamada automaticamente pelo código de registro
