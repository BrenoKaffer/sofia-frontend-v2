const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente do .env.local
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente faltando: NEXT_PUBLIC_SUPABASE_URL e/ou NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuth(email, password) {
  console.log('🧪 Teste de Autenticação (Supabase Auth)');
  console.log('======================================');
  console.log('📧 Email:', email);
  console.log('⚠️ A senha não será exibida por segurança.');

  try {
    // 1) Login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('❌ Erro no login:', error.message);
      console.log('📝 Detalhes:', { name: error.name, status: error.status, code: error.code });
      process.exit(2);
    }

    console.log('✅ Login bem-sucedido!');
    console.log('👤 Usuário:', { id: data.user.id, email: data.user.email });

    // 2) Sessão
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.log('⚠️ Erro ao obter sessão:', sessionError.message);
    } else {
      const s = sessionData.session;
      console.log('📋 Sessão:', {
        active: !!s,
        hasAccessToken: !!s?.access_token,
        expiresAt: s?.expires_at,
      });
    }

    // 3) Perfil
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name, account_status, email_verified')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (profileError) {
      console.log('⚠️ Erro ao buscar perfil:', profileError.message);
    } else if (!profile) {
      console.log('⚠️ Perfil não encontrado para este usuário.');
    } else {
      console.log('✅ Perfil encontrado:', profile);
    }

    // 4) Logout
    await supabase.auth.signOut();
    console.log('✅ Logout realizado com sucesso');

    console.log('\n🎉 Teste de autenticação concluído');
    process.exit(0);
  } catch (err) {
    console.error('💥 Erro inesperado no teste:', err.message);
    process.exit(3);
  }
}

// LER CREDENCIAIS VIA ARGS PARA NÃO FIXAR EM CÓDIGO
const [,, emailArg, passwordArg] = process.argv;
if (!emailArg || !passwordArg) {
  console.error('Uso: node scripts/test-auth.js <email> <senha>');
  process.exit(1);
}

testAuth(emailArg, passwordArg);