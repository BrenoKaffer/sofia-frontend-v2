'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Bell, 
  Target, 
  Settings, 
  Save, 
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react'

interface CustomSignal {
  id: string
  name: string
  description: string
  enabled: boolean
  conditions: SignalCondition[]
  actions: SignalAction[]
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  lastTriggered?: string
  triggerCount: number
}

interface SignalCondition {
  id: string
  type: 'pattern' | 'sequence' | 'frequency' | 'streak' | 'custom'
  parameter: string
  operator: 'equals' | 'greater' | 'less' | 'contains' | 'not_equals'
  value: string | number
  description: string
}

interface SignalAction {
  id: string
  type: 'notification' | 'email' | 'sound' | 'webhook'
  config: Record<string, any>
  enabled: boolean
}

const conditionTypes = [
  { value: 'pattern', label: 'Padrão Específico', description: 'Detecta padrões específicos nas roletas' },
  { value: 'sequence', label: 'Sequência', description: 'Monitora sequências de resultados' },
  { value: 'frequency', label: 'Frequência', description: 'Analisa frequência de ocorrências' },
  { value: 'streak', label: 'Sequência Consecutiva', description: 'Detecta sequências consecutivas' },
  { value: 'custom', label: 'Personalizado', description: 'Condição personalizada avançada' }
]

const operators = [
  { value: 'equals', label: 'Igual a' },
  { value: 'greater', label: 'Maior que' },
  { value: 'less', label: 'Menor que' },
  { value: 'contains', label: 'Contém' },
  { value: 'not_equals', label: 'Diferente de' }
]

const actionTypes = [
  { value: 'notification', label: 'Notificação no App', icon: Bell },
  { value: 'email', label: 'Email', icon: Target },
  { value: 'sound', label: 'Som de Alerta', icon: Settings },
  { value: 'webhook', label: 'Webhook', icon: BarChart3 }
]

