'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  Brain, 
  Cpu, 
  Database, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  LineChart, 
  Activity, 
  Zap, 
  Target, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Upload, 
  Download, 
  Eye, 
  EyeOff,
  Plus,
  Trash2,
  Edit,
  Copy,
  RefreshCw,
  Monitor,
  Layers,
  GitBranch,
  FileText,
  Calendar,
  Users,
  Award
} from 'lucide-react'

interface MLModel {
  id: string
  name: string
  type: 'classification' | 'regression' | 'clustering' | 'neural_network'
  status: 'training' | 'ready' | 'deployed' | 'error' | 'stopped'
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  trainingProgress: number
  lastTrained: string
  datasetSize: number
  features: string[]
  hyperparameters: Record<string, any>
  performance: {
    predictions: number
    correctPredictions: number
    avgResponseTime: number
    uptime: number
  }
}

interface TrainingJob {
  id: string
  modelId: string
  modelName: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  progress: number
  startTime: string
  estimatedCompletion?: string
  logs: string[]
  metrics: {
    loss: number[]
    accuracy: number[]
    valLoss: number[]
    valAccuracy: number[]
  }
}

interface Dataset {
  id: string
  name: string
  size: number
  features: number
  samples: number
  type: 'training' | 'validation' | 'test'
  uploadDate: string
  status: 'processing' | 'ready' | 'error'
}

