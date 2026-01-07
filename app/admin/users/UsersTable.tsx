'use client';

import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserStatus, UserPlan, UserRole, AccountStatus, getStatusColor, getStatusLabel } from '@/lib/user-status';
import { updateUser, getUsers } from '../actions';
import { useRouter } from 'next/navigation';

interface UserProfile {
  user_id: string;
  email: string;
  full_name: string;
  status: string;
  plan: string;
  role: string;
  account_status: string;
  created_at: string;
}

interface UsersTableProps {
  initialUsers: UserProfile[];
  initialCount: number;
}

export function UsersTable({ initialUsers, initialCount }: UsersTableProps) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  // Edit Form State
  const [formData, setFormData] = useState({
    status: '',
    plan: '',
    role: ''
  });

  const handleSearch = async (term: string) => {
    setSearch(term);
    setLoading(true);
    try {
      const { data } = await getUsers(1, 50, term);
      setUsers(data as UserProfile[]);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      status: user.status || UserStatus.ACTIVE,
      plan: user.plan || UserPlan.FREE,
      role: user.role || UserRole.USER
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setLoading(true);
    try {
      await updateUser(editingUser.user_id, formData);
      
      // Update local state
      setUsers(users.map(u => u.user_id === editingUser.user_id ? { ...u, ...formData } : u));
      setIsDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Erro ao atualizar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input 
          placeholder="Buscar por email ou nome..." 
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          Total: {initialCount} usuários
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Permissão</TableHead>
              <TableHead>Legado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.full_name || 'Sem nome'}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                    {getStatusLabel(user.status || 'active')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{user.plan || 'Free'}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{user.role || 'User'}</Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {user.account_status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right text-sm font-medium">Status</span>
              <Select 
                value={formData.status} 
                onValueChange={(val) => setFormData({...formData, status: val})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserStatus).map((s) => (
                    <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right text-sm font-medium">Plano</span>
              <Select 
                value={formData.plan} 
                onValueChange={(val) => setFormData({...formData, plan: val})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserPlan).map((p) => (
                    <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right text-sm font-medium">Role</span>
              <Select 
                value={formData.role} 
                onValueChange={(val) => setFormData({...formData, role: val})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a permissão" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserRole).map((r) => (
                    <SelectItem key={r} value={r}>{r.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
