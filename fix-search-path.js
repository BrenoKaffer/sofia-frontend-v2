require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

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

async function fixSearchPath() {
  try {
    console.log('🔧 Executando correção do search_path...');
    
    const sqlScript = fs.readFileSync('./sql/fix_function_search_path.sql', 'utf8');
    
    // Tentar executar o script completo primeiro
    console.log('📝 Executando script completo...');
    
    const { data, error } = await supabase.rpc('exec', { sql: sqlScript });
    
    if (error) {
      console.error('❌ Erro ao executar script completo:', error.message);
      console.log('🔄 Tentando abordagem alternativa...');
      
      // Se falhar, tentar executar apenas a parte do DO block
      const doBlockMatch = sqlScript.match(/DO \$\$[\s\S]*?END \$\$;/g);
      
      if (doBlockMatch && doBlockMatch.length > 0) {
        console.log('📝 Executando bloco DO principal...');
        
        const { data: doData, error: doError } = await supabase.rpc('exec', { 
          sql: doBlockMatch[0] 
        });
        
        if (doError) {
          console.error('❌ Erro no bloco DO:', doError.message);
        } else {
          console.log('✅ Bloco DO executado com sucesso!');
          console.log('📊 Resultado:', doData);
        }
      }
    } else {
      console.log('✅ Script completo executado com sucesso!');
      console.log('📊 Resultado:', data);
    }
    
    // Verificar se as correções foram aplicadas
    console.log('🔍 Verificando correções aplicadas...');
    
    const verificationQuery = `
      SELECT 
        p.proname as function_name,
        CASE 
          WHEN p.proconfig IS NULL THEN 'MUTÁVEL (PRECISA CORREÇÃO)'
          WHEN array_to_string(p.proconfig, ', ') LIKE '%search_path%' THEN 'SEGURO ✅'
          ELSE 'MUTÁVEL (PRECISA CORREÇÃO)'
        END as search_path_status,
        array_to_string(p.proconfig, ', ') as current_config
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      AND p.proname IN ('insert_user_profile_on_registration', 'format_phone_number')
      ORDER BY function_name;
    `;
    
    const { data: verificationData, error: verificationError } = await supabase.rpc('exec', { 
      sql: verificationQuery 
    });
    
    if (verificationError) {
      console.error('❌ Erro na verificação:', verificationError.message);
    } else {
      console.log('📊 Status das funções principais:');
      console.table(verificationData);
    }
    
    console.log('🎯 Processo de correção finalizado!');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

fixSearchPath();