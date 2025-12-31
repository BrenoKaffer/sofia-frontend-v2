'use client';

import { useState } from 'react';
import { Lesson, Module } from '@/types/lessons';
import { updateLesson, deleteLesson, createLesson } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Pencil, Trash2, Plus, Loader2, Star, Unlock, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface LessonsManagerProps {
  initialLessons: Lesson[];
  modules: Module[];
}

export function LessonsManager({ initialLessons, modules }: LessonsManagerProps) {
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    subtitle: '', 
    order: 0, 
    module_id: '',
    video_url: '',
    mux_playback_id: '',
    category: 'Aula'
  });
  const router = useRouter();

  const filteredLessons = selectedModule === 'all' 
    ? lessons 
    : lessons.filter(l => l.module_id === selectedModule);

  // Sorting: by module order (if available) then lesson order
  // For simplicity, we just sort by lesson order here as we filter by module usually
  filteredLessons.sort((a, b) => a.order - b.order);

  const handleToggle = async (id: string, field: 'published' | 'featured' | 'is_free', currentValue: boolean) => {
    try {
      await updateLesson(id, { [field]: !currentValue });
      toast.success('Atualizado com sucesso');
      router.refresh();
    } catch (error) {
      toast.error('Erro ao atualizar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta aula?')) return;
    try {
      await deleteLesson(id);
      toast.success('Aula excluída');
      router.refresh();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const handleCreate = async () => {
    if (!formData.module_id) {
        toast.error('Selecione um módulo');
        return;
    }
    setLoading(true);
    try {
      await createLesson({ 
          ...formData, 
          order: Number(formData.order),
          published: true,
          is_free: false
      });
      toast.success('Aula criada');
      setIsCreateOpen(false);
      setFormData({ 
        title: '', subtitle: '', order: 0, module_id: '', video_url: '', mux_playback_id: '', category: 'Aula'
      });
      router.refresh();
    } catch (error) {
      toast.error('Erro ao criar: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!currentLesson) return;
    setLoading(true);
    try {
      await updateLesson(currentLesson.id, { 
          title: formData.title, 
          subtitle: formData.subtitle,
          order: Number(formData.order),
          video_url: formData.video_url,
          mux_playback_id: formData.mux_playback_id
      });
      toast.success('Aula atualizada');
      setIsEditOpen(false);
      setCurrentLesson(null);
      router.refresh();
    } catch (error) {
      toast.error('Erro ao atualizar');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setFormData({ 
        title: lesson.title, 
        subtitle: lesson.subtitle || '', 
        order: lesson.order, 
        module_id: lesson.module_id,
        video_url: lesson.video_url || '',
        mux_playback_id: lesson.mux_playback_id || '',
        category: lesson.category
    });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Aulas ({filteredLessons.length})</h2>
            <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar por Módulo" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Módulos</SelectItem>
                    {modules.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Nova Aula
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Aula</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Título</label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="Ex: Como começar"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Subtítulo / Descrição</label>
                <Input 
                  value={formData.subtitle} 
                  onChange={(e) => setFormData({...formData, subtitle: e.target.value})} 
                  placeholder="Breve descrição do conteúdo"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Módulo</label>
                <Select 
                    value={formData.module_id} 
                    onValueChange={(val) => setFormData({...formData, module_id: val})}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                        {modules.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ordem</label>
                <Input 
                  type="number" 
                  value={formData.order} 
                  onChange={(e) => setFormData({...formData, order: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Video URL (Opcional)</label>
                <Input 
                  value={formData.video_url} 
                  onChange={(e) => setFormData({...formData, video_url: e.target.value})} 
                  placeholder="https://..."
                />
              </div>
               <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Mux Playback ID (Prioritário)</label>
                <Input 
                  value={formData.mux_playback_id} 
                  onChange={(e) => setFormData({...formData, mux_playback_id: e.target.value})} 
                  placeholder="Ex: 83jNROLYY..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Ord</TableHead>
              <TableHead>Título</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[100px]">Acesso</TableHead>
              <TableHead className="w-[100px]">Hero</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLessons.map((lesson) => (
              <TableRow key={lesson.id}>
                <TableCell className="font-medium">{lesson.order}</TableCell>
                <TableCell>
                    <div className="flex flex-col">
                        <span className="font-medium">{lesson.title}</span>
                        <span className="text-xs text-muted-foreground">{lesson.subtitle}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <Switch 
                            checked={lesson.published !== false} 
                            onCheckedChange={() => handleToggle(lesson.id, 'published', lesson.published !== false)}
                        />
                        <span className="text-xs text-muted-foreground">{lesson.published !== false ? 'Pub' : 'Draft'}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2" title={lesson.is_free ? 'Gratuito' : 'Pro'}>
                        <Switch 
                            checked={lesson.is_free} 
                            onCheckedChange={() => handleToggle(lesson.id, 'is_free', lesson.is_free)}
                        />
                        {lesson.is_free ? <Unlock className="w-3 h-3 text-green-500" /> : <Lock className="w-3 h-3 text-primary" />}
                    </div>
                </TableCell>
                <TableCell>
                     <Button 
                        variant="ghost" 
                        size="sm" 
                        className={lesson.featured ? "text-yellow-500" : "text-muted-foreground"}
                        onClick={() => handleToggle(lesson.id, 'featured', !!lesson.featured)}
                     >
                        <Star className={`w-4 h-4 ${lesson.featured ? "fill-yellow-500" : ""}`} />
                     </Button>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(lesson)}>
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(lesson.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredLessons.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma aula encontrada neste módulo.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Aula</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Título</label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Subtítulo</label>
              <Input 
                value={formData.subtitle} 
                onChange={(e) => setFormData({...formData, subtitle: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ordem</label>
              <Input 
                type="number" 
                value={formData.order} 
                onChange={(e) => setFormData({...formData, order: Number(e.target.value)})} 
              />
            </div>
             <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Mux Playback ID</label>
                <Input 
                  value={formData.mux_playback_id} 
                  onChange={(e) => setFormData({...formData, mux_playback_id: e.target.value})} 
                />
              </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
