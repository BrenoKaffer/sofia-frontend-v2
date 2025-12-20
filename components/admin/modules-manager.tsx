'use client';

import { useState } from 'react';
import { Module } from '@/types/lessons';
import { updateModule, deleteModule, createModule } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ModulesManagerProps {
  initialModules: Module[];
}

export function ModulesManager({ initialModules }: ModulesManagerProps) {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState({ title: '', order: 0 });
  const router = useRouter();

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await updateModule(id, { published: !currentStatus });
      toast.success('Status atualizado');
      router.refresh();
    } catch (error) {
      toast.error('Erro ao atualizar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este módulo? Todas as aulas serão afetadas.')) return;
    try {
      await deleteModule(id);
      toast.success('Módulo excluído');
      router.refresh();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      await createModule({ title: formData.title, order: Number(formData.order) });
      toast.success('Módulo criado');
      setIsCreateOpen(false);
      setFormData({ title: '', order: 0 });
      router.refresh();
    } catch (error) {
      toast.error('Erro ao criar');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!currentModule) return;
    setLoading(true);
    try {
      await updateModule(currentModule.id, { title: formData.title, order: Number(formData.order) });
      toast.success('Módulo atualizado');
      setIsEditOpen(false);
      setCurrentModule(null);
      router.refresh();
    } catch (error) {
      toast.error('Erro ao atualizar');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (mod: Module) => {
    setCurrentModule(mod);
    setFormData({ title: mod.title, order: mod.order });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Módulos ({modules.length})</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Novo Módulo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Módulo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="Ex: Introdução"
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
              <TableHead className="w-[80px]">Ordem</TableHead>
              <TableHead>Título</TableHead>
              <TableHead className="w-[100px]">Publicado</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.map((mod) => (
              <TableRow key={mod.id}>
                <TableCell className="font-medium">{mod.order}</TableCell>
                <TableCell>{mod.title}</TableCell>
                <TableCell>
                  <Switch 
                    checked={mod.published !== false} 
                    onCheckedChange={() => handleTogglePublish(mod.id, mod.published !== false)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(mod)}>
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(mod.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Módulo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
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
