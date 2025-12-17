const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixExistingUsers() {
  console.log('🔧 Corrigindo perfis de usuários existentes...');
  
  try {
    // Listar usuários do auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Erro ao listar usuários auth:', authError.message);
      return;
    }
    
    // Verificar perfis existentes
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id');
      
    if (profileError) {
      console.log('❌ Erro ao buscar perfis:', profileError.message);
      return;
    }
    
    const profileUserIds = profiles.map(p => p.user_id);
    const usersWithoutProfile = authUsers.users.filter(u => !profileUserIds.includes(u.id));
    
    console.log(`📋 Encontrados ${usersWithoutProfile.length} usuários sem perfil`);
    
    // Criar perfil para cada usuário sem perfil
    for (const user of usersWithoutProfile) {
      console.log(`🔄 Criando perfil para: ${user.email}`);
      
      const { data, error } = await supabase.rpc('create_user_profile', {
        p_user_id: user.id,
        p_full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        p_cpf: user.user_metadata?.cpf || '00000000000',
        p_email: user.email
      });
      
      if (error) {
        console.log(`❌ Erro ao criar perfil para ${user.email}:`, error.message);
      } else {
        console.log(`✅ Perfil criado para ${user.email}`);
      }
    }
    
    console.log('🎉 Correção concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixExistingUsers();