'use client';

import React, { useState } from 'react';
import { Bell, X, AlertTriangle, Settings, Check, CheckCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLogAlerts, LogAlert, AlertSettings } from '@/hooks/use-log-alerts';

export function AlertNotification() {
  const {
    alerts,
    unreadCount,
    settings,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    updateSettings,
  } = useLogAlerts();

  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState<AlertSettings>(settings);

  const handleSaveSettings = () => {
    updateSettings(tempSettings);
    setShowSettings(false);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'ERROR':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="relative">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Alertas de Sistema
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Dialog open={showSettings} onOpenChange={setShowSettings}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Configurações de Alertas</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="enabled">Alertas habilitados</Label>
                          <Switch
                            id="enabled"
                            checked={tempSettings.enabled}
                            onCheckedChange={(checked) =>
                              setTempSettings(prev => ({ ...prev, enabled: checked }))
                            }
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="threshold">
                            Limite de erros (para disparar alerta)
                          </Label>
                          <Input
                            id="threshold"
                            type="number"
                            min="1"
                            max="100"
                            value={tempSettings.errorThreshold}
                            onChange={(e) =>
                              setTempSettings(prev => ({
                                ...prev,
                                errorThreshold: parseInt(e.target.value) || 1
                              }))
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="timeWindow">
                            Janela de tempo (minutos)
                          </Label>
                          <Input
                            id="timeWindow"
                            type="number"
                            min="1"
                            max="60"
                            value={tempSettings.timeWindow}
                            onChange={(e) =>
                              setTempSettings(prev => ({
                                ...prev,
                                timeWindow: parseInt(e.target.value) || 1
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="sound">Som de notificação</Label>
                          <Switch
                            id="sound"
                            checked={tempSettings.notificationSound}
                            onCheckedChange={(checked) =>
                              setTempSettings(prev => ({ ...prev, notificationSound: checked }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="email">Notificações por email</Label>
                          <Switch
                            id="email"
                            checked={tempSettings.emailNotifications}
                            onCheckedChange={(checked) =>
                              setTempSettings(prev => ({ ...prev, emailNotifications: checked }))
                            }
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setShowSettings(false)}
                          >
                            Cancelar
                          </Button>
                          <Button onClick={handleSaveSettings}>
                            Salvar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {alerts.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={acknowledgeAllAlerts}
                      title="Marcar todos como lidos"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {alerts.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Nenhum alerta pendente
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="border-b border-border last:border-0 p-4 hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {getAlertIcon(alert.level)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="destructive" className="text-xs">
                                {alert.level}
                              </Badge>
                              {alert.context && (
                                <Badge variant="outline" className="text-xs">
                                  {alert.context}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-foreground mb-1 break-words">
                              {alert.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimestamp(alert.timestamp)}
                            </p>
                            {alert.user_id && (
                              <p className="text-xs text-muted-foreground">
                                Usuário: {alert.user_id}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                          title="Marcar como lido"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
}