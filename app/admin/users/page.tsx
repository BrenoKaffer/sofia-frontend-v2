import { createSupabaseServerClient } from '@/lib/supabase-server';
import { userIsAdmin, UserRole, AccountStatus } from '@/lib/user-status';
import { redirect } from 'next/navigation';
import { UsersTable } from './UsersTable';

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServerClient();
  
  // 1. Auth Check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  // 2. Permission Check (Hybrid)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('account_status, role')
    .eq('user_id', session.user.id)
    .maybeSingle();

  const isRoleAdmin = profile?.role === UserRole.ADMIN || profile?.role === UserRole.SUPERADMIN;
  const isLegacyAdmin = profile && userIsAdmin(profile.account_status);

  if (!profile || (!isRoleAdmin && !isLegacyAdmin)) {
    redirect('/dashboard');
  }

  // 3. Fetch Data
  const { data: users, count } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie acesso, planos e permissões dos usuários.
            </p>
          </div>
        </div>

        <UsersTable 
          initialUsers={users || []} 
          initialCount={count || 0} 
        />
      </div>
    </div>
  );
}
