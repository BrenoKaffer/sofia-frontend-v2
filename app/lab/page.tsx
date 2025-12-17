'use client';

import React, { useState, useEffect } from 'react';
import FuturisticButtonSVG from '@/components/ui/FuturisticButtonSVG';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TestTube, 
  Zap, 
  Brain, 
  Cpu, 
  Rocket, 
  Beaker, 
  Code, 
  Settings,
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  Upload,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Gauge,
  Target,
  Layers,
  GitBranch,
  Microscope,
  Atom,
  Dna,
  Lightbulb,
  Sparkles
} from 'lucide-react';

interface ExperimentalFeature {
  id: string;
  name: string;
  description: string;
  category: 'ai' | 'performance' | 'ui' | 'analytics' | 'trading';
  status: 'active' | 'testing' | 'disabled' | 'beta';
  version: string;
  lastUpdated: string;
  enabled: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  participants: number;
  successRate: number;
}

interface TestResult {
  id: string;
  featureId: string;
  timestamp: string;
  status: 'success' | 'failure' | 'warning';
  duration: number;
  message: string;
  metrics: {
    performance: number;
    accuracy: number;
    reliability: number;
  };
}

interface AIExperiment {
  id: string;
  name: string;
  type: 'prediction' | 'optimization' | 'analysis' | 'automation';
  status: 'running' | 'completed' | 'failed' | 'queued';
  progress: number;
  startTime: string;
  estimatedCompletion: string;
  results?: any;
}

