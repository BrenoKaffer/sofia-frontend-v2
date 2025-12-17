'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  EyeOff, 
  Trash2, 
  Download, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Shield,
  Database,
  Network
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  source: 'auth' | 'api' | 'middleware' | 'component';
  message: string;
  data?: any;
}

interface LoginDebugProps {
  isVisible?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function LoginDebug({ 
  isVisible = false, 
  position = 'bottom-right' 
}: LoginDebugProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const originalConsoleLog = useRef(console.log);
  const originalConsoleWarn = useRef(console.warn);
  const originalConsoleError = useRef(console.error);

  // Interceptar console logs
  useEffect(() => {
    const interceptConsole = () => {
      console.log = (...args) => {
        originalConsoleLog.current(...args);
        
        const message = args.join(' ');
        if (message.includes('[AUTH-') || message.includes('[API-') || message.includes('[MIDDLEWARE-')) {
          try {
            let parsedData;
            let source: LogEntry['source'] = 'component';
            let level: LogEntry['level'] = 'info';
            
            if (message.includes('[AUTH-')) {
              source = 'auth';
              if (message.includes('[AUTH-ERROR]')) level = 'error';
              else if (message.includes('[AUTH-WARN]')) level = 'warn';
              
              const jsonMatch = message.match(/\{.*\}/);
              if (jsonMatch) {
                parsedData = JSON.parse(jsonMatch[0]);
              }
            } else if (message.includes('[API-')) {
              source = 'api';
              if (message.includes('[API-ERROR]')) level = 'error';
              else if (message.includes('[API-WARN]')) level = 'warn';
              
              const jsonMatch = message.match(/\{.*\}/);
              if (jsonMatch) {
                parsedData = JSON.parse(jsonMatch[0]);
              }
            } else if (message.includes('[MIDDLEWARE-')) {
              source = 'middleware';
              if (message.includes('[MIDDLEWARE-ERROR]')) level = 'error';
              else if (message.includes('[MIDDLEWARE-WARN]')) level = 'warn';
              
              const jsonMatch = message.match(/\{.*\}/);
              if (jsonMatch) {
                parsedData = JSON.parse(jsonMatch[0]);
              }
            }

            const logEntry: LogEntry = {
              id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: new Date().toISOString(),
              level,
              source,
              message: parsedData?.message || message.replace(/\[.*?\]/g, '').trim(),
              data: parsedData
            };

            setLogs(prev => [...prev.slice(-99), logEntry]); // Manter apenas os últimos 100 logs
          } catch (error) {
            // Se não conseguir parsear, adicionar como log simples
            const logEntry: LogEntry = {
              id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: new Date().toISOString(),
              level: 'info',
              source: 'component',
              message,
              data: null
            };
            setLogs(prev => [...prev.slice(-99), logEntry]);
          }
        }
      };

      console.warn = (...args) => {
        originalConsoleWarn.current(...args);
        // Similar logic for warnings
      };

      console.error = (...args) => {
        originalConsoleError.current(...args);
        // Similar logic for errors
      };
    };

    if (isVisible) {
      interceptConsole();
    }

    return () => {
      console.log = originalConsoleLog.current;
      console.warn = originalConsoleWarn.current;
      console.error = originalConsoleError.current;
    };
  }, [isVisible]);

  // Auto scroll para o final
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => filter === 'all' || log.level === filter);

  const clearLogs = () => setLogs([]);

  const downloadLogs = () => {
    const logData = JSON.stringify(logs, null, 2);
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sofia-login-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getSourceIcon = (source: LogEntry['source']) => {
    switch (source) {
      case 'auth':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'api':
        return <Network className="h-4 w-4 text-purple-500" />;
      case 'middleware':
        return <Database className="h-4 w-4 text-orange-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed ${getPositionClasses()} z-50 max-w-md`}>
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Login Debug
              <Badge variant="outline" className="text-xs">
                {filteredLogs.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            {/* Controles */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-1">
                {(['all', 'info', 'warn', 'error'] as const).map((level) => (
                  <Button
                    key={level}
                    variant={filter === level ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(level)}
                    className="h-6 text-xs px-2"
                  >
                    {level}
                  </Button>
                ))}
              </div>
              
              <Separator orientation="vertical" className="h-4" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoScroll(!autoScroll)}
                className="h-6 w-6 p-0"
                title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
              >
                <RefreshCw className={`h-3 w-3 ${autoScroll ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearLogs}
                className="h-6 w-6 p-0"
                title="Clear logs"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadLogs}
                className="h-6 w-6 p-0"
                title="Download logs"
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>

            {/* Logs */}
            <ScrollArea className="h-64 w-full" ref={scrollAreaRef}>
              <div className="space-y-2">
                {filteredLogs.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    Nenhum log encontrado
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2 rounded-md border bg-card text-xs"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getLevelIcon(log.level)}
                        {getSourceIcon(log.source)}
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {log.source}
                        </Badge>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      
                      <div className="font-medium mb-1">{log.message}</div>
                      
                      {log.data && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Dados
                          </summary>
                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default LoginDebug;