import { createSupabaseServerClient } from '@/lib/supabase-server';
import { userIsAdmin } from '@/lib/user-status';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('account_status')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!profile || !userIsAdmin(profile.account_status)) {
    redirect('/insights');
  }

  // Fetch stats
  const { count: usersCount } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
  const { count: modulesCount } = await supabase.from('modules').select('*', { count: 'exact', head: true });
  const { count: lessonsCount } = await supabase.from('lessons').select('*', { count: 'exact', head: true });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Painel Administrativo SOFIA</h1>
          <Link href="/insights">
            <Button variant="outline">Voltar para App</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Usuários Totais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersCount || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Módulos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{modulesCount || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aulas Cadastradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lessonsCount || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Gerenciamento de Usuários</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Visualize e gerencie usuários, planos e permissões.
                    </p>
                    <div className="flex flex-col gap-2">
                        <Link href="/admin/users">
                            <Button className="w-full justify-start" variant="secondary">
                                👥 Gerenciar Usuários
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Gerenciamento de Conteúdo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Gerencie módulos, aulas e permissões de acesso.
                    </p>
                    <div className="flex flex-col gap-2">
                        <Link href="/admin/modules">
                            <Button className="w-full justify-start" variant="secondary">
                                📝 Gerenciar Módulos
                            </Button>
                        </Link>
                        <Link href="/admin/lessons">
                            <Button className="w-full justify-start" variant="secondary">
                                🎥 Gerenciar Aulas
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Ferramentas de Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border rounded-md bg-yellow-500/10 border-yellow-500/20">
                        <h4 className="font-semibold text-yellow-500 mb-1">Database Seed</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                            Popular o banco de dados com conteúdo inicial. Use com cautela.
                        </p>
                        <form action="/api/admin/seed" method="POST">
                             <input type="hidden" name="secret" value={process.env.SEED_SECRET || ''} />
                             <Button type="submit" variant="destructive" size="sm" disabled>
                                Desabilitado em Produção
                             </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
