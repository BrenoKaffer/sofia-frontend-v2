'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Upload, 
  Trash2, 
  Shield, 
  Clock, 
  HardDrive,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Database
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { useAuth } from '@/hooks/use-sofia-auth';
import { toast } from '@/hooks/use-toast';

interface Backup {
  id: string;
  timestamp: string;
  version: string;
  size: number;
  user_id: string;
}

interface BackupStats {
  total_backups: number;
  total_size: number;
  last_backup: string | null;
  oldest_backup: string | null;
}

export default function BackupPage() {
  const { getToken } = useAuth();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [stats, setStats] = useState<BackupStats>({
    total_backups: 0,
    total_size: 0,
    last_backup: null,
    oldest_backup: null
  });

  // Carregar lista de backups
  const loadBackups = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      const response = await fetch('/api/user-backup', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar backups');
      }

      const data = await response.json();
      setBackups(data.backups || []);
      
      // Calcular estatísticas
      const totalSize = data.backups.reduce((sum: number, backup: Backup) => sum + backup.size, 0);
      const timestamps = data.backups.map((b: Backup) => b.timestamp).sort();
      
      setStats({
        total_backups: data.backups.length,
        total_size: totalSize,
        last_backup: timestamps[timestamps.length - 1] || null,
        oldest_backup: timestamps[0] || null
      });
    } catch (error) {
      console.error('Erro ao carregar backups:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os backups',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar novo backup
  const createBackup = async () => {
    try {
      setCreating(true);
      const token = await getToken();
      
      const response = await fetch('/api/user-backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao criar backup');
      }

      const data = await response.json();
      
      toast({
        title: 'Sucesso',
        description: 'Backup criado com sucesso',
      });
      
      await loadBackups();
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o backup',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  // Restaurar backup
  const restoreBackup = async (backupId: string) => {
    try {
      setRestoring(backupId);
      const token = await getToken();
      
      const response = await fetch('/api/user-backup', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backup_id: backupId }),
      });

      if (!response.ok) {
        throw new Error('Erro ao restaurar backup');
      }

      toast({
        title: 'Sucesso',
        description: 'Backup restaurado com sucesso. Recarregue a página para ver as alterações.',
      });
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível restaurar o backup',
        variant: 'destructive'
      });
    } finally {
      setRestoring(null);
    }
  };

  // Excluir backup
  const deleteBackup = async (backupId: string) => {
    try {
      setDeleting(backupId);
      const token = await getToken();
      
      const response = await fetch(`/api/user-backup?backup_id=${backupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir backup');
      }

      toast({
        title: 'Sucesso',
        description: 'Backup excluído com sucesso',
      });
      
      await loadBackups();
    } catch (error) {
      console.error('Erro ao excluir backup:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o backup',
        variant: 'destructive'
      });
    } finally {
      setDeleting(null);
    }
  };

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  useEffect(() => {
    loadBackups();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Backup e Restauração</h1>
            <p className="text-muted-foreground">
              Gerencie backups dos seus dados e configurações
            </p>
          </div>
          <Button 
            onClick={createBackup} 
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {creating ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {creating ? 'Criando...' : 'Criar Backup'}
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Backups</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_backups}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Espaço Utilizado</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(stats.total_size)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Último Backup</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {stats.last_backup ? formatDate(stats.last_backup) : 'Nenhum'}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Protegido</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações importantes */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Os backups incluem suas configurações, preferências, estratégias e histórico recente. 
            Recomendamos criar backups regulares antes de fazer alterações importantes.
          </AlertDescription>
        </Alert>

        {/* Lista de Backups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Backups Disponíveis</span>
            </CardTitle>
            <CardDescription>
              Lista de todos os backups criados, ordenados do mais recente para o mais antigo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando backups...</span>
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum backup encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro backup para proteger seus dados
                </p>
                <Button onClick={createBackup} disabled={creating}>
                  <Download className="mr-2 h-4 w-4" />
                  Criar Primeiro Backup
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {backups.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Database className="h-8 w-8 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">{backup.id}</h4>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              {formatDate(backup.timestamp)}
                            </span>
                            <span className="flex items-center">
                              <HardDrive className="mr-1 h-3 w-3" />
                              {formatFileSize(backup.size)}
                            </span>
                            <Badge variant="outline">{backup.version}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreBackup(backup.id)}
                        disabled={restoring === backup.id}
                      >
                        {restoring === backup.id ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {restoring === backup.id ? 'Restaurando...' : 'Restaurar'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBackup(backup.id)}
                        disabled={deleting === backup.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        {deleting === backup.id ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        {deleting === backup.id ? 'Excluindo...' : 'Excluir'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Como funciona o sistema de backup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">O que é incluído no backup:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Configurações de usuário e preferências</li>
                  <li>• Estratégias personalizadas</li>
                  <li>• Configurações de notificações</li>
                  <li>• Layout do dashboard</li>
                  <li>• Histórico recente de sinais (últimos 100)</li>
                  <li>• Dados de performance</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Recomendações:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Crie backups antes de grandes alterações</li>
                  <li>• Mantenha pelo menos 3 backups recentes</li>
                  <li>• Exclua backups antigos para economizar espaço</li>
                  <li>• Teste a restauração periodicamente</li>
                  <li>• Backups são armazenados localmente no servidor</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}