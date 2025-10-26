'use client'

import React, { useState, useMemo, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Play, Save, RotateCcw, Layers, Trash2, Puzzle, X } from 'lucide-react'
import { toast } from 'sonner'
import { builderSpec } from '../config/builderSpec'

// Tipos básicos para nós de estratégia
type NodeType = 'trigger' | 'condition' | 'logic' | 'signal'

interface StrategyNode {
  id: string
  type: NodeType
  subtype?: string
  position: { x: number; y: number }
  data: {
    label: string
    conditionType?: string // compatibilidade com código anterior
    config: Record<string, any>
  }
}

interface Connection {
  id: string
  source: string
  target: string
  type: 'success' | 'failure' | 'condition'
}

export default function BuilderPage() {
  const [activeTab, setActiveTab] = useState('strategies')
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)

  const [nodes, setNodes] = useState<StrategyNode[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedNode, setSelectedNode] = useState<StrategyNode | null>(null)
  const [draggedTpl, setDraggedTpl] = useState<{
    type: NodeType
    subtype?: string
    label: string
    defaultConfig?: Record<string, any>
  } | null>(null)

  const canvasRef = useRef<HTMLDivElement | null>(null)

  const conditionTemplates = useMemo(() => (
    builderSpec.builderModal.columns.toolbox.categories
      .flatMap(c => c.nodes)
      .filter(n => n.type === 'condition')
  ), [])

  function createNewStrategy() {
    setNodes([])
    setConnections([])
    setSelectedNode(null)
    setIsBuilderOpen(true)
    toast.success('Rascunho iniciado. Adicione nós para montar sua estratégia.')
  }

  function addNodeFromTemplate(tpl: { type: NodeType; subtype?: string; label: string; defaultConfig?: Record<string, any> }, position: { x: number; y: number }) {
    const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const node: StrategyNode = {
      id,
      type: tpl.type,
      subtype: tpl.subtype,
      position,
      data: {
        label: tpl.label,
        conditionType: tpl.subtype, // compat para condition
        config: { ...(tpl.defaultConfig || {}) }
      }
    }
    setNodes(prev => [...prev, node])
    setSelectedNode(node)
  }

  function updateNode(nodeId: string, updates: Partial<StrategyNode>) {
    setNodes(prev => prev.map(n => (n.id === nodeId ? { ...n, ...updates, data: { ...n.data, ...(updates.data || {}) } } : n)))
    if (selectedNode?.id === nodeId) {
      setSelectedNode(prev => (prev ? { ...prev, ...updates, data: { ...prev.data, ...(updates.data || {}) } } : prev))
    }
  }

  function deleteNode(nodeId: string) {
    setNodes(prev => prev.filter(n => n.id !== nodeId))
    setConnections(prev => prev.filter(c => c.source !== nodeId && c.target !== nodeId))
    if (selectedNode?.id === nodeId) setSelectedNode(null)
  }

  function handleCanvasDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (!draggedTpl || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    addNodeFromTemplate(draggedTpl, pos)
    setDraggedTpl(null)
  }

  function saveStrategy() {
    toast.success('Estratégia salva localmente (mock).')
    setIsBuilderOpen(false)
  }

  function testStrategy() {
    toast.message('Testando estratégia (mock)...')
    setTimeout(() => toast.success('Teste concluído (mock).'), 1500)
  }

  // Renderização dos campos dinâmicos do painel de propriedades
  function renderFields() {
    if (!selectedNode) return null
    const typeKey = selectedNode.type === 'condition'
      ? `condition:${selectedNode.subtype || selectedNode.data.conditionType || ''}`
      : selectedNode.type
    const fields = builderSpec.builderModal.columns.propertiesPanel.fieldsByType[typeKey] || []

    if (fields.length > 0) {
      return fields.map((f) => {
        const val = selectedNode.data.config[f.key ?? '']
        if (f.type === 'select') {
          return (
            <div key={f.key}>
              <Label className="text-xs">{f.label}</Label>
              <Select
                value={String(val ?? '')}
                onValueChange={(v) => updateNode(selectedNode.id, {
                  data: { 
                    ...selectedNode.data,
                    config: { ...(selectedNode.data.config || {}), [f.key!]: v } 
                  }
                })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(f.options || []).map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }
        if (f.type === 'number') {
          return (
            <div key={f.key}>
              <Label className="text-xs">{f.label}</Label>
              <Input
                type="number"
                value={String(val ?? '')}
                onChange={(e) => updateNode(selectedNode.id, {
                  data: { 
                    ...selectedNode.data,
                    config: { ...(selectedNode.data.config || {}), [f.key!]: Number(e.target.value) } 
                  }
                })}
              />
            </div>
          )
        }
        if (f.type === 'slider') {
          return (
            <div key={f.key}>
              <Label className="text-xs">{f.label}</Label>
              <Slider
                min={f.min ?? 0}
                max={f.max ?? 100}
                step={f.step ?? 1}
                value={[Number(val ?? 0)]}
                onValueChange={(arr) => updateNode(selectedNode.id, {
                  data: { 
                    ...selectedNode.data,
                    config: { ...(selectedNode.data.config || {}), [f.key!]: arr[0] } 
                  }
                })}
              />
              <div className="text-xs text-muted-foreground mt-1">{String(val ?? '')}</div>
            </div>
          )
        }
        if (f.type === 'array') {
          return (
            <div key={f.key}>
              <Label className="text-xs">{f.label}</Label>
              <Textarea
                value={Array.isArray(val) ? (val as any[]).join(', ') : String(val ?? '')}
                onChange={(e) => updateNode(selectedNode.id, {
                  data: { 
                    ...selectedNode.data,
                    config: { ...(selectedNode.data.config || {}), [f.key!]: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } 
                  }
                })}
              />
              <div className="text-[10px] text-muted-foreground mt-1">Separe itens por vírgula</div>
            </div>
          )
        }
        return (
          <div key={f.key}>
            <Label className="text-xs">{f.label}</Label>
            <Input
              value={String(val ?? '')}
              onChange={(e) => updateNode(selectedNode.id, {
                data: { 
                  ...selectedNode.data,
                  config: { ...(selectedNode.data.config || {}), [f.key!]: e.target.value } 
                }
              })}
            />
          </div>
        )
      })
    }

    // Fallback: render genérico
    return Object.entries(selectedNode.data.config).map(([key, value]) => (
      <div key={key}>
        <Label className="text-xs">{key}</Label>
        <Input
          value={String(value)}
          onChange={(e) => updateNode(selectedNode.id, {
            data: { 
              ...selectedNode.data,
              config: { ...selectedNode.data.config, [key]: e.target.value } 
            }
          })}
        />
      </div>
    ))
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header via spec */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{(builderSpec.layout.sections.header.elements.find((e: any) => e.type === 'title') as any)?.value ?? 'Builder'}</CardTitle>
              <p className="text-sm text-muted-foreground">{builderSpec.page.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={createNewStrategy}>
                <Puzzle className="mr-2 h-4 w-4" />
                {((builderSpec.layout.sections.header.elements.find((e: any) => e.type === 'button') as any)?.label) ?? 'Nova Estratégia'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                {(((builderSpec.layout.sections.header.elements.find((e: any) => e.type === 'tabs') as any)?.options) ?? ['Estratégias', 'Templates', 'Performance']).map((opt: string) => (
                   <TabsTrigger key={opt.toLowerCase()} value={opt.toLowerCase()}>{opt}</TabsTrigger>
                 ))}
              </TabsList>
              <TabsContent value="estratégias">
                <div className="text-sm text-muted-foreground">Lista de estratégias (mock) — use o botão acima para iniciar uma nova.</div>
              </TabsContent>
              <TabsContent value="templates">
                <div className="text-sm text-muted-foreground">Templates prontos virão aqui.</div>
              </TabsContent>
              <TabsContent value="performance">
                <div className="text-sm text-muted-foreground">Métricas agregadas e top estratégias.</div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Modal do Builder */}
        <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
          <DialogContent className="max-w-6xl">
            <DialogHeader>
              <DialogTitle>{builderSpec.page.title}</DialogTitle>
              <DialogDescription>Monte sua estratégia arrastando componentes, configurando propriedades e salvando quando pronto.</DialogDescription>
            </DialogHeader>
            <div className="flex gap-4">
              {/* Toolbox */}
              <Card className="w-64">
                <CardHeader>
                  <CardTitle className="text-base">{builderSpec.builderModal.columns.toolbox.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[480px] pr-2">
                    <div className="space-y-6">
                      {builderSpec.builderModal.columns.toolbox.categories.map((cat) => (
                        <div key={cat.name}>
                          <div className="text-xs font-medium text-muted-foreground mb-2">{cat.name}</div>
                          <div className="space-y-2">
                            {cat.nodes.map((n) => (
                              <div
                                key={(n.subtype || n.label) + n.type}
                                className="p-2 border rounded-sm cursor-move hover:bg-muted"
                                draggable
                                onDragStart={() => setDraggedTpl({ type: n.type as NodeType, subtype: n.subtype, label: n.label, defaultConfig: n.defaultConfig })}
                                onClick={() => addNodeFromTemplate({ type: n.type as NodeType, subtype: n.subtype, label: n.label, defaultConfig: n.defaultConfig }, { x: 40, y: 40 })}
                              >
                                <div className="text-sm">{n.label}</div>
                                <div className="text-[11px] text-muted-foreground">{n.description}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Canvas */}
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="text-base">Canvas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    ref={canvasRef}
                    className="relative h-[520px] border rounded-sm bg-background"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleCanvasDrop}
                  >
                    {nodes.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Layers className="h-8 w-8" />
                          <div className="text-sm text-center max-w-[360px]">{builderSpec.builderModal.columns.canvas.emptyStateText}</div>
                        </div>
                      </div>
                    ) : (
                      nodes.map((n) => (
                        <div
                          key={n.id}
                          className="absolute p-2 border rounded-sm bg-card shadow-sm"
                          style={{ left: n.position.x, top: n.position.y }}
                          onClick={() => setSelectedNode(n)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium">{n.data.label}</div>
                            <Button size="icon" variant="ghost" onClick={() => deleteNode(n.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-[11px] text-muted-foreground">{n.type}{n.subtype ? `:${n.subtype}` : ''} • {Object.keys(n.data.config || {}).length} configs</div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Propriedades */}
              <Card className="w-80">
                <CardHeader>
                  <CardTitle className="text-base">{builderSpec.builderModal.columns.propertiesPanel.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedNode ? (
                    <div className="text-sm text-muted-foreground">Selecione um nó no canvas para editar suas propriedades.</div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Rótulo</Label>
                        <Input
                          value={selectedNode.data.label}
                          onChange={(e) => updateNode(selectedNode.id, { data: { ...selectedNode.data, label: e.target.value } })}
                        />
                      </div>

                      {selectedNode.type === 'condition' && (
                        <div>
                          <Label className="text-xs">Tipo de condição</Label>
                          <Select
                            value={selectedNode.subtype || selectedNode.data.conditionType || ''}
                            onValueChange={(val) => {
                              const tplNode = conditionTemplates.find(n => String(n.subtype || '') === val)
                              updateNode(selectedNode.id, {
                                 subtype: val,
                                 data: {
                                   ...selectedNode.data,
                                   conditionType: val,
                                   config: tplNode?.defaultConfig ? { ...tplNode.defaultConfig } : { ...selectedNode.data.config }
                                 }
                               })
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {conditionTemplates.map(n => (
                                <SelectItem key={String(n.subtype || n.label)} value={String(n.subtype || '')}>{n.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {renderFields()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <Separator className="my-4" />
            <DialogFooter>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsBuilderOpen(false)}>
                  <X className="mr-2 h-4 w-4" /> Cancelar
                </Button>
                <Button variant="secondary" onClick={testStrategy}>
                  <Play className="mr-2 h-4 w-4" /> Testar Estratégia
                </Button>
                <Button onClick={saveStrategy}>
                  <Save className="mr-2 h-4 w-4" /> Salvar
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
