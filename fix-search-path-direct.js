require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Carregando configurações...');
console.log('URL:', supabaseUrl ? 'Definida' : 'Não definida');
console.log('Key:', supabaseKey ? 'Definida' : 'Não definida');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSearchPathDirect() {
  try {
    console.log('🔧 Aplicando correção do search_path diretamente...');
    
    // Corrigir a função insert_user_profile_on_registration
    console.log('📝 Corrigindo insert_user_profile_on_registration...');
    
    const fixInsertUserProfileFunction = `
      CREATE OR REPLACE FUNCTION insert_user_profile_on_registration(
          p_user_id uuid,
          p_full_name text,
          p_cpf text,
          p_email text
      )
      RETURNS json
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = ''
      AS $$
      DECLARE
          result json;
      BEGIN
          -- Log da execução da função
          RAISE NOTICE 'Executando insert_user_profile_on_registration para user_id: %', p_user_id;
          
          -- Insere nas preferências do usuário (estrutura correta)
          INSERT INTO public.user_preferences (
              id,
              theme,
              notifications,
              language,
              created_at,
              updated_at
          ) VALUES (
              p_user_id,
              'light',
              true,
              'pt-BR',
              NOW(),
              NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
              updated_at = NOW();

          RAISE NOTICE 'Dados inseridos em user_preferences para user_id: %', p_user_id;

          -- Insere no perfil do usuário (estrutura correta)
          INSERT INTO public.user_profiles (
              user_id,
              full_name,
              cpf,
              email,
              email_verified,
              preferences,
              notes,
              account_status,
              permissions,
              created_at,
              updated_at
          ) VALUES (
              p_user_id,
              p_full_name,
              p_cpf,
              p_email,
              false,
              jsonb_build_object(
                  'registration_source', 'web_form',
                  'profile_completed', true,
                  'onboarding_completed', false,
                  'terms_accepted', true,
                  'registration_date', NOW()::text
              ),
              '[]'::jsonb,
              'free',
              '["basic_user"]'::jsonb,
              NOW(),
              NOW()
          )
          ON CONFLICT (user_id) DO UPDATE SET
              full_name = EXCLUDED.full_name,
              cpf = EXCLUDED.cpf,
              email = EXCLUDED.email,
              updated_at = NOW();

          RAISE NOTICE 'Dados inseridos em user_profiles para user_id: %', p_user_id;

          -- Retorna sucesso
          result := json_build_object(
              'success', true,
              'message', 'Perfil do usuário criado com sucesso',
              'user_id', p_user_id,
              'timestamp', NOW()
          );
          RETURN result;

      EXCEPTION
          WHEN OTHERS THEN
              -- Em caso de erro, log detalhado e retorna informações do erro
              RAISE NOTICE 'ERRO na função insert_user_profile_on_registration: % - %', SQLSTATE, SQLERRM;
              
              result := json_build_object(
                  'success', false,
                  'error', SQLERRM,
                  'error_code', SQLSTATE,
                  'user_id', p_user_id,
                  'timestamp', NOW()
              );
              RETURN result;
      END;
      $$;
    `;
    
    const { data: insertData, error: insertError } = await supabase
      .from('_temp_sql_execution')
      .select('*')
      .limit(0);
    
    // Usar uma abordagem diferente - executar via query direta
    try {
      // Tentar usar o cliente PostgreSQL diretamente
      const { data, error } = await supabase.rpc('query', { 
        query: fixInsertUserProfileFunction 
      });
      
      if (error) {
        console.log('❌ Método query não disponível, tentando abordagem alternativa...');
        
        // Criar a função format_phone_number se não existir
        console.log('📝 Criando função format_phone_number...');
        
        const formatPhoneFunction = `
          CREATE OR REPLACE FUNCTION format_phone_number(
              country_code text DEFAULT '+55',
              area_code text DEFAULT '',
              phone_number text DEFAULT ''
          )
          RETURNS text
          LANGUAGE plpgsql
          SET search_path = ''
          AS $$
          BEGIN
              -- Se algum parâmetro for nulo ou vazio, retorna string vazia
              IF country_code IS NULL OR area_code IS NULL OR phone_number IS NULL THEN
                  RETURN '';
              END IF;
              
              -- Remove caracteres não numéricos
              country_code := regexp_replace(country_code, '[^0-9+]', '', 'g');
              area_code := regexp_replace(area_code, '[^0-9]', '', 'g');
              phone_number := regexp_replace(phone_number, '[^0-9]', '', 'g');
              
              -- Se algum campo ficar vazio após limpeza, retorna vazio
              IF length(area_code) = 0 OR length(phone_number) = 0 THEN
                  RETURN '';
              END IF;
              
              -- Formatação específica para Brasil (+55)
              IF country_code = '+55' OR country_code = '55' THEN
                  -- Celular (9 dígitos) ou fixo (8 dígitos)
                  IF length(phone_number) = 9 THEN
                      RETURN '+55 (' || area_code || ') ' || substring(phone_number, 1, 5) || '-' || substring(phone_number, 6, 4);
                  ELSIF length(phone_number) = 8 THEN
                      RETURN '+55 (' || area_code || ') ' || substring(phone_number, 1, 4) || '-' || substring(phone_number, 5, 4);
                  END IF;
              END IF;
              
              -- Formatação genérica para outros países
              RETURN country_code || ' (' || area_code || ') ' || phone_number;
          END;
          $$;
        `;
        
        console.log('✅ Funções preparadas para correção');
        console.log('📋 Para aplicar as correções, execute os seguintes comandos no Supabase SQL Editor:');
        console.log('');
        console.log('1️⃣ Função insert_user_profile_on_registration:');
        console.log(fixInsertUserProfileFunction);
        console.log('');
        console.log('2️⃣ Função format_phone_number:');
        console.log(formatPhoneFunction);
        
      } else {
        console.log('✅ Função corrigida com sucesso!');
      }
    } catch (directError) {
      console.log('❌ Erro na execução direta:', directError.message);
    }
    
    // Verificar status atual das funções
    console.log('🔍 Verificando status atual das funções...');
    
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_definition')
      .eq('routine_schema', 'public')
      .in('routine_name', ['insert_user_profile_on_registration', 'format_phone_number']);
    
    if (funcError) {
      console.log('❌ Não foi possível verificar funções:', funcError.message);
    } else {
      console.log('📊 Funções encontradas:', functions?.length || 0);
      if (functions && functions.length > 0) {
        functions.forEach(func => {
          const hasSearchPath = func.routine_definition?.includes('search_path');
          console.log(`- ${func.routine_name}: ${hasSearchPath ? '✅ SEGURO' : '⚠️ PRECISA CORREÇÃO'}`);
        });
      }
    }
    
    console.log('🎯 Processo finalizado!');
    console.log('💡 Se as funções não foram corrigidas automaticamente, execute os comandos SQL mostrados acima no Supabase SQL Editor.');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

fixSearchPathDirect();