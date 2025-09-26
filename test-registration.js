// Teste isolado para simular registro e identificar o problema
// Este script testa a função insert_user_profile_on_registration

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Dados de teste
const testUser = {
  id: '12345678-1234-1234-1234-123456789012', // UUID fictício
  full_name: 'Teste Usuario',
  cpf: '12345678901',
  email: 'teste@exemplo.com'
};

async function testRegistration() {
  console.log('🧪 Iniciando teste de registro...');
  console.log('📋 Dados do usuário de teste:', testUser);
  
  try {
    // Teste 1: Verificar se as tabelas existem
    console.log('\n1️⃣ Verificando estrutura das tabelas...');
    
    // Verificar tabela user_preferences
    const { data: prefsColumns, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .limit(0);
    
    if (prefsError) {
      console.error('❌ Erro ao acessar user_preferences:', prefsError.message);
    } else {
      console.log('✅ Tabela user_preferences acessível');
    }
    
    // Verificar tabela user_profiles
    const { data: profilesColumns, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(0);
    
    if (profilesError) {
      console.error('❌ Erro ao acessar user_profiles:', profilesError.message);
    } else {
      console.log('✅ Tabela user_profiles acessível');
    }
    
    // Teste 2: Verificar se a função existe
    console.log('\n2️⃣ Verificando se a função SQL existe...');
    
    const { data: functionExists, error: functionError } = await supabase
      .rpc('insert_user_profile_on_registration', {
        p_user_id: testUser.id,
        p_full_name: testUser.full_name,
        p_cpf: testUser.cpf,
        p_email: testUser.email
      });
    
    if (functionError) {
      console.error('❌ Erro ao executar função:', functionError.message);
      console.error('📝 Detalhes do erro:', functionError);
      
      // Analisar o tipo de erro
      if (functionError.message.includes('function') && functionError.message.includes('does not exist')) {
        console.log('\n🔍 DIAGNÓSTICO: A função insert_user_profile_on_registration não existe no banco de dados');
        console.log('💡 SOLUÇÃO: Execute o script SQL para criar a função');
      } else if (functionError.message.includes('column') && functionError.message.includes('does not exist')) {
        console.log('\n🔍 DIAGNÓSTICO: Tentativa de inserir em coluna inexistente');
        console.log('💡 SOLUÇÃO: Verificar estrutura das tabelas e ajustar a função');
      } else if (functionError.message.includes('constraint')) {
        console.log('\n🔍 DIAGNÓSTICO: Violação de constraint (chave primária, foreign key, etc.)');
        console.log('💡 SOLUÇÃO: Verificar dados duplicados ou referências inválidas');
      } else {
        console.log('\n🔍 DIAGNÓSTICO: Erro não identificado automaticamente');
        console.log('💡 SOLUÇÃO: Analisar logs detalhados do erro');
      }
    } else {
      console.log('✅ Função executada com sucesso!');
      console.log('📊 Resultado:', functionExists);
    }
    
    // Teste 3: Verificar se os dados foram inseridos
    console.log('\n3️⃣ Verificando se os dados foram inseridos...');
    
    // Verificar user_preferences
    const { data: prefsData, error: prefsSelectError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('id', testUser.id);
    
    if (prefsSelectError) {
      console.error('❌ Erro ao buscar user_preferences:', prefsSelectError.message);
    } else if (prefsData && prefsData.length > 0) {
      console.log('✅ Dados encontrados em user_preferences:', prefsData[0]);
    } else {
      console.log('⚠️ Nenhum dado encontrado em user_preferences');
    }
    
    // Verificar user_profiles
    const { data: profileData, error: profileSelectError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', testUser.id);
    
    if (profileSelectError) {
      console.error('❌ Erro ao buscar user_profiles:', profileSelectError.message);
    } else if (profileData && profileData.length > 0) {
      console.log('✅ Dados encontrados em user_profiles:', profileData[0]);
    } else {
      console.log('⚠️ Nenhum dado encontrado em user_profiles');
    }
    
  } catch (error) {
    console.error('💥 Erro inesperado durante o teste:', error);
  }
  
  // Limpeza: remover dados de teste
  console.log('\n🧹 Limpando dados de teste...');
  
  try {
    await supabase.from('user_profiles').delete().eq('user_id', testUser.id);
    await supabase.from('user_preferences').delete().eq('id', testUser.id);
    console.log('✅ Dados de teste removidos');
  } catch (cleanupError) {
    console.log('⚠️ Erro na limpeza (pode ser ignorado):', cleanupError.message);
  }
  
  console.log('\n🏁 Teste concluído!');
}

// Executar o teste
testRegistration().catch(console.error);

// Exportar para uso em outros testes
module.exports = { testRegistration, testUser };