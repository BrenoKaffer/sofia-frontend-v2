'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  Plus, 
  Save, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Target, 
  Trash2,
  Copy,
  Download,
  Upload,
  Eye,
  EyeOff,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Puzzle,
  Layers,
  GitBranch,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react'

interface StrategyNode {
  id: string
  type: 'condition' | 'action' | 'logic' | 'trigger'
  position: { x: number; y: number }
  data: {
    label: string
    config: Record<string, any>
    connections: string[]
  }
}

interface Strategy {
  id: string
  name: string
  description: string
  nodes: StrategyNode[]
  connections: Connection[]
  status: 'draft' | 'active' | 'paused' | 'testing'
  performance: {
    winRate: number
    totalTrades: number
    profit: number
    drawdown: number
  }
  createdAt: string
  lastModified: string
}

interface Connection {
  id: string
  source: string
  target: string
  type: 'success' | 'failure' | 'condition'
}

interface NodeTemplate {
  type: string
  category: string
  label: string
  description: string
  icon: any
  defaultConfig: Record<string, any>
}

const nodeTemplates: NodeTemplate[] = [
  // Triggers
  {
    type: 'pattern_trigger',
    category: 'triggers',
    label: 'Padrão Detectado',
    description: 'Inicia quando um padrão específico é detectado',
    icon: Target,
    defaultConfig: { pattern: '', confidence: 80 }
  },
  {
    type: 'time_trigger',
    category: 'triggers',
    label: 'Gatilho de Tempo',
    description: 'Inicia em horários específicos',
    icon: Clock,
    defaultConfig: { schedule: '*/5 * * * *' }
  },
  {
    type: 'signal_trigger',
    category: 'triggers',
    label: 'Sinal Externo',
    description: 'Inicia com sinais de outras estratégias',
    icon: Zap,
    defaultConfig: { signalType: 'custom' }
  },

  // Conditions
  {
    type: 'bankroll_condition',
    category: 'conditions',
    label: 'Condição de Banca',
    description: 'Verifica estado da banca',
    icon: DollarSign,
    defaultConfig: { minBalance: 100, maxRisk: 5 }
  },
  {
    type: 'pattern_condition',
    category: 'conditions',
    label: 'Condição de Padrão',
    description: 'Verifica padrões específicos',
    icon: BarChart3,
    defaultConfig: { pattern: '', minConfidence: 70 }
  },
  {
    type: 'time_condition',
    category: 'conditions',
    label: 'Condição de Tempo',
    description: 'Verifica horários ou durações',
    icon: Clock,
    defaultConfig: { timeRange: { start: '09:00', end: '18:00' } }
  },

  // Actions
  {
    type: 'bet_action',
    category: 'actions',
    label: 'Fazer Aposta',
    description: 'Executa uma aposta',
    icon: TrendingUp,
    defaultConfig: { amount: 10, type: 'fixed', target: 'red' }
  },
  {
    type: 'stop_action',
    category: 'actions',
    label: 'Parar Estratégia',
    description: 'Para a execução da estratégia',
    icon: Pause,
    defaultConfig: { reason: 'manual' }
  },
  {
    type: 'notification_action',
    category: 'actions',
    label: 'Enviar Notificação',
    description: 'Envia alerta ou notificação',
    icon: AlertCircle,
    defaultConfig: { message: '', type: 'info' }
  },

  // Logic
  {
    type: 'and_logic',
    category: 'logic',
    label: 'E (AND)',
    description: 'Todas as condições devem ser verdadeiras',
    icon: GitBranch,
    defaultConfig: { operator: 'and' }
  },
  {
    type: 'or_logic',
    category: 'logic',
    label: 'OU (OR)',
    description: 'Pelo menos uma condição deve ser verdadeira',
    icon: GitBranch,
    defaultConfig: { operator: 'or' }
  },
  {
    type: 'delay_logic',
    category: 'logic',
    label: 'Atraso',
    description: 'Adiciona atraso entre ações',
    icon: Clock,
    defaultConfig: { delay: 5000 }
  }
]

