// Endpoint de debug para testar geração de links
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email, testType } = await request.json();
    
    console.log('=== DEBUG FORGOT PASSWORD ===');
    console.log('Email recebido:', email);
    console.log('Tipo de teste:', testType);
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Variáveis não configuradas' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    // Testar diferentes configurações
    const configs = [
      { name: 'Config Padrão', redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password` },
      { name: 'Config com Hash', redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password#teste=123` },
      { name: 'Config com Params', redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?debug=true` }
    ];
    
    const results = [];
    
    for (const config of configs) {
      try {
        console.log(`\n--- Testando: ${config.name} ---`);
        console.log('RedirectTo:', config.redirectTo);
        
        const { data, error } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: { redirectTo: config.redirectTo }
        });
        
        if (error) {
          console.log(`Erro ${config.name}:`, error);
          results.push({ config: config.name, error: error.message });
        } else {
          console.log(`Sucesso ${config.name}:`, data.properties?.action_link?.substring(0, 100));
          results.push({ 
            config: config.name, 
            link: data.properties?.action_link,
            hasCode: data.properties?.action_link?.includes('code='),
            hasAccessToken: data.properties?.action_link?.includes('access_token='),
            hasHash: data.properties?.action_link?.includes('#')
          });
        }
      } catch (err: any) {
        console.log(`Exception ${config.name}:`, err);
        results.push({ config: config.name, error: err.message || 'Unknown error' });
      }
    }
    
    return NextResponse.json({ results, timestamp: new Date().toISOString() });
    
  } catch (error: any) {
    console.error('Erro no debug:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}