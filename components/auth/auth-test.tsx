'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, User, Database, Key } from 'lucide-react';
import { toast } from 'sonner';

interface AuthTestProps {
  className?: string;
}

export function AuthTest({ className }: AuthTestProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [user, setUser] = useState<any>(null);
  const [testResults, setTestResults] = useState({
    connection: false,
    auth: false,
    database: false,
  });

  // Using singleton Supabase client imported from '@/lib/supabase'

  useEffect(() => {
    // Verificar se há usuário logado
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const testSupabaseConnection = async () => {
    setIsLoading(true);
    setConnectionStatus('testing');
    
    const results = {
      connection: false,
      auth: false,
      database: false,
    };

    try {
      // Teste 1: Conexão básica
      const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
      if (!error) {
        results.connection = true;
        toast.success('Conexão com Supabase estabelecida!');
      } else {
        toast.error(`Erro de conexão: ${error.message}`);
      }

      // Teste 2: Autenticação (se houver usuário)
      if (user) {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (!authError && authData.user) {
          results.auth = true;
          toast.success('Autenticação funcionando!');
        } else {
          toast.error(`Erro de autenticação: ${authError?.message}`);
        }
      }

      // Teste 3: Acesso ao banco (tentar buscar perfil do usuário)
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!profileError) {
          results.database = true;
          toast.success('Acesso ao banco de dados funcionando!');
        } else {
          toast.warning(`Perfil não encontrado: ${profileError.message}`);
        }
      }

      setTestResults(results);
      setConnectionStatus(results.connection ? 'success' : 'error');
      
    } catch (error) {
      console.error('Erro no teste:', error);
      toast.error('Erro durante os testes');
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    // Redirecionar para página de login
    window.location.href = '/login';
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Erro ao fazer logout');
    } else {
      toast.success('Logout realizado com sucesso');
      setUser(null);
      setTestResults({ connection: false, auth: false, database: false });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Teste de Autenticação Supabase
        </CardTitle>
        <CardDescription>
          Verificar conexão, autenticação e acesso ao banco de dados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status do usuário */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">Status do usuário:</span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Logado
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {user.email}
                </span>
              </>
            ) : (
              <Badge variant="secondary">
                <XCircle className="w-3 h-3 mr-1" />
                Não logado
              </Badge>
            )}
          </div>
        </div>

        {/* Resultados dos testes */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Resultados dos testes:</h4>
          
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="text-sm">Conexão Supabase</span>
              {testResults.connection ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="text-sm">Autenticação</span>
              {testResults.auth ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="text-sm">Acesso ao banco</span>
              {testResults.database ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2">
          <Button
            onClick={testSupabaseConnection}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Key className="w-4 h-4 mr-2" />
            )}
            Testar Conexão
          </Button>
          
          {user ? (
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <Button variant="outline" onClick={handleLogin}>
              Login
            </Button>
          )}
        </div>

        {/* Informações de configuração */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Não configurado'}</div>
          <div>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurado' : 'Não configurado'}</div>
        </div>
      </CardContent>
    </Card>
  );
}