export default function MachineLearning() {
  const [models, setModels] = useState<MLModel[]>([])
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([])
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null)
  const [isCreateModelOpen, setIsCreateModelOpen] = useState(false)
  const [isTrainingOpen, setIsTrainingOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('models')

  // New model form
  const [newModel, setNewModel] = useState({
    name: '',
    type: 'classification' as MLModel['type'],
    description: '',
    features: [] as string[],
    hyperparameters: {
      learningRate: 0.001,
      epochs: 100,
      batchSize: 32,
      validationSplit: 0.2
    }
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Simular dados para demonstração
      const mockModels: MLModel[] = [
        {
          id: '1',
          name: 'Preditor de Padrões v2.1',
          type: 'neural_network',
          status: 'deployed',
          accuracy: 87.5,
          precision: 89.2,
          recall: 85.8,
          f1Score: 87.4,
          trainingProgress: 100,
          lastTrained: '2024-01-20T10:30:00Z',
          datasetSize: 50000,
          features: ['sequence_length', 'color_pattern', 'time_interval', 'previous_results'],
          hyperparameters: {
            learningRate: 0.001,
            epochs: 150,
            batchSize: 64,
            hiddenLayers: 3,
            neurons: [128, 64, 32]
          },
          performance: {
            predictions: 12450,
            correctPredictions: 10894,
            avgResponseTime: 45,
            uptime: 99.8
          }
        },
        {
          id: '2',
          name: 'Classificador de Tendências',
          type: 'classification',
          status: 'training',
          accuracy: 0,
          precision: 0,
          recall: 0,
          f1Score: 0,
          trainingProgress: 65,
          lastTrained: '2024-01-22T14:15:00Z',
          datasetSize: 25000,
          features: ['trend_direction', 'volume', 'volatility', 'market_sentiment'],
          hyperparameters: {
            learningRate: 0.01,
            epochs: 100,
            batchSize: 32,
            algorithm: 'random_forest'
          },
          performance: {
            predictions: 0,
            correctPredictions: 0,
            avgResponseTime: 0,
            uptime: 0
          }
        },
        {
          id: '3',
          name: 'Detector de Anomalias',
          type: 'clustering',
          status: 'ready',
          accuracy: 92.1,
          precision: 94.3,
          recall: 89.7,
          f1Score: 91.9,
          trainingProgress: 100,
          lastTrained: '2024-01-18T09:45:00Z',
          datasetSize: 75000,
          features: ['deviation_score', 'frequency', 'pattern_similarity', 'historical_context'],
          hyperparameters: {
            clusters: 5,
            algorithm: 'kmeans',
            maxIterations: 300
          },
          performance: {
            predictions: 8750,
            correctPredictions: 8063,
            avgResponseTime: 32,
            uptime: 98.5
          }
        }
      ]

      const mockTrainingJobs: TrainingJob[] = [
        {
          id: '1',
          modelId: '2',
          modelName: 'Classificador de Tendências',
          status: 'running',
          progress: 65,
          startTime: '2024-01-22T14:15:00Z',
          estimatedCompletion: '2024-01-22T16:30:00Z',
          logs: [
            'Iniciando treinamento...',
            'Carregando dataset (25000 amostras)',
            'Epoch 1/100 - Loss: 0.8234, Accuracy: 0.6543',
            'Epoch 10/100 - Loss: 0.4567, Accuracy: 0.7821',
            'Epoch 20/100 - Loss: 0.3245, Accuracy: 0.8234',
            'Epoch 30/100 - Loss: 0.2876, Accuracy: 0.8456',
            'Epoch 40/100 - Loss: 0.2543, Accuracy: 0.8678',
            'Epoch 50/100 - Loss: 0.2234, Accuracy: 0.8834',
            'Epoch 60/100 - Loss: 0.2012, Accuracy: 0.8923',
            'Epoch 65/100 - Loss: 0.1934, Accuracy: 0.8967'
          ],
          metrics: {
            loss: [0.8234, 0.6543, 0.4567, 0.3245, 0.2876, 0.2543, 0.2234, 0.2012, 0.1934],
            accuracy: [0.6543, 0.7234, 0.7821, 0.8234, 0.8456, 0.8678, 0.8834, 0.8923, 0.8967],
            valLoss: [0.8456, 0.6789, 0.4823, 0.3567, 0.3012, 0.2789, 0.2456, 0.2234, 0.2123],
            valAccuracy: [0.6234, 0.7012, 0.7654, 0.8012, 0.8234, 0.8456, 0.8612, 0.8734, 0.8823]
          }
        }
      ]

      const mockDatasets: Dataset[] = [
        {
          id: '1',
          name: 'Histórico de Padrões 2024',
          size: 125.5,
          features: 12,
          samples: 50000,
          type: 'training',
          uploadDate: '2024-01-15T08:30:00Z',
          status: 'ready'
        },
        {
          id: '2',
          name: 'Dados de Validação Q1',
          size: 45.2,
          features: 12,
          samples: 18000,
          type: 'validation',
          uploadDate: '2024-01-18T10:15:00Z',
          status: 'ready'
        },
        {
          id: '3',
          name: 'Dataset de Teste Recente',
          size: 32.8,
          features: 12,
          samples: 12500,
          type: 'test',
          uploadDate: '2024-01-20T14:45:00Z',
          status: 'processing'
        }
      ]

      setModels(mockModels)
      setTrainingJobs(mockTrainingJobs)
      setDatasets(mockDatasets)
    } catch (error) {
      toast.error('Erro ao carregar dados de ML')
    } finally {
      setLoading(false)
    }
  }

  const createModel = async () => {
    try {
      const model: MLModel = {
        id: Date.now().toString(),
        name: newModel.name,
        type: newModel.type,
        status: 'ready',
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        trainingProgress: 0,
        lastTrained: new Date().toISOString(),
        datasetSize: 0,
        features: newModel.features,
        hyperparameters: newModel.hyperparameters,
        performance: {
          predictions: 0,
          correctPredictions: 0,
          avgResponseTime: 0,
          uptime: 0
        }
      }

      setModels(prev => [...prev, model])
      setIsCreateModelOpen(false)
      setNewModel({
        name: '',
        type: 'classification',
        description: '',
        features: [],
        hyperparameters: {
          learningRate: 0.001,
          epochs: 100,
          batchSize: 32,
          validationSplit: 0.2
        }
      })
      toast.success('Modelo criado com sucesso!')
    } catch (error) {
      toast.error('Erro ao criar modelo')
    }
  }

  const startTraining = async (modelId: string) => {
    try {
      const model = models.find(m => m.id === modelId)
      if (!model) return

      const trainingJob: TrainingJob = {
        id: Date.now().toString(),
        modelId,
        modelName: model.name,
        status: 'running',
        progress: 0,
        startTime: new Date().toISOString(),
        logs: ['Iniciando treinamento...'],
        metrics: {
          loss: [],
          accuracy: [],
          valLoss: [],
          valAccuracy: []
        }
      }

      setTrainingJobs(prev => [...prev, trainingJob])
      setModels(prev => prev.map(m => 
        m.id === modelId ? { ...m, status: 'training' as const } : m
      ))
      
      toast.success('Treinamento iniciado!')
    } catch (error) {
      toast.error('Erro ao iniciar treinamento')
    }
  }

  const stopTraining = async (jobId: string) => {
    try {
      setTrainingJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'completed' as const } : job
      ))
      toast.success('Treinamento interrompido!')
    } catch (error) {
      toast.error('Erro ao parar treinamento')
    }
  }

  const deployModel = async (modelId: string) => {
    try {
      setModels(prev => prev.map(m => 
        m.id === modelId ? { ...m, status: 'deployed' as const } : m
      ))
      toast.success('Modelo implantado com sucesso!')
    } catch (error) {
      toast.error('Erro ao implantar modelo')
    }
  }

  const deleteModel = async (modelId: string) => {
    try {
      setModels(prev => prev.filter(m => m.id !== modelId))
      toast.success('Modelo excluído com sucesso!')
    } catch (error) {
      toast.error('Erro ao excluir modelo')
    }
  }

  const getStatusColor = (status: MLModel['status']) => {
    switch (status) {
      case 'deployed': return 'bg-green-100 text-green-800 border-green-200'
      case 'ready': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'training': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'stopped': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: MLModel['status']) => {
    switch (status) {
      case 'deployed': return <CheckCircle className="h-4 w-4" />
      case 'ready': return <Clock className="h-4 w-4" />
      case 'training': return <Activity className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      case 'stopped': return <Square className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getModelTypeLabel = (type: MLModel['type']) => {
    switch (type) {
      case 'classification': return 'Classificação'
      case 'regression': return 'Regressão'
      case 'clustering': return 'Agrupamento'
      case 'neural_network': return 'Rede Neural'
      default: return type
    }
  }

  const deployedModels = models.filter(m => m.status === 'deployed')
  const trainingModels = models.filter(m => m.status === 'training')
  const readyModels = models.filter(m => m.status === 'ready')

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Machine Learning</h1>
            <p className="text-muted-foreground">
              Configure e monitore modelos de IA para análise preditiva
            </p>
          </div>
          <Button onClick={() => setIsCreateModelOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Modelo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Modelos</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{models.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Implantados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{deployedModels.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Treinando</CardTitle>
              <Activity className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{trainingModels.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Predições Hoje</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {deployedModels.reduce((acc, m) => acc + m.performance.predictions, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="models">Modelos ({models.length})</TabsTrigger>
            <TabsTrigger value="training">Treinamento ({trainingJobs.length})</TabsTrigger>
            <TabsTrigger value="datasets">Datasets ({datasets.length})</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="space-y-4">
            {models.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum modelo criado</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Crie seu primeiro modelo de machine learning para começar
                  </p>
                  <Button onClick={() => setIsCreateModelOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Primeiro Modelo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {models.map((model) => (
                  <Card key={model.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg border ${getStatusColor(model.status)}`}>
                            {getStatusIcon(model.status)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{model.name}</CardTitle>
                            <CardDescription>
                              {getModelTypeLabel(model.type)} • {model.features.length} features • {model.datasetSize.toLocaleString()} amostras
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusColor(model.status)}>
                            {model.status === 'deployed' && 'Implantado'}
                            {model.status === 'ready' && 'Pronto'}
                            {model.status === 'training' && 'Treinando'}
                            {model.status === 'error' && 'Erro'}
                            {model.status === 'stopped' && 'Parado'}
                          </Badge>
                          {model.status === 'ready' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startTraining(model.id)}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deployModel(model.id)}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {model.status === 'deployed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedModel(model)}
                            >
                              <Monitor className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteModel(model.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {model.status === 'training' && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">Progresso do Treinamento</span>
                            <span className="text-sm font-medium">{model.trainingProgress}%</span>
                          </div>
                          <Progress value={model.trainingProgress} className="h-2" />
                        </div>
                      )}
                      
                      {model.status === 'deployed' && (
                        <div className="grid gap-4 md:grid-cols-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {model.accuracy.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Acurácia</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {model.performance.predictions.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Predições</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {model.performance.avgResponseTime}ms
                            </div>
                            <div className="text-sm text-muted-foreground">Tempo Médio</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {model.performance.uptime.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Uptime</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Último treinamento: {new Date(model.lastTrained).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{getModelTypeLabel(model.type)}</Badge>
                          <Badge variant="outline">{model.features.length} features</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="training" className="space-y-4">
            {trainingJobs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum treinamento ativo</h3>
                  <p className="text-muted-foreground text-center">
                    Inicie o treinamento de um modelo para ver o progresso aqui
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {trainingJobs.map((job) => (
                  <Card key={job.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{job.modelName}</CardTitle>
                          <CardDescription>
                            Iniciado em {new Date(job.startTime).toLocaleString('pt-BR')}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={job.status === 'running' ? 'default' : 'secondary'}>
                            {job.status === 'running' && 'Executando'}
                            {job.status === 'completed' && 'Concluído'}
                            {job.status === 'failed' && 'Falhou'}
                            {job.status === 'queued' && 'Na Fila'}
                          </Badge>
                          {job.status === 'running' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => stopTraining(job.id)}
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">Progresso</span>
                            <span className="text-sm font-medium">{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} className="h-2" />
                          {job.estimatedCompletion && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Conclusão estimada: {new Date(job.estimatedCompletion).toLocaleString('pt-BR')}
                            </div>
                          )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Métricas de Treinamento</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Loss:</span>
                                <span className="text-sm font-medium">
                                  {job.metrics.loss[job.metrics.loss.length - 1]?.toFixed(4) || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Accuracy:</span>
                                <span className="text-sm font-medium">
                                  {((job.metrics.accuracy[job.metrics.accuracy.length - 1] || 0) * 100).toFixed(2)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Val Loss:</span>
                                <span className="text-sm font-medium">
                                  {job.metrics.valLoss[job.metrics.valLoss.length - 1]?.toFixed(4) || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Val Accuracy:</span>
                                <span className="text-sm font-medium">
                                  {((job.metrics.valAccuracy[job.metrics.valAccuracy.length - 1] || 0) * 100).toFixed(2)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium mb-2">Logs Recentes</h4>
                            <div className="bg-muted rounded-lg p-3 text-xs font-mono max-h-32 overflow-y-auto">
                              {job.logs.slice(-5).map((log, index) => (
                                <div key={index} className="mb-1">{log}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="datasets" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Datasets Disponíveis</h3>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Dataset
              </Button>
            </div>

            <div className="grid gap-4">
              {datasets.map((dataset) => (
                <Card key={dataset.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{dataset.name}</CardTitle>
                        <CardDescription>
                          {dataset.samples.toLocaleString()} amostras • {dataset.features} features • {dataset.size} MB
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {dataset.type === 'training' && 'Treinamento'}
                          {dataset.type === 'validation' && 'Validação'}
                          {dataset.type === 'test' && 'Teste'}
                        </Badge>
                        <Badge variant={dataset.status === 'ready' ? 'default' : 'secondary'}>
                          {dataset.status === 'ready' && 'Pronto'}
                          {dataset.status === 'processing' && 'Processando'}
                          {dataset.status === 'error' && 'Erro'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Upload em {new Date(dataset.uploadDate).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Performance dos Modelos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {deployedModels.map((model) => (
                      <div key={model.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{model.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {model.performance.predictions.toLocaleString()} predições
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            {model.accuracy.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {model.performance.avgResponseTime}ms
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Uso de Recursos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">CPU</span>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Memória</span>
                        <span className="text-sm font-medium">67%</span>
                      </div>
                      <Progress value={67} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">GPU</span>
                        <span className="text-sm font-medium">23%</span>
                      </div>
                      <Progress value={23} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Model Dialog */}
        <Dialog open={isCreateModelOpen} onOpenChange={setIsCreateModelOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Modelo</DialogTitle>
              <DialogDescription>
                Configure um novo modelo de machine learning
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Nome do Modelo</Label>
                  <Input
                    id="name"
                    value={newModel.name}
                    onChange={(e) => setNewModel(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Preditor de Padrões v3"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo de Modelo</Label>
                  <Select
                    value={newModel.type}
                    onValueChange={(value: MLModel['type']) => setNewModel(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classification">Classificação</SelectItem>
                      <SelectItem value="regression">Regressão</SelectItem>
                      <SelectItem value="clustering">Agrupamento</SelectItem>
                      <SelectItem value="neural_network">Rede Neural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newModel.description}
                  onChange={(e) => setNewModel(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o objetivo e funcionamento do modelo"
                />
              </div>

              <div>
                <Label>Hiperparâmetros</Label>
                <div className="grid gap-4 md:grid-cols-2 mt-2">
                  <div>
                    <Label className="text-sm">Learning Rate</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={newModel.hyperparameters.learningRate}
                      onChange={(e) => setNewModel(prev => ({
                        ...prev,
                        hyperparameters: {
                          ...prev.hyperparameters,
                          learningRate: parseFloat(e.target.value)
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Epochs</Label>
                    <Input
                      type="number"
                      value={newModel.hyperparameters.epochs}
                      onChange={(e) => setNewModel(prev => ({
                        ...prev,
                        hyperparameters: {
                          ...prev.hyperparameters,
                          epochs: parseInt(e.target.value)
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Batch Size</Label>
                    <Input
                      type="number"
                      value={newModel.hyperparameters.batchSize}
                      onChange={(e) => setNewModel(prev => ({
                        ...prev,
                        hyperparameters: {
                          ...prev.hyperparameters,
                          batchSize: parseInt(e.target.value)
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Validation Split</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={newModel.hyperparameters.validationSplit}
                      onChange={(e) => setNewModel(prev => ({
                        ...prev,
                        hyperparameters: {
                          ...prev.hyperparameters,
                          validationSplit: parseFloat(e.target.value)
                        }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModelOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createModel} disabled={!newModel.name}>
                Criar Modelo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}