export default function BuilderDeEstrategias() {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [currentStrategy, setCurrentStrategy] = useState<Strategy | null>(null)
  const [selectedNode, setSelectedNode] = useState<StrategyNode | null>(null)
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [activeTab, setActiveTab] = useState('strategies')

  // Builder state
  const [nodes, setNodes] = useState<StrategyNode[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<string | null>(null)

  useEffect(() => {
    loadStrategies()
  }, [])

  const loadStrategies = async () => {
    try {
      setLoading(true)
      // Simular dados para demonstração
      const mockStrategies: Strategy[] = [
        {
          id: '1',
          name: 'Estratégia Martingale Inteligente',
          description: 'Martingale com stop loss e análise de padrões',
          nodes: [],
          connections: [],
          status: 'active',
          performance: {
            winRate: 68.5,
            totalTrades: 245,
            profit: 1250.75,
            drawdown: -125.30
          },
          createdAt: '2024-01-15T10:30:00Z',
          lastModified: '2024-01-20T14:22:00Z'
        },
        {
          id: '2',
          name: 'Caça Padrões Avançado',
          description: 'Detecta múltiplos padrões e executa apostas precisas',
          nodes: [],
          connections: [],
          status: 'testing',
          performance: {
            winRate: 72.3,
            totalTrades: 89,
            profit: 890.25,
            drawdown: -45.80
          },
          createdAt: '2024-01-10T09:15:00Z',
          lastModified: '2024-01-18T16:45:00Z'
        },
        {
          id: '3',
          name: 'Gestão de Banca Conservadora',
          description: 'Foco em preservação de capital com crescimento gradual',
          nodes: [],
          connections: [],
          status: 'draft',
          performance: {
            winRate: 0,
            totalTrades: 0,
            profit: 0,
            drawdown: 0
          },
          createdAt: '2024-01-22T11:20:00Z',
          lastModified: '2024-01-22T11:20:00Z'
        }
      ]
      setStrategies(mockStrategies)
    } catch (error) {
      toast.error('Erro ao carregar estratégias')
    } finally {
      setLoading(false)
    }
  }

  const createNewStrategy = () => {
    const newStrategy: Strategy = {
      id: Date.now().toString(),
      name: 'Nova Estratégia',
      description: 'Descrição da estratégia',
      nodes: [],
      connections: [],
      status: 'draft',
      performance: {
        winRate: 0,
        totalTrades: 0,
        profit: 0,
        drawdown: 0
      },
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
    
    setCurrentStrategy(newStrategy)
    setNodes([])
    setConnections([])
    setIsBuilderOpen(true)
  }

  const editStrategy = (strategy: Strategy) => {
    setCurrentStrategy(strategy)
    setNodes(strategy.nodes)
    setConnections(strategy.connections)
    setIsBuilderOpen(true)
  }

  const saveStrategy = async () => {
    if (!currentStrategy) return

    try {
      setSaving(true)
      
      const updatedStrategy = {
        ...currentStrategy,
        nodes,
        connections,
        lastModified: new Date().toISOString()
      }

      const existingIndex = strategies.findIndex(s => s.id === currentStrategy.id)
      if (existingIndex >= 0) {
        setStrategies(prev => prev.map(s => s.id === currentStrategy.id ? updatedStrategy : s))
        toast.success('Estratégia atualizada com sucesso!')
      } else {
        setStrategies(prev => [...prev, updatedStrategy])
        toast.success('Estratégia criada com sucesso!')
      }

      setCurrentStrategy(updatedStrategy)
    } catch (error) {
      toast.error('Erro ao salvar estratégia')
    } finally {
      setSaving(false)
    }
  }

  const deleteStrategy = async (strategyId: string) => {
    try {
      setStrategies(prev => prev.filter(s => s.id !== strategyId))
      toast.success('Estratégia excluída com sucesso!')
    } catch (error) {
      toast.error('Erro ao excluir estratégia')
    }
  }

  const toggleStrategyStatus = async (strategyId: string, newStatus: Strategy['status']) => {
    try {
      setStrategies(prev => prev.map(s => 
        s.id === strategyId ? { ...s, status: newStatus } : s
      ))
      toast.success(`Estratégia ${newStatus === 'active' ? 'ativada' : 'pausada'} com sucesso!`)
    } catch (error) {
      toast.error('Erro ao alterar status da estratégia')
    }
  }

  const testStrategy = async () => {
    if (!currentStrategy) return

    try {
      setTesting(true)
      // Simular teste da estratégia
      await new Promise(resolve => setTimeout(resolve, 3000))
      toast.success('Teste da estratégia concluído com sucesso!')
    } catch (error) {
      toast.error('Erro ao testar estratégia')
    } finally {
      setTesting(false)
    }
  }

  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    const template = nodeTemplates.find(t => t.type === type)
    if (!template) return

    const newNode: StrategyNode = {
      id: Date.now().toString(),
      type: template.category as any,
      position,
      data: {
        label: template.label,
        config: { ...template.defaultConfig },
        connections: []
      }
    }

    setNodes(prev => [...prev, newNode])
  }, [])

  const updateNode = (nodeId: string, updates: Partial<StrategyNode>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ))
  }

  const deleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId))
    setConnections(prev => prev.filter(conn => 
      conn.source !== nodeId && conn.target !== nodeId
    ))
  }

  const addConnection = (sourceId: string, targetId: string) => {
    const newConnection: Connection = {
      id: `${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      type: 'success'
    }
    setConnections(prev => [...prev, newConnection])
  }

  const getStatusColor = (status: Strategy['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'testing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: Strategy['status']) => {
    switch (status) {
      case 'active': return <Play className="h-4 w-4" />
      case 'testing': return <BarChart3 className="h-4 w-4" />
      case 'paused': return <Pause className="h-4 w-4" />
      case 'draft': return <Settings className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const activeStrategies = strategies.filter(s => s.status === 'active')
  const draftStrategies = strategies.filter(s => s.status === 'draft')
  const testingStrategies = strategies.filter(s => s.status === 'testing')

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Builder de Estratégias</h1>
            <p className="text-muted-foreground">
              Crie e gerencie estratégias personalizadas com interface visual
            </p>
          </div>
          <Button onClick={createNewStrategy} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Estratégia
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Estratégias</CardTitle>
              <Puzzle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{strategies.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
              <Play className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeStrategies.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Teste</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{testingStrategies.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
              <Settings className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500">{draftStrategies.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="strategies">Minhas Estratégias ({strategies.length})</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="strategies" className="space-y-4">
            {strategies.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Puzzle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma estratégia criada</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Crie sua primeira estratégia personalizada usando o builder visual
                  </p>
                  <Button onClick={createNewStrategy} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Primeira Estratégia
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {strategies.map((strategy) => (
                  <Card key={strategy.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg border ${getStatusColor(strategy.status)}`}>
                            {getStatusIcon(strategy.status)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{strategy.name}</CardTitle>
                            <CardDescription>{strategy.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusColor(strategy.status)}>
                            {strategy.status === 'active' && 'Ativa'}
                            {strategy.status === 'testing' && 'Testando'}
                            {strategy.status === 'paused' && 'Pausada'}
                            {strategy.status === 'draft' && 'Rascunho'}
                          </Badge>
                          {strategy.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => editStrategy(strategy)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          )}
                          {strategy.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleStrategyStatus(strategy.id, 'paused')}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          {strategy.status === 'paused' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleStrategyStatus(strategy.id, 'active')}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editStrategy(strategy)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteStrategy(strategy.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {strategy.performance.winRate.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Taxa de Acerto</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {strategy.performance.totalTrades}
                          </div>
                          <div className="text-sm text-muted-foreground">Total de Trades</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${strategy.performance.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {strategy.performance.profit.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">Lucro Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            R$ {Math.abs(strategy.performance.drawdown).toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">Drawdown</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Criada em {new Date(strategy.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Modificada em {new Date(strategy.lastModified).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Martingale Clássico
                  </CardTitle>
                  <CardDescription>
                    Estratégia de progressão com dobramento após perdas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full gap-2">
                    <Copy className="h-4 w-4" />
                    Usar Template
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Caça Padrões
                  </CardTitle>
                  <CardDescription>
                    Detecta padrões específicos e executa apostas direcionadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full gap-2">
                    <Copy className="h-4 w-4" />
                    Usar Template
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Gestão de Banca
                  </CardTitle>
                  <CardDescription>
                    Foco em preservação de capital e crescimento sustentável
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full gap-2">
                    <Copy className="h-4 w-4" />
                    Usar Template
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Geral</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Lucro Total:</span>
                      <span className="font-bold text-green-600">
                        R$ {strategies.reduce((acc, s) => acc + s.performance.profit, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total de Trades:</span>
                      <span className="font-bold">
                        {strategies.reduce((acc, s) => acc + s.performance.totalTrades, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de Acerto Média:</span>
                      <span className="font-bold">
                        {(strategies.reduce((acc, s) => acc + s.performance.winRate, 0) / strategies.length || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estratégias Mais Rentáveis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {strategies
                      .sort((a, b) => b.performance.profit - a.performance.profit)
                      .slice(0, 3)
                      .map((strategy, index) => (
                        <div key={strategy.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{index + 1}º</Badge>
                            <span className="text-sm">{strategy.name}</span>
                          </div>
                          <span className={`text-sm font-bold ${strategy.performance.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {strategy.performance.profit.toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Strategy Builder Dialog */}
        <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Puzzle className="h-5 w-5" />
                {currentStrategy?.name || 'Nova Estratégia'}
              </DialogTitle>
              <DialogDescription>
                Use o builder visual para criar e editar sua estratégia
              </DialogDescription>
            </DialogHeader>

            <div className="flex h-[70vh]">
              {/* Toolbox */}
              <div className="w-64 border-r bg-muted/30 p-4 overflow-y-auto">
                <h3 className="font-semibold mb-4">Componentes</h3>
                
                {['triggers', 'conditions', 'actions', 'logic'].map((category) => (
                  <div key={category} className="mb-6">
                    <h4 className="text-sm font-medium mb-2 capitalize">
                      {category === 'triggers' && 'Gatilhos'}
                      {category === 'conditions' && 'Condições'}
                      {category === 'actions' && 'Ações'}
                      {category === 'logic' && 'Lógica'}
                    </h4>
                    <div className="space-y-2">
                      {nodeTemplates
                        .filter(template => template.category === category)
                        .map((template) => (
                          <div
                            key={template.type}
                            className="p-2 border rounded cursor-pointer hover:bg-background transition-colors"
                            draggable
                            onDragStart={() => setDraggedNodeType(template.type)}
                          >
                            <div className="flex items-center gap-2">
                              <template.icon className="h-4 w-4" />
                              <span className="text-sm">{template.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {template.description}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Canvas */}
              <div 
                className="flex-1 relative bg-grid-pattern overflow-hidden"
                onDrop={(e) => {
                  e.preventDefault()
                  if (draggedNodeType) {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const position = {
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top
                    }
                    addNode(draggedNodeType, position)
                    setDraggedNodeType(null)
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                {/* Nodes */}
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className="absolute bg-white border-2 border-gray-300 rounded-lg p-3 cursor-move shadow-sm hover:shadow-md transition-shadow"
                    style={{
                      left: node.position.x,
                      top: node.position.y,
                      minWidth: '150px'
                    }}
                    onClick={() => setSelectedNode(node)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{node.data.label}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNode(node.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Object.keys(node.data.config).length} configurações
                    </div>
                  </div>
                ))}

                {/* Empty state */}
                {nodes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Canvas Vazio</h3>
                      <p className="text-muted-foreground">
                        Arraste componentes da barra lateral para começar a construir sua estratégia
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Properties Panel */}
              {selectedNode && (
                <div className="w-80 border-l bg-muted/30 p-4 overflow-y-auto">
                  <h3 className="font-semibold mb-4">Propriedades</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Nome do Componente</Label>
                      <Input
                        value={selectedNode.data.label}
                        onChange={(e) => updateNode(selectedNode.id, {
                          data: { ...selectedNode.data, label: e.target.value }
                        })}
                      />
                    </div>

                    <div>
                      <Label>Configurações</Label>
                      <div className="space-y-2 mt-2">
                        {Object.entries(selectedNode.data.config).map(([key, value]) => (
                          <div key={key}>
                            <Label className="text-xs">{key}</Label>
                            <Input
                              value={String(value)}
                              onChange={(e) => updateNode(selectedNode.id, {
                                data: {
                                  ...selectedNode.data,
                                  config: {
                                    ...selectedNode.data.config,
                                    [key]: e.target.value
                                  }
                                }
                              })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <div className="flex items-center gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={testStrategy}
                  disabled={testing}
                  className="gap-2"
                >
                  {testing ? (
                    <>
                      <BarChart3 className="h-4 w-4 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Testar
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsBuilderOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={saveStrategy} disabled={saving} className="gap-2">
                  {saving ? (
                    <>
                      <Save className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}