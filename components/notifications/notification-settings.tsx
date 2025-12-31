'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Bell, BellOff, Volume2, VolumeX, Smartphone, Monitor, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { usePushNotifications } from '@/lib/push-notifications';
import { toast } from 'sonner';

interface NotificationPreferences {
  enabled: boolean;
  signals: boolean;
  system: boolean;
  sound: boolean;
  vibration: boolean;
  minConfidence: number;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  strategies: string[];
}

const defaultPreferences: NotificationPreferences = {
  enabled: false,
  signals: true,
  system: true,
  sound: true,
  vibration: true,
  minConfidence: 75,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  strategies: ['Fibonacci', 'Martingale', 'Paroli']
};

const availableStrategies = [
  'Fibonacci',
  'Martingale', 
  'Paroli',
  'D\'Alembert',
  'Labouchere',
  'Oscar\'s Grind'
];

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  
  const {
    isSupported,
    permission,
    isInitialized,
    initialize,
    requestPermission,
    showSignalNotification,
    showSystemNotification
  } = usePushNotifications();

  // Carregar preferências salvas
  useEffect(() => {
    const saved = localStorage.getItem('notification-preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.error('Erro ao carregar preferências:', error);
      }
    }
  }, []);

  // Salvar preferências
  const savePreferences = (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('notification-preferences', JSON.stringify(newPreferences));
    toast.success('Preferências salvas com sucesso!');
  };

  // Ativar notificações
  const enableNotifications = async () => {
    setIsLoading(true);
    try {
      if (!isInitialized) {
        const success = await initialize();
        if (!success) {
          toast.error('Falha ao inicializar notificações');
          return;
        }
      }

      if (permission !== 'granted') {
        const newPermission = await requestPermission();
        if (newPermission !== 'granted') {
          toast.error('Permissão para notificações negada');
          return;
        }
      }

      const newPreferences = { ...preferences, enabled: true };
      savePreferences(newPreferences);
      toast.success('Notificações ativadas!');
    } catch (error) {
      console.error('Erro ao ativar notificações:', error);
      toast.error('Erro ao ativar notificações');
    } finally {
      setIsLoading(false);
    }
  };

  // Desativar notificações
  const disableNotifications = () => {
    const newPreferences = { ...preferences, enabled: false };
    savePreferences(newPreferences);
    toast.success('Notificações desativadas');
  };

  // Testar notificação
  const testNotification = async () => {
    if (!preferences.enabled || permission !== 'granted') {
      toast.error('Ative as notificações primeiro');
      return;
    }

    try {
      await showSignalNotification({
        strategy: 'Fibonacci',
        table: 'Mesa 1',
        confidence: 85,
        type: 'high_confidence'
      });
      setTestNotificationSent(true);
      toast.success('Notificação de teste enviada!');
      
      setTimeout(() => setTestNotificationSent(false), 3000);
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
      toast.error('Erro ao enviar notificação de teste');
    }
  };

  // Alternar estratégia
  const toggleStrategy = (strategy: string) => {
    const newStrategies = preferences.strategies.includes(strategy)
      ? preferences.strategies.filter(s => s !== strategy)
      : [...preferences.strategies, strategy];
    
    const newPreferences = { ...preferences, strategies: newStrategies };
    savePreferences(newPreferences);
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { icon: CheckCircle, text: 'Concedida', color: 'text-green-600' };
      case 'denied':
        return { icon: AlertTriangle, text: 'Negada', color: 'text-red-600' };
      default:
        return { icon: Bell, text: 'Pendente', color: 'text-yellow-600' };
    }
  };

  const permissionStatus = getPermissionStatus();
  const PermissionIcon = permissionStatus.icon;

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Seu navegador não suporta notificações push
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Para receber notificações, use um navegador moderno como Chrome, Firefox ou Safari.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status e Ativação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Receba alertas em tempo real sobre sinais e atualizações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Ativar Notificações</Label>
              <p className="text-sm text-muted-foreground">
                Status: <span className={permissionStatus.color}>
                  <PermissionIcon className="inline h-4 w-4 mr-1" />
                  {permissionStatus.text}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {preferences.enabled ? (
                <Button 
                  variant="outline" 
                  onClick={disableNotifications}
                  className="gap-2"
                >
                  <BellOff className="h-4 w-4" />
                  Desativar
                </Button>
              ) : (
                <Button 
                  onClick={enableNotifications} 
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Bell className="h-4 w-4" />
                  {isLoading ? 'Ativando...' : 'Ativar'}
                </Button>
              )}
            </div>
          </div>

          {preferences.enabled && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testNotification}
                disabled={testNotificationSent}
                className="gap-2"
              >
                {testNotificationSent ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                {testNotificationSent ? 'Enviada!' : 'Testar'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações Detalhadas */}
      {preferences.enabled && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Tipos de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sinais de Trading</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertas quando novos sinais são detectados
                  </p>
                </div>
                <Switch
                  checked={preferences.signals}
                  onCheckedChange={(value) => 
                    savePreferences({ ...preferences, signals: value })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações do Sistema</Label>
                  <p className="text-sm text-muted-foreground">
                    Atualizações, manutenções e avisos importantes
                  </p>
                </div>
                <Switch
                  checked={preferences.system}
                  onCheckedChange={(value) => 
                    savePreferences({ ...preferences, system: value })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Som
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Reproduzir som ao receber notificações
                  </p>
                </div>
                <Switch
                  checked={preferences.sound}
                  onCheckedChange={(value) => 
                    savePreferences({ ...preferences, sound: value })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Vibração
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Vibrar dispositivo (apenas mobile)
                  </p>
                </div>
                <Switch
                  checked={preferences.vibration}
                  onCheckedChange={(value) => 
                    savePreferences({ ...preferences, vibration: value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filtros de Sinal</CardTitle>
              <CardDescription>
                Configure quando receber notificações de sinais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Confiança Mínima: {preferences.minConfidence}%</Label>
                <Slider
                  value={[preferences.minConfidence]}
                  onValueChange={([value]) => 
                    savePreferences({ ...preferences, minConfidence: value })
                  }
                  max={100}
                  min={50}
                  step={5}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Apenas sinais com confiança igual ou superior a {preferences.minConfidence}% serão notificados
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Estratégias Monitoradas</Label>
                <div className="flex flex-wrap gap-2">
                  {availableStrategies.map((strategy) => {
                    const isSelected = preferences.strategies.includes(strategy);
                    return (
                      <Badge
                        key={strategy}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer transition-colors"
                        onClick={() => toggleStrategy(strategy)}
                      >
                        {strategy}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground">
                  Clique nas estratégias para ativar/desativar notificações
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horário Silencioso</CardTitle>
              <CardDescription>
                Defina um período para não receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ativar Horário Silencioso</Label>
                <Switch
                  checked={preferences.quietHours.enabled}
                  onCheckedChange={(value) => 
                    savePreferences({ 
                      ...preferences, 
                      quietHours: { ...preferences.quietHours, enabled: value }
                    })
                  }
                />
              </div>

              {preferences.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Início</Label>
                    <input
                      type="time"
                      value={preferences.quietHours.start}
                      onChange={(e) => 
                        savePreferences({ 
                          ...preferences, 
                          quietHours: { ...preferences.quietHours, start: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fim</Label>
                    <input
                      type="time"
                      value={preferences.quietHours.end}
                      onChange={(e) => 
                        savePreferences({ 
                          ...preferences, 
                          quietHours: { ...preferences.quietHours, end: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}