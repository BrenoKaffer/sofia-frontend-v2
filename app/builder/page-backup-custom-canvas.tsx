'use client'

import React, { useState, useMemo, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Play, Save, RotateCcw, Layers, Trash2, Puzzle, X, MoreVertical } from 'lucide-react'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { builderSpec } from '../config/builderSpec'

type NodeType = 'trigger' | 'condition' | 'logic' | 'signal'

interface StrategyNode {
  id: string
  type: NodeType
  subtype?: string
  position: { x: number; y: number }
  data: {
    label: string
    conditionType?: string
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
  const [activeTab, setActiveTab] = useState('estratégias')
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

  const [strategies, setStrategies] = useState<Array<{ id: string; name: string; description?: string; status: 'active' | 'paused'; nodes: StrategyNode[]; connections: Connection[]; createdAt: number; updatedAt: number }>>([])
  const [currentStrategyId, setCurrentStrategyId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const canvasRef = useRef<HTMLDivElement | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [isTesting, setIsTesting] = useState(false)
  const [isTestReportOpen, setIsTestReportOpen] = useState(false)
  const [testReport, setTestReport] = useState<{ errors: string[]; logs: Array<{ step: number; nodeId: string; label: string; action: string }>; summary: { visited: number; totalNodes: number; totalConnections: number; durationMs: number } }>({
    errors: [],
    logs: [],
    summary: { visited: 0, totalNodes: 0, totalConnections: 0, durationMs: 0 }
  })

  function exportStrategies() {
    const payload = strategies.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      status: s.status,
      graph: {
        nodes: s.nodes.map(n => ({ id: n.id, type: n.type, subtype: n.subtype, data: n.data, position: n.position })),
        connections: s.connections.map(c => ({ id: c.id, source: c.source, target: c.target, type: c.type }))
      },
      meta: { createdAt: s.createdAt, updatedAt: s.updatedAt }
    }))
    const json = JSON.stringify(payload, null, 2)
    if (typeof navigator !== 'undefined' && (navigator as any).clipboard) {
      ;(navigator as any).clipboard.writeText(json)
        .then(() => toast.success('Exportado: JSON copiado para área de transferência'))
        .catch(() => toast.error('Falha ao copiar JSON'))
    } else {
      toast.message('JSON:', { description: json })
    }
  }

  function exportStrategyFile(strategyId: string) {
    const s = strategies.find(st => st.id === strategyId)
    if (!s) return
    const payload = {
      id: s.id,
      name: s.name,
      description: s.description,
      status: s.status,
      graph: {
        nodes: s.nodes.map(n => ({ id: n.id, type: n.type, subtype: n.subtype, data: n.data, position: n.position })),
        connections: s.connections.map(c => ({ id: c.id, source: c.source, target: c.target, type: c.type }))
      },
      meta: { createdAt: s.createdAt, updatedAt: s.updatedAt }
    }
    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const safeName = (s.name || 'estrategia').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const a = document.createElement('a')
    a.href = url
    a.download = `estrategia-${safeName}-${s.id}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('Download iniciado')
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const list = (Array.isArray(parsed) ? parsed : [parsed]).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: (p.status as 'active' | 'paused') ?? 'paused',
        nodes: (p?.graph?.nodes ?? []).map((n: any) => ({ id: n.id, type: n.type as NodeType, subtype: n.subtype, position: n.position, data: n.data })),
        connections: (p?.graph?.connections ?? []).map((c: any) => ({ id: c.id, source: c.source, target: c.target, type: c.type })),
        createdAt: p?.meta?.createdAt ?? Date.now(),
        updatedAt: p?.meta?.updatedAt ?? Date.now()
      }))
      setStrategies(list)
      toast.success('Importado com sucesso')
    } catch (err) {
      toast.error('Falha ao importar JSON')
    } finally {
      e.target.value = ''
    }
  }

  const conditionTemplates = useMemo(() => (
    builderSpec.builderModal.columns.toolbox.categories
      .flatMap(c => c.nodes)
      .filter(n => n.type === 'condition')
  ), [])

  function createNewStrategy() {
    const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    setCurrentStrategyId(id)
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
        conditionType: tpl.subtype,
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
    const id = currentStrategyId || `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const name = nodes[0]?.data.label ? `Estratégia: ${nodes[0].data.label}` : `Estratégia ${strategies.length + 1}`
    const existingIndex = strategies.findIndex(s => s.id === id)
    const record = {
      id,
      name,
      description: 'Criada via Builder',
      status: existingIndex >= 0 ? strategies[existingIndex].status : 'paused',
      nodes: [...nodes],
      connections: [...connections],
      createdAt: existingIndex >= 0 ? strategies[existingIndex].createdAt : Date.now(),
      updatedAt: Date.now()
    }
    setStrategies(prev => existingIndex >= 0 ? prev.map(s => (s.id === id ? record : s)) : [...prev, record])
    setCurrentStrategyId(null)
    setIsBuilderOpen(false)
    toast.success('Estratégia salva.')
  }

  function editStrategy(strategyId: string) {
    const s = strategies.find(st => st.id === strategyId)
    if (!s) return
    setCurrentStrategyId(strategyId)
    setNodes([...s.nodes])
    setConnections([...s.connections])
    setSelectedNode(null)
    setIsBuilderOpen(true)
  }

  function deleteStrategyRecord(strategyId: string) {
    setStrategies(prev => prev.filter(s => s.id !== strategyId))
    if (currentStrategyId === strategyId) setCurrentStrategyId(null)
    toast.success('Estratégia excluída.')
  }

  function toggleStrategyStatus(strategyId: string) {
    setStrategies(prev => prev.map(s => s.id === strategyId ? { ...s, status: s.status === 'active' ? 'paused' : 'active', updatedAt: Date.now() } : s))
  }

  function testStrategy() {
    if (isTesting) return
    setIsTesting(true)
    const start = Date.now()

    function validateGraphLocal(): string[] {
      const errors: string[] = []
      const nodeIds = new Set(nodes.map(n => n.id))
      const triggers = nodes.filter(n => n.type === 'trigger')

      if (nodes.length === 0) errors.push('Nenhum nó no grafo.')
      if (triggers.length === 0) errors.push('Adicione pelo menos um nó de disparo (trigger).')

      connections.forEach(c => {
        if (!nodeIds.has(c.source)) errors.push(`Conexão '${c.id}' tem fonte inexistente: ${c.source}`)
        if (!nodeIds.has(c.target)) errors.push(`Conexão '${c.id}' tem alvo inexistente: ${c.target}`)
        if (!['success', 'failure', 'condition'].includes(c.type)) errors.push(`Conexão '${c.id}' tem tipo inválido: ${c.type}`)
      })

      triggers.forEach(t => {
        const out = connections.filter(c => c.source === t.id)
        if (out.length === 0) errors.push(`Trigger '${t.data.label || t.id}' não possui saída.`)
      })

      nodes.filter(n => n.type !== 'trigger').forEach(n => {
        const incoming = connections.some(c => c.target === n.id)
        if (!incoming) errors.push(`Nó '${n.data.label || n.id}' sem conexão de entrada.`)
      })

      const visited = new Set<string>()
      const queue = [...triggers.map(t => t.id)]
      while (queue.length) {
        const current = queue.shift()!
        if (visited.has(current)) continue
        visited.add(current)
        connections.filter(c => c.source === current).forEach(c => queue.push(c.target))
      }
      const unreachable = nodes.filter(n => !visited.has(n.id))
      if (unreachable.length > 0) {
        const preview = unreachable.slice(0, 3).map(n => n.data.label || n.id).join(', ')
        errors.push(`Há nós não alcançáveis a partir dos triggers (${unreachable.length}): ${preview}${unreachable.length > 3 ? '…' : ''}`)
      }

      return errors
    }

    function dryRunLocal() {
      const logs: Array<{ step: number; nodeId: string; label: string; action: string }> = []
      let step = 1
      const triggers = nodes.filter(n => n.type === 'trigger')
      const maxSteps = Math.max(50, nodes.length * 5)
      const visitedCount = new Set<string>()
      const nextQueue = [...triggers.map(t => t.id)]

      while (nextQueue.length && step <= maxSteps) {
        const nodeId = nextQueue.shift()!
        const node = nodes.find(n => n.id === nodeId)
        if (!node) continue
        visitedCount.add(nodeId)
        logs.push({ step, nodeId, label: node.data.label || nodeId, action: `visit:${node.type}` })
        step++
        const outs = connections.filter(c => c.source === nodeId)
        if (outs.length === 0) continue

        if (node.type === 'condition') {
          const cfg = node.data?.config || {}
          const pass = typeof cfg.threshold === 'number' && typeof cfg.value === 'number'
            ? (cfg.value >= cfg.threshold)
            : (typeof cfg.chance === 'number' ? cfg.chance >= 50 : true)
          const edge = outs.find(c => c.type === (pass ? 'success' : 'failure')) || outs[0]
          if (edge) {
            logs.push({ step, nodeId, label: node.data.label || nodeId, action: `branch:${pass ? 'success' : 'failure'}→${edge.target}` })
            step++
            if (!visitedCount.has(edge.target)) nextQueue.push(edge.target)
          }
        } else {
          const edge = outs[0]
          if (edge) {
            logs.push({ step, nodeId, label: node.data.label || nodeId, action: `next→${edge.target}` })
            step++
            if (!visitedCount.has(edge.target)) nextQueue.push(edge.target)
          }
        }
      }

      return { logs, visited: visitedCount.size }
    }

    const errors = validateGraphLocal()
    if (errors.length > 0) {
      setTestReport({
        errors,
        logs: [],
        summary: { visited: 0, totalNodes: nodes.length, totalConnections: connections.length, durationMs: Date.now() - start }
      })
      setIsTesting(false)
      setIsTestReportOpen(true)
      toast.error('Falhas na validação do grafo.')
      return
    }

    const result = dryRunLocal()
    setTestReport({
      errors: [],
      logs: result.logs,
      summary: { visited: result.visited, totalNodes: nodes.length, totalConnections: connections.length, durationMs: Date.now() - start }
    })
    setIsTesting(false)
    setIsTestReportOpen(true)
    toast.success('Teste concluído.')
  }

  function renderConnections() {
    const canvas = canvasRef.current
    if (!canvas) return null
    const canvasRect = canvas.getBoundingClientRect()
    const lines = connections.map((c) => {
      const srcEl = nodeRefs.current[c.source]
      const tgtEl = nodeRefs.current[c.target]
      if (!srcEl || !tgtEl) return null
      const srcRect = srcEl.getBoundingClientRect()
      const tgtRect = tgtEl.getBoundingClientRect()
      const x1 = (srcRect.left - canvasRect.left) + srcRect.width / 2
      const y1 = (srcRect.top - canvasRect.top) + srcRect.height / 2
      const x2 = (tgtRect.left - canvasRect.left) + tgtRect.width / 2
      const y2 = (tgtRect.top - canvasRect.top) + tgtRect.height / 2
      return { x1, y1, x2, y2, type: c.type, id: c.id }
    }).filter(Boolean) as Array<{ x1:number; y1:number; x2:number; y2:number; type:'success'|'failure'|'condition'; id:string }>

    const color = { success: '#16a34a', failure: '#dc2626', condition: '#3b82f6' }

    return (
      <svg className="absolute inset-0 pointer-events-none">
        <defs>
          <marker id="arrow-success" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color.success}></path>
          </marker>
          <marker id="arrow-failure" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color.failure}></path>
          </marker>
          <marker id="arrow-condition" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color.condition}></path>
          </marker>
        </defs>
        {lines.map((l) => {
          const dx = l.x2 - l.x1
          const dy = l.y2 - l.y1
          const len = Math.hypot(dx, dy)
          const endOffset = 22
          const startOffset = 18
          const ratioEnd = len > 0 ? (len - endOffset) / len : 1
          const ex = l.x1 + dx * ratioEnd
          const ey = l.y1 + dy * ratioEnd
          const sx = l.x1 + (dx / (len || 1)) * startOffset
          const sy = l.y1 + (dy / (len || 1)) * startOffset
          const markerId = l.type === 'success' ? 'arrow-success' : l.type === 'failure' ? 'arrow-failure' : 'arrow-condition'
          return (
            <line
              key={l.id}
              x1={sx}
              y1={sy}
              x2={ex}
              y2={ey}
              stroke={color[l.type]}
              strokeWidth={2}
              markerEnd={`url(#${markerId})`}
            />
          )
        })}
      </svg>
    )
  }

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{(builderSpec.layout.sections.header.elements.find((e: any) => e.type === 'title') as any)?.value ?? 'Builder'}</CardTitle>
              <p className="text-sm text-muted-foreground">{builderSpec.page.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={importInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImportFile}
              />
              {/* Removido export geral para priorizar download individual por estratégia */}
              <Button variant="outline" onClick={() => importInputRef.current?.click()}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Importar JSON
              </Button>
              <Button onClick={createNewStrategy}>
                <Puzzle className="mr-2 h-4 w-4" />
                {(builderSpec.layout.sections.header.elements.find((e: any) => e.type === 'button') as any)?.label ?? 'Nova Estratégia'}
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
                {strategies.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhuma estratégia salva ainda. Clique em "Nova Estratégia".</div>
                ) : (
                  <div className="space-y-2">
                    {strategies.map(s => (
                      <Card key={s.id}>
                        <CardContent className="py-3 flex items-center justify-between">
                          <div>
                            <div className="font-medium">{s.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {s.status === 'active' ? 'Ativa' : 'Pausada'} • {s.nodes.length} nós • atualizado {new Date(s.updatedAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Mais ações">
                                  <MoreVertical className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => editStrategy(s.id)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportStrategyFile(s.id)}>
                                  <Save className="mr-2 h-4 w-4" /> Baixar JSON
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDeleteId(s.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
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

        <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir estratégia?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação é permanente. Confirme para excluir.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (confirmDeleteId) {
                    deleteStrategyRecord(confirmDeleteId)
                    setConfirmDeleteId(null)
                  }
                }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
          <DialogContent className="max-w-6xl">
            <DialogHeader>
              <DialogTitle>{builderSpec.page.title}</DialogTitle>
              <DialogDescription>Monte sua estratégia arrastando componentes, configurando propriedades e salvando quando pronto.</DialogDescription>
            </DialogHeader>
            <div className="flex gap-4">
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
                    {renderConnections()}
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
                          ref={(el) => { nodeRefs.current[n.id] = el }}
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
                <Button variant="secondary" onClick={testStrategy} disabled={isTesting}>
                  <Play className="mr-2 h-4 w-4" /> {isTesting ? 'Testando...' : 'Testar Estratégia'}
                </Button>
                <Button onClick={saveStrategy}>
                  <Save className="mr-2 h-4 w-4" /> Salvar
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isTestReportOpen} onOpenChange={setIsTestReportOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Relatório de Teste</DialogTitle>
              <DialogDescription>Resumo da execução local</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {testReport.errors.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-xs">Erros</Label>
                  <ul className="list-disc pl-4 text-sm">
                    {testReport.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              ) : (
                <>
                  <div className="text-sm grid grid-cols-2 gap-2">
                    <div>Total de nós: {testReport.summary.totalNodes}</div>
                    <div>Conexões: {testReport.summary.totalConnections}</div>
                    <div>Visitados: {testReport.summary.visited}</div>
                    <div>Duração: {Math.round(testReport.summary.durationMs)} ms</div>
                  </div>
                  <Separator />
                  <ScrollArea className="h-48">
                    <ul className="text-sm space-y-1">
                      {testReport.logs.map((l) => (
                        <li key={`${l.step}-${l.nodeId}`}>
                          <code>#{l.step}</code> • <strong>{l.label}</strong> • {l.action}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsTestReportOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}