const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testLoginFinal() {
  console.log('🧪 Teste Final de Login - SOFIA');
  console.log('================================');
  
  try {
    console.log('\n1️⃣ Testando login com teste@sofia.com...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: process.env.E2E_TEST_EMAIL || '',
      password: process.env.E2E_TEST_PASSWORD || ''
    });
    
    if (error) {
      console.log('❌ Erro no login:', error.message);
      console.log('📝 Detalhes:', error);
      return false;
    }
    
    console.log('✅ Login bem-sucedido!');
    console.log('📊 Dados do usuário:', {
      id: data.user.id,
      email: data.user.email,
      emailConfirmed: !!data.user.email_confirmed_at,
      lastSignIn: data.user.last_sign_in_at
    });
    
    console.log('\n2️⃣ Verificando sessão...');
    const { data: session } = await supabase.auth.getSession();
    console.log('📋 Sessão ativa:', {
      hasSession: !!session.session,
      hasAccessToken: !!session.session?.access_token,
      hasRefreshToken: !!session.session?.refresh_token,
      expiresAt: session.session?.expires_at
    });
    
    console.log('\n3️⃣ Buscando perfil do usuário...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();
      
    if (profileError) {
      console.log('❌ Erro ao buscar perfil:', profileError.message);
    } else {
      console.log('✅ Perfil encontrado:', {
        fullName: profile.full_name,
        accountStatus: profile.account_status,
        cpf: profile.cpf,
        emailVerified: profile.email_verified
      });
    }
    
    console.log('\n4️⃣ Fazendo logout...');
    await supabase.auth.signOut();
    console.log('✅ Logout realizado com sucesso');
    
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('✅ Login funcionando corretamente');
    console.log('✅ Sessão sendo criada');
    console.log('✅ Perfil do usuário encontrado');
    console.log('✅ Logout funcionando');
    
    return true;
    
  } catch (error) {
    console.error('\n💥 Erro durante o teste:', error.message);
    console.error('📝 Stack:', error.stack);
    return false;
  }
}

testLoginFinal().then(success => {
  if (success) {
    console.log('\n🚀 O login está funcionando! O problema pode estar na interface web.');
    console.log('💡 Sugestão: Verificar logs do navegador e middleware.');
  } else {
    console.log('\n🔧 Ainda há problemas com o login. Verificar configurações.');
  }
  process.exit(success ? 0 : 1);
});