export default function LabPage() {
  const [activeTab, setActiveTab] = useState('features');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testProgress, setTestProgress] = useState(0);

  const [features, setFeatures] = useState<ExperimentalFeature[]>([
    {
      id: 'ai-predictor-v2',
      name: 'AI Predictor v2.0',
      description: 'Sistema de predição avançado com redes neurais profundas para análise de padrões de roulette.',
      category: 'ai',
      status: 'beta',
      version: '2.0.1-beta',
      lastUpdated: '2024-01-15',
      enabled: true,
      riskLevel: 'medium',
      participants: 127,
      successRate: 78.5
    },
    {
      id: 'quantum-analysis',
      name: 'Análise Quântica',
      description: 'Algoritmo experimental que utiliza princípios de computação quântica para análise probabilística.',
      category: 'ai',
      status: 'testing',
      version: '0.3.0-alpha',
      lastUpdated: '2024-01-14',
      enabled: false,
      riskLevel: 'high',
      participants: 23,
      successRate: 65.2
    },
    {
      id: 'realtime-optimizer',
      name: 'Otimizador em Tempo Real',
      description: 'Sistema de otimização automática de estratégias baseado em performance em tempo real.',
      category: 'performance',
      status: 'active',
      version: '1.2.0',
      lastUpdated: '2024-01-13',
      enabled: true,
      riskLevel: 'low',
      participants: 89,
      successRate: 82.1
    },
    {
      id: 'adaptive-ui',
      name: 'Interface Adaptativa',
      description: 'UI que se adapta automaticamente ao comportamento e preferências do usuário.',
      category: 'ui',
      status: 'beta',
      version: '1.0.0-beta',
      lastUpdated: '2024-01-12',
      enabled: false,
      riskLevel: 'low',
      participants: 156,
      successRate: 91.3
    },
    {
      id: 'sentiment-analyzer',
      name: 'Analisador de Sentimento',
      description: 'Análise de sentimento do mercado baseada em dados sociais e notícias.',
      category: 'analytics',
      status: 'testing',
      version: '0.8.0-alpha',
      lastUpdated: '2024-01-11',
      enabled: true,
      riskLevel: 'medium',
      participants: 67,
      successRate: 73.8
    },
    {
      id: 'auto-trader',
      name: 'Auto Trader Experimental',
      description: 'Sistema de trading automatizado com IA para execução de estratégias.',
      category: 'trading',
      status: 'disabled',
      version: '0.5.0-alpha',
      lastUpdated: '2024-01-10',
      enabled: false,
      riskLevel: 'high',
      participants: 12,
      successRate: 58.9
    }
  ]);

  const [testResults, setTestResults] = useState<TestResult[]>([
    {
      id: 'test-001',
      featureId: 'ai-predictor-v2',
      timestamp: '2024-01-15 14:30:00',
      status: 'success',
      duration: 2340,
      message: 'Teste de predição concluído com sucesso. Precisão de 78.5%.',
      metrics: { performance: 85, accuracy: 78, reliability: 92 }
    },
    {
      id: 'test-002',
      featureId: 'quantum-analysis',
      timestamp: '2024-01-15 13:15:00',
      status: 'warning',
      duration: 5670,
      message: 'Teste parcialmente bem-sucedido. Instabilidade detectada em cenários complexos.',
      metrics: { performance: 72, accuracy: 65, reliability: 68 }
    },
    {
      id: 'test-003',
      featureId: 'realtime-optimizer',
      timestamp: '2024-01-15 12:00:00',
      status: 'success',
      duration: 1890,
      message: 'Otimização em tempo real funcionando perfeitamente.',
      metrics: { performance: 94, accuracy: 82, reliability: 96 }
    }
  ]);

  const [aiExperiments, setAiExperiments] = useState<AIExperiment[]>([
    {
      id: 'exp-001',
      name: 'Treinamento de Modelo Neural',
      type: 'prediction',
      status: 'running',
      progress: 67,
      startTime: '2024-01-15 10:00:00',
      estimatedCompletion: '2024-01-15 16:30:00'
    },
    {
      id: 'exp-002',
      name: 'Otimização de Hiperparâmetros',
      type: 'optimization',
      status: 'queued',
      progress: 0,
      startTime: '2024-01-15 16:30:00',
      estimatedCompletion: '2024-01-15 20:00:00'
    },
    {
      id: 'exp-003',
      name: 'Análise de Padrões Históricos',
      type: 'analysis',
      status: 'completed',
      progress: 100,
      startTime: '2024-01-14 08:00:00',
      estimatedCompletion: '2024-01-14 14:00:00',
      results: { patterns: 47, accuracy: 84.2, confidence: 0.89 }
    }
  ]);

  const toggleFeature = (featureId: string) => {
    setFeatures(prev => prev.map(feature => 
      feature.id === featureId 
        ? { ...feature, enabled: !feature.enabled }
        : feature
    ));
  };

  const runTest = async (featureId: string) => {
    setIsRunningTest(true);
    setTestProgress(0);
    
    // Simular progresso do teste
    const interval = setInterval(() => {
      setTestProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunningTest(false);
          
          // Adicionar resultado do teste
          const newResult: TestResult = {
            id: `test-${Date.now()}`,
            featureId,
            timestamp: new Date().toLocaleString('pt-BR'),
            status: Math.random() > 0.2 ? 'success' : 'warning',
            duration: Math.floor(Math.random() * 5000) + 1000,
            message: 'Teste executado com sucesso.',
            metrics: {
              performance: Math.floor(Math.random() * 30) + 70,
              accuracy: Math.floor(Math.random() * 25) + 65,
              reliability: Math.floor(Math.random() * 20) + 80
            }
          };
          
          setTestResults(prev => [newResult, ...prev]);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ai': return <Brain className="w-5 h-5" />;
      case 'performance': return <Zap className="w-5 h-5" />;
      case 'ui': return <Layers className="w-5 h-5" />;
      case 'analytics': return <BarChart3 className="w-5 h-5" />;
      case 'trading': return <TrendingUp className="w-5 h-5" />;
      default: return <TestTube className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      testing: 'secondary',
      disabled: 'destructive',
      beta: 'outline'
    };
    const colors = {
      active: 'text-green-400',
      testing: 'text-yellow-400',
      disabled: 'text-red-400',
      beta: 'text-blue-400'
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any} className={colors[status as keyof typeof colors]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getRiskBadge = (risk: string) => {
    const variants = {
      low: 'default',
      medium: 'secondary',
      high: 'destructive'
    };
    return <Badge variant={variants[risk as keyof typeof variants] as any}>{risk.toUpperCase()}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <TestTube className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Laboratório Beta</h1>
            <Badge variant="outline" className="text-purple-400 border-purple-400">
              EXPERIMENTAL
            </Badge>
          </div>
          <p className="text-slate-300">Teste funcionalidades experimentais e contribua para o futuro da plataforma</p>
        </div>

        {/* Warning Banner */}
        <Card className="bg-yellow-900/20 border-yellow-500/50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <div>
                <h3 className="text-yellow-400 font-semibold">Aviso Importante</h3>
                <p className="text-yellow-200 text-sm">
                  As funcionalidades nesta seção são experimentais e podem ser instáveis. 
                  Use por sua conta e risco em ambiente de produção.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border-slate-700">
            <TabsTrigger value="features" className="flex items-center space-x-2">
              <Beaker className="w-4 h-4" />
              <span>Funcionalidades</span>
            </TabsTrigger>
            <TabsTrigger value="experiments" className="flex items-center space-x-2">
              <Atom className="w-4 h-4" />
              <span>Experimentos IA</span>
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center space-x-2">
              <TestTube className="w-4 h-4" />
              <span>Testes</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <Microscope className="w-4 h-4" />
              <span>Análises</span>
            </TabsTrigger>
          </TabsList>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="flex items-center justify-center py-6">
              <FuturisticButtonSVG />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card key={feature.id} className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {getCategoryIcon(feature.category)}
                        <div>
                          <CardTitle className="text-lg text-white">{feature.name}</CardTitle>
                          <p className="text-slate-400 text-sm">v{feature.version}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {getStatusBadge(feature.status)}
                        {getRiskBadge(feature.riskLevel)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 text-sm mb-4">{feature.description}</p>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Participantes:</span>
                      <span className="text-white">{feature.participants}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Taxa de Sucesso:</span>
                      <span className="text-green-400">{feature.successRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Atualizado:</span>
                      <span className="text-white">{new Date(feature.lastUpdated).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <button
                      onClick={() => toggleFeature(feature.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        feature.enabled 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-slate-600 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {feature.enabled ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span>{feature.enabled ? 'Ativado' : 'Desativado'}</span>
                    </button>
                    <button
                      onClick={() => runTest(feature.id)}
                      disabled={isRunningTest}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      <Play className="w-4 h-4" />
                      <span>Testar</span>
                    </button>
                  </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* AI Experiments Tab */}
          <TabsContent value="experiments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {aiExperiments.map((experiment) => (
                <Card key={experiment.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Dna className="w-6 h-6 text-purple-400" />
                        <div>
                          <CardTitle className="text-lg text-white">{experiment.name}</CardTitle>
                          <p className="text-slate-400 text-sm capitalize">{experiment.type}</p>
                        </div>
                      </div>
                      <Badge variant={experiment.status === 'running' ? 'default' : experiment.status === 'completed' ? 'outline' : 'secondary'}>
                        {experiment.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Progresso</span>
                        <span className="text-white">{experiment.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${experiment.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Início:</span>
                        <p className="text-white">{new Date(experiment.startTime).toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Conclusão:</span>
                        <p className="text-white">{new Date(experiment.estimatedCompletion).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>

                    {experiment.results && (
                      <div className="bg-slate-700/50 p-3 rounded-lg">
                        <h4 className="text-white font-medium mb-2">Resultados:</h4>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-slate-400">Padrões:</span>
                            <p className="text-white">{experiment.results.patterns}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Precisão:</span>
                            <p className="text-green-400">{experiment.results.accuracy}%</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Confiança:</span>
                            <p className="text-blue-400">{(experiment.results.confidence * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Iniciar Novo Experimento
                </CardTitle>
              </CardHeader>
              <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-slate-300">Tipo de Experimento</Label>
                  <select className="w-full p-2 bg-slate-700 border border-slate-600 text-white rounded-md">
                    <option value="prediction">Predição</option>
                    <option value="optimization">Otimização</option>
                    <option value="analysis">Análise</option>
                    <option value="automation">Automação</option>
                  </select>
                </div>
                <div>
                  <Label className="text-slate-300">Dataset</Label>
                  <select className="w-full p-2 bg-slate-700 border border-slate-600 text-white rounded-md">
                    <option value="historical">Dados Históricos</option>
                    <option value="realtime">Tempo Real</option>
                    <option value="synthetic">Sintético</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Iniciar Experimento
                  </button>
                </div>
              </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            {isRunningTest && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white flex items-center space-x-3">
                    <Activity className="w-6 h-6 text-purple-400 animate-pulse" />
                    <span>Executando Teste...</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Progresso</span>
                    <span className="text-white">{Math.round(testProgress)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3">
                    <div 
                      className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${testProgress}%` }}
                    />
                  </div>
                </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {testResults.map((result) => (
                <Card key={result.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                      {result.status === 'success' ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : result.status === 'warning' ? (
                        <AlertTriangle className="w-6 h-6 text-yellow-400" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-400" />
                      )}
                      <div>
                        <CardTitle className="text-lg text-white">
                          {features.find(f => f.id === result.featureId)?.name || 'Teste Desconhecido'}
                        </CardTitle>
                        <p className="text-slate-400 text-sm">{result.timestamp}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-sm">Duração</p>
                      <p className="text-white">{(result.duration / 1000).toFixed(1)}s</p>
                    </div>
                  </div>
                  </CardHeader>
                  <CardContent>

                  <p className="text-slate-300 mb-4">{result.message}</p>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-slate-400 text-sm">Performance</p>
                      <p className="text-2xl font-bold text-blue-400">{result.metrics.performance}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400 text-sm">Precisão</p>
                      <p className="text-2xl font-bold text-green-400">{result.metrics.accuracy}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400 text-sm">Confiabilidade</p>
                      <p className="text-2xl font-bold text-purple-400">{result.metrics.reliability}%</p>
                    </div>
                  </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-white flex items-center space-x-3">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    <span>Features Ativas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-400">{features.filter(f => f.enabled).length}</p>
                  <p className="text-slate-400 text-sm">de {features.length} disponíveis</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-white flex items-center space-x-3">
                    <Target className="w-6 h-6 text-green-400" />
                    <span>Taxa de Sucesso</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-400">
                    {(features.reduce((acc, f) => acc + f.successRate, 0) / features.length).toFixed(1)}%
                  </p>
                  <p className="text-slate-400 text-sm">média geral</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-white flex items-center space-x-3">
                    <Activity className="w-6 h-6 text-blue-400" />
                    <span>Experimentos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-400">{aiExperiments.length}</p>
                  <p className="text-slate-400 text-sm">em andamento</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-white flex items-center space-x-3">
                    <TestTube className="w-6 h-6 text-yellow-400" />
                    <span>Testes Hoje</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-yellow-400">{testResults.length}</p>
                  <p className="text-slate-400 text-sm">executados</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center">
                    <PieChart className="w-5 h-5 mr-2" />
                    Distribuição por Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="space-y-3">
                  {['ai', 'performance', 'ui', 'analytics', 'trading'].map(category => {
                    const count = features.filter(f => f.category === category).length;
                    const percentage = (count / features.length) * 100;
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(category)}
                          <span className="text-slate-300 capitalize">{category}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-white text-sm w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center">
                    <LineChart className="w-5 h-5 mr-2" />
                    Performance Recente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="space-y-4">
                  {testResults.slice(0, 5).map((result, index) => (
                    <div key={result.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {result.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        )}
                        <span className="text-slate-300 text-sm">
                          {features.find(f => f.id === result.featureId)?.name?.substring(0, 20) || 'Teste'}...
                        </span>
                      </div>
                      <span className="text-white text-sm">{result.metrics.performance}%</span>
                    </div>
                  ))}
                </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
