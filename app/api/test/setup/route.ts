import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action: string = body?.action;

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    if (action === 'create-test-user') {
      const user = body?.user || {};
      const email: string = user.email || 'test@example.com';
      const password: string = user.password || 'testpassword123';
      const name: string = user.name || 'Test User';

      // Try to create user; if already exists, handle accordingly
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          cpf: '123.456.789-00',
        },
      });

      if (createError) {
        const msg = createError.message?.toLowerCase() || '';
        if (msg.includes('already') || msg.includes('exists')) {
          return NextResponse.json({ status: 'exists', email });
        }
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      const userId = createData.user.id;

      // Upsert user profile with premium status
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          full_name: name,
          cpf: '123.456.789-00',
          email,
          account_status: 'premium',
          permissions: { roles: ['user'] },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any, { onConflict: 'user_id' as any });

      // Upsert user preferences default (best-effort)
      await supabase
        .from('user_preferences')
        .upsert({
          id: userId,
          user_id: userId,
          language: 'pt-BR',
          theme: 'system',
          notifications_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any, { onConflict: 'id' as any });

      return NextResponse.json({ status: 'created', email, userId });
    }

    if (action === 'seed-dashboard-data') {
      // Accept payload but this is a placeholder for tests
      return NextResponse.json({ status: 'seeded' });
    }

    if (action === 'cleanup-test-user') {
      const email: string = body?.email || 'test@example.com';
      // List users and find by email
      const { data: list, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        return NextResponse.json({ error: listError.message }, { status: 500 });
      }
      const found = list.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
      if (!found) {
        return NextResponse.json({ status: 'not_found', email });
      }
      const userId = found.id;

      await supabase.from('user_profiles').delete().eq('user_id', userId);
      await supabase.from('user_preferences').delete().eq('id', userId);
      await supabase.auth.admin.deleteUser(userId);

      return NextResponse.json({ status: 'deleted', email });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}