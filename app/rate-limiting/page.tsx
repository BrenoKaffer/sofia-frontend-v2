/**
 * Página do Dashboard de Rate Limiting
 * Interface para monitoramento e gerenciamento do sistema de rate limiting
 */

'use client';

import React, { useState, useEffect } from 'react';
import { RateLimitDashboard } from '@/components/monitoring/rate-limit-dashboard';
import { usePageMonitoring } from '@/hooks/use-monitoring';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Info, AlertTriangle, Settings, Bell, Activity, TrendingUp, Clock, Users } from 'lucide-react';

interface CustomRule {
  id?: number;
  pattern: string;
  limit: number;
  window: string;
}

export default function RateLimitingPage() {
  usePageMonitoring('RateLimitingPage');
  
  // Estados para configurações avançadas
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [realTimeMetrics, setRealTimeMetrics] = useState(true);
  const [autoScaling, setAutoScaling] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  
  // Estados para métricas em tempo real
  const [liveMetrics, setLiveMetrics] = useState({
    currentRequests: 0,
    blockedRequests: 0,
    averageResponseTime: 0,
    activeConnections: 0,
    threatLevel: 'low'
  });
  
  // Estados para alertas
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'warning',
      message: 'Rate limit threshold reached for /api/ml endpoint',
      timestamp: new Date(),
      resolved: false
    },
    {
      id: 2,
      type: 'info',
      message: 'Auto-scaling activated for high traffic',
      timestamp: new Date(Date.now() - 300000),
      resolved: true
    }
  ]);
  
  // Simulação de métricas em tempo real
  useEffect(() => {
    if (!realTimeMetrics) return;
    
    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        currentRequests: Math.floor(Math.random() * 1000) + 100,
        blockedRequests: Math.floor(Math.random() * 50),
        averageResponseTime: Math.floor(Math.random() * 200) + 50,
        activeConnections: Math.floor(Math.random() * 500) + 50,
        threatLevel: Math.random() > 0.8 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low'
      }));
    }, 2000);
    
    return () => clearInterval(interval);
  }, [realTimeMetrics]);
  
  // Função para adicionar nova regra customizada
  const addCustomRule = (rule: CustomRule) => {
    setCustomRules(prev => [...prev, { ...rule, id: Date.now() }]);
  };
  
  // Função para resolver alerta
  const resolveAlert = (alertId: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">Rate Limiting</h1>
            <Badge variant="secondary">Security</Badge>
            {liveMetrics.threatLevel === 'high' && (
              <Badge variant="destructive" className="animate-pulse">
                High Threat
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced Config
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Advanced Rate Limiting Configuration</DialogTitle>
                  <DialogDescription>
                    Configure advanced settings for rate limiting behavior
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="alerts-toggle">Enable Alerts</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="alerts-toggle"
                          checked={alertsEnabled}
                          onCheckedChange={setAlertsEnabled}
                        />
                        <span className="text-sm text-muted-foreground">
                          {alertsEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="realtime-toggle">Real-time Metrics</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="realtime-toggle"
                          checked={realTimeMetrics}
                          onCheckedChange={setRealTimeMetrics}
                        />
                        <span className="text-sm text-muted-foreground">
                          {realTimeMetrics ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="autoscaling-toggle">Auto-scaling</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="autoscaling-toggle"
                          checked={autoScaling}
                          onCheckedChange={setAutoScaling}
                        />
                        <span className="text-sm text-muted-foreground">
                          {autoScaling ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="alert-threshold">Alert Threshold (%)</Label>
                      <Input
                        id="alert-threshold"
                        type="number"
                        min="1"
                        max="100"
                        value={alertThreshold}
                        onChange={(e) => setAlertThreshold(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsConfigDialogOpen(false)}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" size="sm" className="relative">
              <Bell className="h-4 w-4 mr-2" />
              Alerts
              {alerts.filter(a => !a.resolved).length > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                  {alerts.filter(a => !a.resolved).length}
                </Badge>
              )}
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Monitor and manage API rate limiting to protect your application from abuse and ensure fair usage.
        </p>
      </div>
      
      {/* System Status Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Rate limiting is active and protecting your APIs. All endpoints are monitored and limits are enforced automatically.
          {realTimeMetrics && (
            <span className="ml-2 text-green-600 font-medium">
              Real-time monitoring enabled
            </span>
          )}
        </AlertDescription>
      </Alert>
      
      {/* Real-time Metrics */}
      {realTimeMetrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Current Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{liveMetrics.currentRequests}</div>
              <p className="text-xs text-muted-foreground">requests/min</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Blocked Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{liveMetrics.blockedRequests}</div>
              <p className="text-xs text-muted-foreground">blocked/min</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{liveMetrics.averageResponseTime}ms</div>
              <p className="text-xs text-muted-foreground">average latency</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{liveMetrics.activeConnections}</div>
              <p className="text-xs text-muted-foreground">concurrent users</p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Active Alerts */}
      {alertsEnabled && alerts.filter(a => !a.resolved).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Active Alerts
            </CardTitle>
            <CardDescription>
              Current system alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.filter(a => !a.resolved).map((alert) => (
              <Alert key={alert.id} className={alert.type === 'warning' ? 'border-yellow-500' : ''}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{alert.message}</div>
                    <div className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleString()}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    Resolve
                  </Button>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Protection Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">High Security</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Multi-tier rate limiting active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">100%</div>
            <p className="text-xs text-muted-foreground">
              All API endpoints protected
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Redis Cache</span>
            </div>
            <p className="text-xs text-muted-foreground">
              High-performance rate limiting
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Rate Limiting Information */}
      <Card>
        <CardHeader>
          <CardTitle>How Rate Limiting Works</CardTitle>
          <CardDescription>
            Understanding the rate limiting system and its configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-semibold">Rate Limiting Tiers</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>🔐 Authentication APIs:</span>
                  <span className="font-mono">5/15min</span>
                </div>
                <div className="flex justify-between">
                  <span>🤖 ML/Analytics APIs:</span>
                  <span className="font-mono">20/5min</span>
                </div>
                <div className="flex justify-between">
                  <span>⚡ Real-time APIs:</span>
                  <span className="font-mono">60/1min</span>
                </div>
                <div className="flex justify-between">
                  <span>🌐 Public APIs:</span>
                  <span className="font-mono">100/15min</span>
                </div>
                <div className="flex justify-between">
                  <span>⚙️ Admin APIs:</span>
                  <span className="font-mono">100/1hour</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Key Features</h4>
              <ul className="space-y-1 text-sm">
                <li>• IP-based rate limiting</li>
                <li>• Automatic endpoint detection</li>
                <li>• Redis-powered storage</li>
                <li>• Configurable time windows</li>
                <li>• Detailed monitoring & logging</li>
                <li>• Graceful error handling</li>
              </ul>
            </div>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Rate limits are enforced per IP address. 
              Authenticated users may have different limits based on their role and subscription.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      
      {/* Main Dashboard */}
      <RateLimitDashboard />
      
      {/* Advanced Configuration Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rules">Custom Rules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>
                  Current system performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage</span>
                    <span>45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span>62%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '62%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Network I/O</span>
                    <span>78%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Threat Detection</CardTitle>
                <CardDescription>
                  Current threat level and security status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Threat Level</span>
                  <Badge 
                    variant={
                      liveMetrics.threatLevel === 'high' ? 'destructive' : 
                      liveMetrics.threatLevel === 'medium' ? 'default' : 'secondary'
                    }
                  >
                    {liveMetrics.threatLevel.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Suspicious IPs Blocked</span>
                    <span>12</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>DDoS Attempts</span>
                    <span>3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Bot Traffic Filtered</span>
                    <span>156</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Rate Limiting Rules</CardTitle>
              <CardDescription>
                Create and manage custom rate limiting rules for specific endpoints or user groups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Endpoint Pattern</Label>
                  <Input placeholder="/api/custom/*" />
                </div>
                <div className="space-y-2">
                  <Label>Rate Limit</Label>
                  <Input placeholder="100" type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Time Window</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select window" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">1 minute</SelectItem>
                      <SelectItem value="5m">5 minutes</SelectItem>
                      <SelectItem value="15m">15 minutes</SelectItem>
                      <SelectItem value="1h">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button className="w-full">Add Custom Rule</Button>
              
              {customRules.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Active Custom Rules</h4>
                  {customRules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{rule.pattern}</div>
                        <div className="text-sm text-muted-foreground">
                          {rule.limit} requests per {rule.window}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Remove</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Request Patterns</CardTitle>
                <CardDescription>
                  Analysis of request patterns over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Peak Hours</span>
                    <span className="font-mono">14:00 - 16:00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Most Active Endpoint</span>
                    <span className="font-mono">/api/ml</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Daily Requests</span>
                    <span className="font-mono">45,230</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>
                  Request distribution by region
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>🇺🇸 United States</span>
                    <span>45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>🇧🇷 Brazil</span>
                    <span>23%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>🇪🇺 Europe</span>
                    <span>18%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>🌏 Asia</span>
                    <span>14%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>
                Recent security events and blocked attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Suspicious IP Blocked</div>
                    <div className="text-sm text-muted-foreground">192.168.1.100 - Multiple failed attempts</div>
                  </div>
                  <Badge variant="destructive">High Risk</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Rate Limit Exceeded</div>
                    <div className="text-sm text-muted-foreground">/api/ml endpoint - 500 requests in 1 minute</div>
                  </div>
                  <Badge variant="default">Medium Risk</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Bot Traffic Detected</div>
                    <div className="text-sm text-muted-foreground">Automated requests from user agent pattern</div>
                  </div>
                  <Badge variant="secondary">Low Risk</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting Best Practices</CardTitle>
          <CardDescription>
            Tips for working with rate-limited APIs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-semibold">For Developers</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Always check rate limit headers in responses</li>
                <li>• Implement exponential backoff for retries</li>
                <li>• Cache responses when possible</li>
                <li>• Use batch operations for multiple requests</li>
                <li>• Monitor your application&apos;s rate limit usage</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Response Headers</h4>
              <div className="space-y-1 text-sm font-mono">
                <div>X-RateLimit-Limit: Maximum requests</div>
                <div>X-RateLimit-Remaining: Requests left</div>
                <div>X-RateLimit-Reset: Reset timestamp</div>
                <div>Retry-After: Seconds to wait (429 only)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}