// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// As variáveis de ambiente do Next.js precisam ser prefixadas com NEXT_PUBLIC_ para estarem disponíveis no frontend
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Frontend Supabase URL:', supabaseUrl); // ADICIONE ESTA LINHA
console.log('Frontend Supabase Anon Key (partial):', supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'NÃO CARREGADA'); // ADICIONE ESTA LINHA

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'ERRO CRÍTICO NO FRONTEND: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não estão definidas.'
  );
  // Em produção, você pode querer redirecionar para uma página de erro ou exibir uma mensagem amigável.
  // Por enquanto, apenas logamos o erro.
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!); // O '!' afirma que não serão nulas, após a verificação