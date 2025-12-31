/**
 * Dashboard de Monitoramento de Rate Limiting
 * Visualiza estatísticas e status do sistema de rate limiting
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRateLimit, useGlobalRateLimit } from '@/hooks/use-rate-limit';
import { useMonitoring } from '@/hooks/use-monitoring';
import { 
  Activity, 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Settings,
  BarChart3,
  Timer
} from 'lucide-react';

interface RateLimitDashboardProps {
  className?: string;
}

export function RateLimitDashboard({ className }: RateLimitDashboardProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/rate-limit-example');
  const [testEndpoint, setTestEndpoint] = useState('');
  const [isTestingEndpoint, setIsTestingEndpoint] = useState(false);
  
  const { 
    status, 
    stats, 
    isLoading, 
    checkRateLimit, 
    formatTimeUntilReset,
    resetStats 
  } = useRateLimit(selectedEndpoint);
  
  const { globalStats, fetchGlobalStats } = useGlobalRateLimit();
  const { log, track } = useMonitoring({ componentName: 'RateLimitDashboard' });
  
  // Endpoints disponíveis para teste
  const availableEndpoints = [
    '/api/rate-limit-example',
    '/api/ml',
    '/api/signals',
    '/api/realtime-data',
    '/api/roulette-status',
  ];
  
  // Testa um endpoint específico
  const testEndpointRateLimit = async () => {
    if (!testEndpoint.trim()) return;
    
    setIsTestingEndpoint(true);
    
    try {
      const response = await fetch(`${testEndpoint}?action=test`);
      const data = await response.json();
      
      track.userAction('endpoint_test', {
        endpoint: testEndpoint,
        success: response.ok,
        status: response.status,
      });
      
      if (response.status === 429) {
        alert('Rate limit exceeded for this endpoint!');
      } else if (response.ok) {
        alert('Endpoint test successful!');
      } else {
        alert(`Test failed: ${data.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('Endpoint test error:', error);
      alert('Failed to test endpoint');
    } finally {
      setIsTestingEndpoint(false);
    }
  };
  
  // Atualiza dados periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      checkRateLimit();
      fetchGlobalStats();
    }, 10000); // 10 segundos
    
    return () => clearInterval(interval);
  }, [checkRateLimit, fetchGlobalStats]);
  
  // Carrega dados iniciais
  useEffect(() => {
    checkRateLimit();
  }, [selectedEndpoint, checkRateLimit]);
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rate Limiting Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and manage API rate limiting across your application
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              checkRateLimit();
              fetchGlobalStats();
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limit Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {status.isLimited ? (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <Badge variant="destructive">Limited</Badge>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Badge variant="default">Active</Badge>
                </>
              )}
            </div>
            {status.lastChecked && (
              <p className="text-xs text-muted-foreground mt-1">
                Last checked: {status.lastChecked.toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status.info?.remaining ?? 'N/A'}
            </div>
            {status.info && (
              <Progress 
                value={(status.info.remaining / status.info.limit) * 100} 
                className="mt-2"
              />
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalRequests} total requests
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reset Time</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status.info ? formatTimeUntilReset() : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Until rate limit resets
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Rate Limit Alert */}
      {status.isLimited && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Rate limit exceeded for {selectedEndpoint}. 
            Requests will be allowed again in {formatTimeUntilReset()}.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Main Content */}
      <Tabs defaultValue="monitoring" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>
        
        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Endpoint Monitoring</CardTitle>
              <CardDescription>
                Monitor rate limiting status for specific endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endpoint-select">Select Endpoint</Label>
                <select
                  id="endpoint-select"
                  value={selectedEndpoint}
                  onChange={(e) => setSelectedEndpoint(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {availableEndpoints.map((endpoint) => (
                    <option key={endpoint} value={endpoint}>
                      {endpoint}
                    </option>
                  ))}
                </select>
              </div>
              
              {status.info && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Rate Limit Details</Label>
                    <div className="text-sm space-y-1">
                      <div>Limit: {status.info.limit} requests</div>
                      <div>Remaining: {status.info.remaining} requests</div>
                      <div>Reset: {new Date(status.info.resetTime).toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Usage Progress</Label>
                    <Progress 
                      value={((status.info.limit - status.info.remaining) / status.info.limit) * 100}
                      className="h-2"
                    />
                    <div className="text-xs text-muted-foreground">
                      {status.info.limit - status.info.remaining} / {status.info.limit} used
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Endpoint Testing</CardTitle>
              <CardDescription>
                Test rate limiting behavior on different endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter endpoint URL (e.g., /api/test)"
                  value={testEndpoint}
                  onChange={(e) => setTestEndpoint(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={testEndpointRateLimit}
                  disabled={isTestingEndpoint || !testEndpoint.trim()}
                >
                  {isTestingEndpoint ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Test'
                  )}
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                This will send a test request to the specified endpoint to check rate limiting behavior.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Local Statistics</CardTitle>
                <CardDescription>Statistics for {selectedEndpoint}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span>Total Requests:</span>
                    <span className="font-mono">{stats.totalRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Limited Requests:</span>
                    <span className="font-mono">{stats.limitedRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-mono">{stats.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Retry After:</span>
                    <span className="font-mono">{stats.averageRetryAfter.toFixed(1)}s</span>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetStats}
                  className="w-full"
                >
                  Reset Statistics
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Global Statistics</CardTitle>
                <CardDescription>System-wide rate limiting stats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span>Active Endpoints:</span>
                    <span className="font-mono">{globalStats.activeEndpoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Limited:</span>
                    <span className="font-mono">{globalStats.totalLimitedRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Success Rate:</span>
                    <span className="font-mono">{globalStats.averageSuccessRate.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limiting Configuration</CardTitle>
              <CardDescription>
                View and manage rate limiting settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Rate limiting configuration is managed through environment variables and middleware settings.
                  Changes require application restart.
                </AlertDescription>
              </Alert>
              
              <div className="text-sm space-y-2">
                <div><strong>Public APIs:</strong> 100 requests per 15 minutes</div>
                <div><strong>Auth APIs:</strong> 5 requests per 15 minutes</div>
                <div><strong>ML APIs:</strong> 20 requests per 5 minutes</div>
                <div><strong>Real-time APIs:</strong> 60 requests per minute</div>
                <div><strong>Admin APIs:</strong> 100 requests per hour</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}