-- Create the missing format_phone_number function
CREATE OR REPLACE FUNCTION format_phone_number(
  country_code character varying,
  area_code character varying,
  phone_number character varying
)
RETURNS character varying
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se algum campo estiver vazio, retorna vazio
  IF country_code IS NULL OR area_code IS NULL OR phone_number IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Formatação para Brasil (+55)
  IF country_code = '+55' AND length(phone_number) = 9 THEN
    RETURN country_code || ' ' || area_code || ' ' || substring(phone_number, 1, 5) || '-' || substring(phone_number, 6);
  ELSIF country_code = '+55' AND length(phone_number) = 8 THEN
    RETURN country_code || ' ' || area_code || ' ' || substring(phone_number, 1, 4) || '-' || substring(phone_number, 5);
  ELSE
    -- Formatação genérica
    RETURN country_code || ' ' || area_code || ' ' || phone_number;
  END IF;
END;
$$;