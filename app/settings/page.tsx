'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Settings, Bell, Moon, Sun, Globe, Key, Shield, Upload, Trash2, Save, AlertTriangle, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { useDashboardPreferences } from '@/hooks/use-dashboard-preferences';

interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    signals: boolean;
    system: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    compactMode: boolean;
  };
  privacy: {
    shareData: boolean;
    analytics: boolean;
  };
  favorites: {
    roulettes: string[];
    strategies: string[];
  };
  integration: {
    apiKey: string;
    webhookUrl: string;
  };
  dashboard: {
    showStatsCards: boolean;
    showLiveSignals: boolean;
    showPerformanceChart: boolean;
    showRouletteStatus: boolean;
    showRecentActivity: boolean;
  };
}

const defaultSettings: UserSettings = {
  notifications: {
    email: true,
    push: true,
    signals: true,
    system: false,
  },
  appearance: {
    theme: 'system',
    language: 'pt-BR',
    compactMode: false,
  },
  privacy: {
    shareData: true,
    analytics: true,
  },
  favorites: {
    roulettes: ['Evolution Lightning', 'Pragmatic Speed'],
    strategies: ['Fibonacci Reversal', 'Hot Numbers'],
  },
  integration: {
    apiKey: 'sk_live_51NxXXXXXXXXXXXXXXXXXXXXX',
    webhookUrl: 'https://webhook.site/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  },
  dashboard: {
    showStatsCards: true,
    showLiveSignals: true,
    showPerformanceChart: true,
    showRouletteStatus: true,
    showRecentActivity: true,
  },
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { preferences: dashboardPreferences, updatePreferences } = useDashboardPreferences();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: user?.name || 'Usuário SOFIA',
    email: user?.email || 'usuario@exemplo.com',
    bio: 'Trader e entusiasta de estratégias para roleta online.',
  });

  const handleSettingChange = (category: keyof UserSettings, setting: string, value: any) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [setting]: value,
      },
    });
  };

  const saveChanges = () => {
    // Aqui seria implementada a lógica para salvar as alterações no backend
    setIsEditing(false);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-heading font-bold tracking-tight">Configurações</h1>
          <Button onClick={saveChanges} className="gap-2">
            <Save className="h-4 w-4" />
            <span className="font-sans">Salvar Alterações</span>
          </Button>
        </div>

        <Tabs defaultValue="profile">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="profile" className="gap-2 font-sans">
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2 font-sans">
                <Settings className="h-4 w-4" />
                Preferências
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="gap-2 font-sans">
                <LayoutDashboard className="h-4 w-4" />
                Personalizar Dashboard
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2 font-sans">
                <Bell className="h-4 w-4" />
                Notificações
              </TabsTrigger>
              <TabsTrigger value="integrations" className="gap-2 font-sans">
                <Key className="h-4 w-4" />
                Integrações
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profile" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Informações do Perfil</CardTitle>
                <CardDescription className="font-sans">
                  Atualize suas informações pessoais e foto de perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user?.avatar} alt={userProfile.name} />
                      <AvatarFallback className="text-2xl">
                        {userProfile.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Upload className="h-4 w-4" />
                      <span className="font-sans">Alterar Foto</span>
                    </Button>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="font-sans">Nome</Label>
                        <Input
                          id="name"
                          value={userProfile.name}
                          onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="font-sans">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={userProfile.email}
                          onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="font-sans">Bio</Label>
                      <Textarea
                        id="bio"
                        value={userProfile.bio}
                        onChange={(e) => setUserProfile({...userProfile, bio: e.target.value})}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-lg font-heading font-medium">Assinatura</h3>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium font-sans">Plano Atual</h4>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          Gratuito
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-sans">
                        Válido até 15/11/2023
                      </p>
                    </div>
                    <Button variant="outline">Gerenciar Assinatura</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                <CardDescription>
                  Ações irreversíveis para sua conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Excluir Conta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Excluir sua conta?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta
                        e removerá seus dados de nossos servidores.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sim, excluir minha conta
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>
                  Personalize a aparência da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <span className="text-sm text-muted-foreground">
                      Escolha entre tema claro, escuro ou siga as configurações do sistema
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select 
                    value={settings.appearance.language} 
                    onValueChange={(value) => handleSettingChange('appearance', 'language', value)}
                  >
                    <SelectTrigger className="w-full md:w-80">
                      <SelectValue placeholder="Selecione um idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo Compacto</Label>
                    <p className="text-sm text-muted-foreground">
                      Reduz o espaçamento e tamanho dos elementos para mostrar mais conteúdo
                    </p>
                  </div>
                  <Switch
                    checked={settings.appearance.compactMode}
                    onCheckedChange={(value) => handleSettingChange('appearance', 'compactMode', value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Roletas Favoritas</CardTitle>
                <CardDescription>
                  Selecione suas roletas preferidas para monitoramento rápido
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['Evolution Lightning', 'Pragmatic Speed', 'Playtech Quantum', 'Evolution Immersive', 'Authentic Gaming', 'Evolution Auto'].map((roulette) => {
                    const isSelected = settings.favorites.roulettes.includes(roulette);
                    return (
                      <Badge 
                        key={roulette} 
                        variant={isSelected ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const newRoulettes = isSelected
                            ? settings.favorites.roulettes.filter(r => r !== roulette)
                            : [...settings.favorites.roulettes, roulette];
                          handleSettingChange('favorites', 'roulettes', newRoulettes);
                        }}
                      >
                        {roulette}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacidade</CardTitle>
                <CardDescription>
                  Gerencie suas configurações de privacidade e dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compartilhar Dados de Uso</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite que compartilhemos dados anônimos para melhorar o sistema
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.shareData}
                    onCheckedChange={(value) => handleSettingChange('privacy', 'shareData', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite coleta de dados para análise de desempenho e uso
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.analytics}
                    onCheckedChange={(value) => handleSettingChange('privacy', 'analytics', value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personalizar Dashboard</CardTitle>
                <CardDescription>
                  Escolha quais componentes e métricas deseja visualizar no seu dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Cards de Estatísticas</Label>
                      <p className="text-sm text-muted-foreground">
                        Exibe métricas como Padrões Ativos, Taxa de Acerto, Lucro Total e Estratégias Monitoradas
                      </p>
                    </div>
                    <Switch
                       checked={dashboardPreferences.showStatsCards}
                       onCheckedChange={(value) => updatePreferences({ showStatsCards: value })}
                     />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sinais ao Vivo</Label>
                      <p className="text-sm text-muted-foreground">
                        Mostra os padrões e sinais gerados em tempo real
                      </p>
                    </div>
                    <Switch
                       checked={dashboardPreferences.showLiveSignals}
                       onCheckedChange={(value) => updatePreferences({ showLiveSignals: value })}
                     />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Gráfico de Desempenho</Label>
                      <p className="text-sm text-muted-foreground">
                        Visualiza o histórico de performance e tendências
                      </p>
                    </div>
                    <Switch
                       checked={dashboardPreferences.showPerformanceChart}
                       onCheckedChange={(value) => updatePreferences({ showPerformanceChart: value })}
                     />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Status da Roleta</Label>
                      <p className="text-sm text-muted-foreground">
                        Exibe informações sobre as mesas de roleta monitoradas
                      </p>
                    </div>
                    <Switch
                       checked={dashboardPreferences.showRouletteStatus}
                       onCheckedChange={(value) => updatePreferences({ showRouletteStatus: value })}
                     />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Atividade Recente</Label>
                      <p className="text-sm text-muted-foreground">
                        Mostra o histórico de ações e eventos recentes
                      </p>
                    </div>
                    <Switch
                       checked={dashboardPreferences.showRecentActivity}
                       onCheckedChange={(value) => updatePreferences({ showRecentActivity: value })}
                     />
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4 text-primary" />
                    Prévia da Configuração
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Componentes ativos no seu dashboard:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {dashboardPreferences.showStatsCards && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        Cards de Estatísticas
                      </Badge>
                    )}
                    {dashboardPreferences.showLiveSignals && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        Sinais ao Vivo
                      </Badge>
                    )}
                    {dashboardPreferences.showPerformanceChart && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        Gráfico de Desempenho
                      </Badge>
                    )}
                    {dashboardPreferences.showRouletteStatus && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        Status da Roleta
                      </Badge>
                    )}
                    {dashboardPreferences.showRecentActivity && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        Atividade Recente
                      </Badge>
                    )}
                    {!dashboardPreferences.showStatsCards && !dashboardPreferences.showLiveSignals && 
                     !dashboardPreferences.showPerformanceChart && !dashboardPreferences.showRouletteStatus && 
                     !dashboardPreferences.showRecentActivity && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Nenhum componente selecionado
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>
                  Controle quais notificações você deseja receber
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba atualizações importantes por email
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(value) => handleSettingChange('notifications', 'email', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba alertas no navegador ou dispositivo móvel
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={(value) => handleSettingChange('notifications', 'push', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de Padrões</Label>
                    <p className="text-sm text-muted-foreground">
                      Seja notificado quando novos padrões forem gerados
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.signals}
                    onCheckedChange={(value) => handleSettingChange('notifications', 'signals', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Atualizações do Sistema</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba informações sobre atualizações e manutenções
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.system}
                    onCheckedChange={(value) => handleSettingChange('notifications', 'system', value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API e Integrações</CardTitle>
                <CardDescription>
                  Gerencie suas chaves de API e conexões com serviços externos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">Chave de API</Label>
                  <div className="flex gap-2">
                    <Input
                      id="apiKey"
                      value={settings.integration.apiKey}
                      onChange={(e) => handleSettingChange('integration', 'apiKey', e.target.value)}
                      type="password"
                      className="font-mono"
                    />
                    <Button variant="outline" size="icon">
                      <Key className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use esta chave para acessar a API da SOFIA em suas aplicações
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">URL do Webhook</Label>
                  <Input
                    id="webhookUrl"
                    value={settings.integration.webhookUrl}
                    onChange={(e) => handleSettingChange('integration', 'webhookUrl', e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    Receba notificações em tempo real de eventos da plataforma
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Status da Assinatura Lastlink
                  </h3>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Conectado
                    </Badge>
                    <Button variant="outline" size="sm">Verificar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documentação da API</CardTitle>
                <CardDescription>
                  Recursos para desenvolvedores integrarem com a plataforma SOFIA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <p className="text-sm">
                    Nossa API permite que você acesse dados de padrões, estratégias e resultados
                    programaticamente. Consulte nossa documentação para mais detalhes.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                      <Globe className="h-4 w-4" />
                      Documentação
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Key className="h-4 w-4" />
                      Exemplos de Código
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}