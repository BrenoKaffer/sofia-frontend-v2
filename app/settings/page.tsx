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
import { User, Settings, Bell, Moon, Sun, Globe, Key, Shield, Upload, Trash2, Save, AlertTriangle, LayoutDashboard, TrendingUp, DollarSign, Target, AlertCircle, Phone } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { useDashboardPreferences } from '@/hooks/use-dashboard-preferences';
import { NotificationSettings } from '@/components/notifications/notification-settings';
import ApiKeyManager from '@/components/auth/ApiKeyManager';

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
  trading: {
    riskManagement: {
      maxBetPercentage: number;
      stopLossPercentage: number;
      takeProfitPercentage: number;
      dailyLossLimit: number;
      maxConsecutiveLosses: number;
    };
    autoTrading: {
      enabled: boolean;
      minConfidence: number;
      maxBetsPerHour: number;
      pauseOnLoss: boolean;
      pauseOnProfit: boolean;
    };
    strategies: {
      defaultStrategy: string;
      customStrategies: Array<{
        name: string;
        description: string;
        parameters: Record<string, any>;
      }>;
    };
    bankroll: {
      initialAmount: number;
      currentAmount: number;
      targetAmount: number;
      reinvestProfits: boolean;
    };
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
    apiKey: '', // Chave deve ser configurada pelo usuário
    webhookUrl: 'https://webhook.site/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  },
  dashboard: {
    showStatsCards: true,
    showLiveSignals: true,
    showPerformanceChart: true,
    showRouletteStatus: true,
    showRecentActivity: true,
  },
  trading: {
    riskManagement: {
      maxBetPercentage: 5,
      stopLossPercentage: 20,
      takeProfitPercentage: 50,
      dailyLossLimit: 100,
      maxConsecutiveLosses: 3,
    },
    autoTrading: {
      enabled: false,
      minConfidence: 80,
      maxBetsPerHour: 10,
      pauseOnLoss: true,
      pauseOnProfit: false,
    },
    strategies: {
      defaultStrategy: 'Fibonacci Reversal',
      customStrategies: [],
    },
    bankroll: {
      initialAmount: 1000,
      currentAmount: 1000,
      targetAmount: 2000,
      reinvestProfits: true,
    },
  },
};

export default function SettingsPage() {
  const { user } = useUser();
  const { preferences: dashboardPreferences, updatePreferences } = useDashboardPreferences();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: user?.firstName || 'Usuário SOFIA',
    email: user?.emailAddresses?.[0]?.emailAddress || 'usuario@exemplo.com',
    bio: 'Trader e entusiasta de estratégias para roleta online.',
    // Campos de telefone adicionados
    phoneCountryCode: '+55',
    phoneAreaCode: '',
    phoneNumber: '',
    phoneFormatted: '', // Campo calculado para exibição
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

  // Função para formatar telefone em tempo real
  const formatPhoneNumber = (countryCode: string, areaCode: string, number: string) => {
    if (!countryCode || !areaCode || !number) return '';
    
    // Formatação específica para Brasil
    if (countryCode === '+55' && number.length === 9) {
      return `${countryCode} ${areaCode} ${number.substring(0, 5)}-${number.substring(5)}`;
    } else if (countryCode === '+55' && number.length === 8) {
      return `${countryCode} ${areaCode} ${number.substring(0, 4)}-${number.substring(4)}`;
    } else {
      return `${countryCode} ${areaCode} ${number}`;
    }
  };

  // Atualizar telefone formatado quando os campos mudarem
  const handlePhoneChange = (field: string, value: string) => {
    const updatedProfile = { ...userProfile, [field]: value };
    
    // Atualizar campo formatado
    updatedProfile.phoneFormatted = formatPhoneNumber(
      updatedProfile.phoneCountryCode,
      updatedProfile.phoneAreaCode,
      updatedProfile.phoneNumber
    );
    
    setUserProfile(updatedProfile);
  };

  const saveChanges = () => {
    // Aqui seria implementada a lógica para salvar as alterações no backend
    // Incluindo os novos campos de telefone
    console.log('Salvando perfil com telefone:', {
      ...userProfile,
      phoneCountryCode: userProfile.phoneCountryCode,
      phoneAreaCode: userProfile.phoneAreaCode,
      phoneNumber: userProfile.phoneNumber,
    });
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
              <TabsTrigger value="trading" className="gap-2 font-sans">
                <TrendingUp className="h-4 w-4" />
                Trading
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
                      <AvatarImage src={user?.imageUrl} alt={userProfile.name} />
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

                    {/* SEÇÃO DE TELEFONE ADICIONADA */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <Label className="font-sans font-medium">Telefone</Label>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phoneCountryCode" className="font-sans text-sm">Código do País</Label>
                          <Select 
                            value={userProfile.phoneCountryCode} 
                            onValueChange={(value) => handlePhoneChange('phoneCountryCode', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="País" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="+55">🇧🇷 +55 (Brasil)</SelectItem>
                              <SelectItem value="+1">🇺🇸 +1 (EUA)</SelectItem>
                              <SelectItem value="+44">🇬🇧 +44 (Reino Unido)</SelectItem>
                              <SelectItem value="+33">🇫🇷 +33 (França)</SelectItem>
                              <SelectItem value="+49">🇩🇪 +49 (Alemanha)</SelectItem>
                              <SelectItem value="+34">🇪🇸 +34 (Espanha)</SelectItem>
                              <SelectItem value="+39">🇮🇹 +39 (Itália)</SelectItem>
                              <SelectItem value="+351">🇵🇹 +351 (Portugal)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phoneAreaCode" className="font-sans text-sm">
                            {userProfile.phoneCountryCode === '+55' ? 'DDD' : 'Código de Área'}
                          </Label>
                          <Input
                            id="phoneAreaCode"
                            placeholder={userProfile.phoneCountryCode === '+55' ? 'Ex: 11' : 'Ex: 212'}
                            value={userProfile.phoneAreaCode}
                            onChange={(e) => handlePhoneChange('phoneAreaCode', e.target.value.replace(/\D/g, '').slice(0, 3))}
                            maxLength={3}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber" className="font-sans text-sm">Número</Label>
                          <Input
                            id="phoneNumber"
                            placeholder={userProfile.phoneCountryCode === '+55' ? '987654321' : 'Número'}
                            value={userProfile.phoneNumber}
                            onChange={(e) => handlePhoneChange('phoneNumber', e.target.value.replace(/\D/g, '').slice(0, 15))}
                            maxLength={15}
                          />
                        </div>
                      </div>
                      
                      {/* Prévia do telefone formatado */}
                      {userProfile.phoneFormatted && (
                        <div className="p-3 bg-muted rounded-lg">
                          <Label className="font-sans text-sm text-muted-foreground">Telefone formatado:</Label>
                          <p className="font-mono text-sm font-medium">{userProfile.phoneFormatted}</p>
                        </div>
                      )}
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
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="integrations" className="mt-0 space-y-4">
            {/* Gerenciador de API Keys */}
            <ApiKeyManager />

            <Card>
              <CardHeader>
                <CardTitle>Webhooks e Integrações</CardTitle>
                <CardDescription>
                  Configure webhooks e outras integrações externas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">URL do Webhook</Label>
                  <Input
                    id="webhookUrl"
                    value={settings.integration.webhookUrl}
                    onChange={(e) => handleSettingChange('integration', 'webhookUrl', e.target.value)}
                    className="font-mono"
                    placeholder="https://seu-site.com/webhook"
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