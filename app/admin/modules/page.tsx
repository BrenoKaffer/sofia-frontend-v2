import { createSupabaseServerClient } from '@/lib/supabase-server';
import { ModulesManager } from '@/components/admin/modules-manager';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function AdminModulesPage() {
  const supabase = await createSupabaseServerClient();
  
  // Fetch modules ordered by 'order'
  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .order('order', { ascending: true });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Gerenciar Módulos</h1>
        </div>
        
        <ModulesManager initialModules={modules || []} />
      </div>
    </div>
  );
}
