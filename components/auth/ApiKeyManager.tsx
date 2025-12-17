'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Copy, Key, Trash2, Plus, Eye, EyeOff } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  permissions: string[];
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
  is_active: boolean;
}

interface NewApiKeyData {
  key: string;
  keyInfo: ApiKey;
}

const PERMISSION_OPTIONS = [
  { value: 'signals:read', label: 'Ler Sinais' },
  { value: 'signals:write', label: 'Escrever Sinais' },
  { value: 'kpis:read', label: 'Ler KPIs' },
  { value: 'history:read', label: 'Ler Histórico' },
  { value: 'realtime:read', label: 'Dados em Tempo Real' },
  { value: 'admin', label: 'Administrador' }
];

export default function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyData, setNewKeyData] = useState<NewApiKeyData | null>(null);
  const [showKey, setShowKey] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    permissions: [] as string[],
    expiresInDays: ''
  });

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const response = await fetch('/api/auth/api-keys', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar API Keys');
      }

      const data = await response.json();
      setApiKeys(data.data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar API Keys: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome da API Key é obrigatório');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/auth/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          permissions: formData.permissions,
          expiresInDays: formData.expiresInDays ? parseInt(formData.expiresInDays) : undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar API Key');
      }

      const data = await response.json();
      setNewKeyData(data.data);
      setApiKeys(prev => [data.data.keyInfo, ...prev]);
      
      // Reset form
      setFormData({ name: '', permissions: [], expiresInDays: '' });
      setShowCreateDialog(false);
      
      toast.success('API Key criada com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao criar API Key: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Tem certeza que deseja revogar esta API Key?')) {
      return;
    }

    try {
      const response = await fetch(`/api/auth/api-keys?keyId=${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao revogar API Key');
      }

      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      toast.success('API Key revogada com sucesso');
    } catch (error: any) {
      toast.error('Erro ao revogar API Key: ' + error.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPermissionLabel = (permission: string) => {
    const option = PERMISSION_OPTIONS.find(opt => opt.value === permission);
    return option?.label || permission;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nova API Key criada */}
      {newKeyData && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Key className="h-5 w-5" />
              Nova API Key Criada
            </CardTitle>
            <CardDescription className="text-green-700">
              ⚠️ Esta é a única vez que você verá esta chave. Copie e guarde em local seguro!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>API Key</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={newKeyData.key}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(newKeyData.key)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setNewKeyData(null)}
                className="w-full"
              >
                Entendi, fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gerenciar API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Gerencie suas chaves de API para integração com sistemas externos
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova API Key</DialogTitle>
                  <DialogDescription>
                    Configure as permissões e validade da nova API Key
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Integração Sistema X"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Permissões</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {PERMISSION_OPTIONS.map(option => (
                        <label key={option.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(option.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  permissions: [...prev.permissions, option.value]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  permissions: prev.permissions.filter(p => p !== option.value)
                                }));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="expires">Expira em (dias)</Label>
                    <Input
                      id="expires"
                      type="number"
                      placeholder="Deixe vazio para nunca expirar"
                      value={formData.expiresInDays}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiresInDays: e.target.value }))}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={createApiKey}
                      disabled={creating}
                      className="flex-1"
                    >
                      {creating ? 'Criando...' : 'Criar API Key'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma API Key encontrada</p>
              <p className="text-sm">Crie sua primeira API Key para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map(apiKey => (
                <div key={apiKey.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{apiKey.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">
                          Criada em {formatDate(apiKey.created_at)}
                        </span>
                        {apiKey.last_used_at && (
                          <span className="text-sm text-gray-500">
                            • Último uso: {formatDate(apiKey.last_used_at)}
                          </span>
                        )}
                        {apiKey.expires_at && (
                          <span className="text-sm text-orange-600">
                            • Expira em {formatDate(apiKey.expires_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {apiKey.permissions.map(permission => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {getPermissionLabel(permission)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeApiKey(apiKey.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}