export default function PadroesPersonalizados() {
  const [signals, setSignals] = useState<CustomSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSignal, setEditingSignal] = useState<CustomSignal | null>(null)
  const [activeTab, setActiveTab] = useState('active')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    enabled: true,
    conditions: [] as SignalCondition[],
    actions: [] as SignalAction[]
  })

  useEffect(() => {
    loadSignals()
  }, [])

  const loadSignals = async () => {
    try {
      setLoading(true)
      // Simular dados para demonstração
      const mockSignals: CustomSignal[] = [
        {
          id: '1',
          name: 'Padrão Vermelho Consecutivo',
          description: 'Alerta quando aparecem 5 vermelhos consecutivos',
          enabled: true,
          conditions: [
            {
              id: '1',
              type: 'streak',
              parameter: 'color',
              operator: 'equals',
              value: 'red',
              description: '5 vermelhos consecutivos'
            }
          ],
          actions: [
            {
              id: '1',
              type: 'notification',
              config: { message: 'Padrão detectado: 5 vermelhos consecutivos!' },
              enabled: true
            }
          ],
          priority: 'high',
          createdAt: '2024-01-15T10:30:00Z',
          lastTriggered: '2024-01-20T14:22:00Z',
          triggerCount: 12
        },
        {
          id: '2',
          name: 'Números Pares Frequentes',
          description: 'Monitora alta frequência de números pares',
          enabled: true,
          conditions: [
            {
              id: '2',
              type: 'frequency',
              parameter: 'even_numbers',
              operator: 'greater',
              value: 70,
              description: 'Mais de 70% números pares em 20 rodadas'
            }
          ],
          actions: [
            {
              id: '2',
              type: 'notification',
              config: { message: 'Alta frequência de números pares detectada!' },
              enabled: true
            },
            {
              id: '3',
              type: 'sound',
              config: { soundType: 'alert' },
              enabled: true
            }
          ],
          priority: 'medium',
          createdAt: '2024-01-10T09:15:00Z',
          triggerCount: 8
        }
      ]
      setSignals(mockSignals)
    } catch (error) {
      toast.error('Erro ao carregar padrões personalizados')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSignal = () => {
    setEditingSignal(null)
    setFormData({
      name: '',
      description: '',
      priority: 'medium',
      enabled: true,
      conditions: [],
      actions: []
    })
    setIsDialogOpen(true)
  }

  const handleEditSignal = (signal: CustomSignal) => {
    setEditingSignal(signal)
    setFormData({
      name: signal.name,
      description: signal.description,
      priority: signal.priority,
      enabled: signal.enabled,
      conditions: signal.conditions,
      actions: signal.actions
    })
    setIsDialogOpen(true)
  }

  const handleSaveSignal = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Nome do padrão é obrigatório')
        return
      }

      if (formData.conditions.length === 0) {
        toast.error('Adicione pelo menos uma condição')
        return
      }

      if (formData.actions.length === 0) {
        toast.error('Adicione pelo menos uma ação')
        return
      }

      // Simular salvamento
      const newSignal: CustomSignal = {
        id: editingSignal?.id || Date.now().toString(),
        name: formData.name,
        description: formData.description,
        enabled: formData.enabled,
        conditions: formData.conditions,
        actions: formData.actions,
        priority: formData.priority,
        createdAt: editingSignal?.createdAt || new Date().toISOString(),
        triggerCount: editingSignal?.triggerCount || 0
      }

      if (editingSignal) {
        setSignals(prev => prev.map(s => s.id === editingSignal.id ? newSignal : s))
        toast.success('Padrão atualizado com sucesso!')
      } else {
        setSignals(prev => [...prev, newSignal])
        toast.success('Padrão criado com sucesso!')
      }

      setIsDialogOpen(false)
    } catch (error) {
      toast.error('Erro ao salvar padrão')
    }
  }

  const handleDeleteSignal = async (signalId: string) => {
    try {
      setSignals(prev => prev.filter(s => s.id !== signalId))
      toast.success('Padrão excluído com sucesso!')
    } catch (error) {
      toast.error('Erro ao excluir padrão')
    }
  }

  const handleToggleSignal = async (signalId: string, enabled: boolean) => {
    try {
      setSignals(prev => prev.map(s => 
        s.id === signalId ? { ...s, enabled } : s
      ))
      toast.success(`Padrão ${enabled ? 'ativado' : 'desativado'} com sucesso!`)
    } catch (error) {
      toast.error('Erro ao alterar status do padrão')
    }
  }

  const addCondition = () => {
    const newCondition: SignalCondition = {
      id: Date.now().toString(),
      type: 'pattern',
      parameter: '',
      operator: 'equals',
      value: '',
      description: ''
    }
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }))
  }

  const updateCondition = (index: number, field: keyof SignalCondition, value: any) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, [field]: value } : condition
      )
    }))
  }

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }))
  }

  const addAction = () => {
    const newAction: SignalAction = {
      id: Date.now().toString(),
      type: 'notification',
      config: {},
      enabled: true
    }
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }))
  }

  const updateAction = (index: number, field: keyof SignalAction, value: any) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, [field]: value } : action
      )
    }))
  }

  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4" />
      case 'medium': return <Clock className="h-4 w-4" />
      case 'low': return <CheckCircle className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const activeSignals = signals.filter(s => s.enabled)
  const inactiveSignals = signals.filter(s => !s.enabled)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Padrões Personalizados</h1>
            <p className="text-muted-foreground">
              Configure alertas personalizados para detectar padrões específicos nas roletas
            </p>
          </div>
          <Button onClick={handleCreateSignal} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Padrão
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Padrões</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{signals.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeSignals.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inativos</CardTitle>
              <X className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500">{inactiveSignals.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disparos Hoje</CardTitle>
              <Bell className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {signals.reduce((acc, signal) => acc + signal.triggerCount, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active">Padrões Ativos ({activeSignals.length})</TabsTrigger>
            <TabsTrigger value="inactive">Inativos ({inactiveSignals.length})</TabsTrigger>
            <TabsTrigger value="all">Todos ({signals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeSignals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum padrão ativo</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Crie seu primeiro padrão personalizado para começar a receber alertas
                  </p>
                  <Button onClick={handleCreateSignal} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Primeiro Padrão
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activeSignals.map((signal) => (
                  <Card key={signal.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg border ${getPriorityColor(signal.priority)}`}>
                            {getPriorityIcon(signal.priority)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{signal.name}</CardTitle>
                            <CardDescription>{signal.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={signal.enabled ? "default" : "secondary"}>
                            {signal.enabled ? "Ativo" : "Inativo"}
                          </Badge>
                          <Switch
                            checked={signal.enabled}
                            onCheckedChange={(checked) => handleToggleSignal(signal.id, checked)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSignal(signal)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSignal(signal.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="font-semibold mb-2">Condições ({signal.conditions.length})</h4>
                          <div className="space-y-2">
                            {signal.conditions.map((condition, index) => (
                              <div key={condition.id} className="text-sm p-2 bg-muted rounded">
                                {condition.description || `${condition.type}: ${condition.parameter} ${condition.operator} ${condition.value}`}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Ações ({signal.actions.length})</h4>
                          <div className="space-y-2">
                            {signal.actions.map((action, index) => (
                              <div key={action.id} className="text-sm p-2 bg-muted rounded flex items-center gap-2">
                                {actionTypes.find(t => t.value === action.type)?.icon && (
                                  <div className="h-4 w-4">
                                    {React.createElement(actionTypes.find(t => t.value === action.type)!.icon, { className: "h-4 w-4" })}
                                  </div>
                                )}
                                {actionTypes.find(t => t.value === action.type)?.label}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Criado em {new Date(signal.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {signal.triggerCount} disparos • 
                          {signal.lastTriggered && ` Último: ${new Date(signal.lastTriggered).toLocaleDateString('pt-BR')}`}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inactive" className="space-y-4">
            {inactiveSignals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Todos os padrões estão ativos</h3>
                  <p className="text-muted-foreground text-center">
                    Ótimo! Todos os seus padrões personalizados estão funcionando
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {inactiveSignals.map((signal) => (
                  <Card key={signal.id} className="opacity-60">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg border ${getPriorityColor(signal.priority)}`}>
                            {getPriorityIcon(signal.priority)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{signal.name}</CardTitle>
                            <CardDescription>{signal.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Inativo</Badge>
                          <Switch
                            checked={signal.enabled}
                            onCheckedChange={(checked) => handleToggleSignal(signal.id, checked)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSignal(signal)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSignal(signal.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4">
              {signals.map((signal) => (
                <Card key={signal.id} className={!signal.enabled ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${getPriorityColor(signal.priority)}`}>
                          {getPriorityIcon(signal.priority)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{signal.name}</CardTitle>
                          <CardDescription>{signal.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={signal.enabled ? "default" : "secondary"}>
                          {signal.enabled ? "Ativo" : "Inativo"}
                        </Badge>
                        <Switch
                          checked={signal.enabled}
                          onCheckedChange={(checked) => handleToggleSignal(signal.id, checked)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSignal(signal)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSignal(signal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSignal ? 'Editar Padrão' : 'Criar Novo Padrão'}
              </DialogTitle>
              <DialogDescription>
                Configure as condições e ações para seu padrão personalizado
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Padrão</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Padrão Vermelho Consecutivo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o que este padrão detecta..."
                  rows={3}
                />
              </div>

              {/* Conditions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Condições</h3>
                  <Button onClick={addCondition} variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Condição
                  </Button>
                </div>

                {formData.conditions.map((condition, index) => (
                  <Card key={condition.id}>
                    <CardContent className="pt-6">
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select
                            value={condition.type}
                            onValueChange={(value) => updateCondition(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {conditionTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Parâmetro</Label>
                          <Input
                            value={condition.parameter}
                            onChange={(e) => updateCondition(index, 'parameter', e.target.value)}
                            placeholder="Ex: color, number, sector"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Operador</Label>
                          <Select
                            value={condition.operator}
                            onValueChange={(value) => updateCondition(index, 'operator', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {operators.map((op) => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Valor</Label>
                          <div className="flex gap-2">
                            <Input
                              value={condition.value}
                              onChange={(e) => updateCondition(index, 'value', e.target.value)}
                              placeholder="Ex: red, 5, 70"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeCondition(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Label>Descrição da Condição</Label>
                        <Input
                          value={condition.description}
                          onChange={(e) => updateCondition(index, 'description', e.target.value)}
                          placeholder="Descreva esta condição..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {formData.conditions.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Target className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Nenhuma condição adicionada</p>
                      <Button onClick={addCondition} variant="outline" size="sm" className="mt-2 gap-2">
                        <Plus className="h-4 w-4" />
                        Adicionar Primeira Condição
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Ações</h3>
                  <Button onClick={addAction} variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Ação
                  </Button>
                </div>

                {formData.actions.map((action, index) => (
                  <Card key={action.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Select
                            value={action.type}
                            onValueChange={(value) => updateAction(index, 'type', value)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {actionTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <type.icon className="h-4 w-4" />
                                    {type.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Switch
                            checked={action.enabled}
                            onCheckedChange={(checked) => updateAction(index, 'enabled', checked)}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAction(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Action-specific config */}
                      {action.type === 'notification' && (
                        <div className="space-y-2">
                          <Label>Mensagem da Notificação</Label>
                          <Input
                            value={action.config.message || ''}
                            onChange={(e) => updateAction(index, 'config', { ...action.config, message: e.target.value })}
                            placeholder="Mensagem que será exibida na notificação"
                          />
                        </div>
                      )}

                      {action.type === 'email' && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Assunto do Email</Label>
                            <Input
                              value={action.config.subject || ''}
                              onChange={(e) => updateAction(index, 'config', { ...action.config, subject: e.target.value })}
                              placeholder="Assunto do email"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email de Destino</Label>
                            <Input
                              value={action.config.email || ''}
                              onChange={(e) => updateAction(index, 'config', { ...action.config, email: e.target.value })}
                              placeholder="email@exemplo.com"
                              type="email"
                            />
                          </div>
                        </div>
                      )}

                      {action.type === 'sound' && (
                        <div className="space-y-2">
                          <Label>Tipo de Som</Label>
                          <Select
                            value={action.config.soundType || 'alert'}
                            onValueChange={(value) => updateAction(index, 'config', { ...action.config, soundType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="alert">Alerta</SelectItem>
                              <SelectItem value="notification">Notificação</SelectItem>
                              <SelectItem value="success">Sucesso</SelectItem>
                              <SelectItem value="warning">Aviso</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {action.type === 'webhook' && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>URL do Webhook</Label>
                            <Input
                              value={action.config.url || ''}
                              onChange={(e) => updateAction(index, 'config', { ...action.config, url: e.target.value })}
                              placeholder="https://exemplo.com/webhook"
                              type="url"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Método HTTP</Label>
                            <Select
                              value={action.config.method || 'POST'}
                              onValueChange={(value) => updateAction(index, 'config', { ...action.config, method: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="POST">POST</SelectItem>
                                <SelectItem value="PUT">PUT</SelectItem>
                                <SelectItem value="PATCH">PATCH</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {formData.actions.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Nenhuma ação adicionada</p>
                      <Button onClick={addAction} variant="outline" size="sm" className="mt-2 gap-2">
                        <Plus className="h-4 w-4" />
                        Adicionar Primeira Ação
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveSignal} className="gap-2">
                <Save className="h-4 w-4" />
                {editingSignal ? 'Atualizar' : 'Criar'} Padrão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}