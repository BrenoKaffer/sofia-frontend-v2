import { createSupabaseServerClient } from '@/lib/supabase-server';
import { LessonsManager } from '@/components/admin/lessons-manager';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function AdminLessonsPage() {
  const supabase = await createSupabaseServerClient();
  
  // Fetch modules for filtering
  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .order('order', { ascending: true });

  // Fetch all lessons
  // Warning: For a very large platform, this should be paginated. 
  // For now (hundreds of lessons), fetching all is fine for admin UX.
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .order('order', { ascending: true });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Gerenciar Aulas</h1>
        </div>
        
        <LessonsManager 
            initialLessons={lessons || []} 
            modules={modules || []} 
        />
      </div>
    </div>
  );
}
