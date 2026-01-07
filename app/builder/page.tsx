'use client'

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
  import { Play, Save, RotateCcw, Layers, Trash2, Puzzle, X, Info, CheckCircle, XCircle, AlertTriangle, Download, ChevronRight, MoreVertical } from 'lucide-react'
  import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { builderSpec, CURRENT_SCHEMA_VERSION } from '../config/builderSpec'
import ReactFlow, { Background, Controls, MiniMap, MarkerType, Connection as RFConnection, Edge as RFEdge, Node as RFNode } from 'reactflow'
import { parseHistoryInput, evaluateConditionNode, evaluateLogicNode } from '../lib/strategySemantics'
import { compileBuilderToJS } from '../../lib/builder-compiler'
import { useFeatureFlag, FEATURE_FLAGS } from '@/lib/feature-flags'
import { useAuth } from '@/contexts/auth-context'
import { useUserStatus } from '@/hooks/useUserStatus'
import { useUpgrade } from '@/contexts/upgrade-context'

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

// Ajuda contextual para campos genéricos
const FIELD_HELP: Record<string, { label?: string; description: string; example?: string }> = {
  allowedPairs: { label: 'Pares permitidos', description: 'Lista de pares que contam como padrão de espelho.', example: '12,21,13,31,23,32' },
  allowConsecutive: { label: 'Permitir consecutivos', description: 'Aceita pares iguais em sequência sem intervalo.', example: 'true' },
  allowSequence: { label: 'Permitir sequência', description: 'Aceita que os pares formem uma sequência ordenada.', example: 'true' },
  allowAlternating: { label: 'Permitir alternância', description: 'Aceita padrão alternando entre dois pares.', example: 'true' },
  minMultipleCount: { label: 'Múltiplos mínimos', description: 'Quantidade mínima de vezes que o padrão deve aparecer.', example: '2' },
  minStrength: { label: 'Força mínima', description: 'Pontuação mínima para considerar o padrão presente.', example: '3' },
  window: { label: 'Janela', description: 'Quantidade de rodadas analisadas.', example: '5' },
  janela: { label: 'Janela de análise', description: 'Quantidade de rodadas consideradas antes de avaliar a estratégia.', example: '30' },
  operador: { label: 'Operador lógico', description: 'Combina condições: AND (todas), OR (uma), NOT (inverte).', example: 'AND' },
  acao: { label: 'Ação', description: 'O que fazer quando a condição é satisfeita.', example: 'emitir_sinal' },
  mensagem: { label: 'Mensagem', description: 'Texto mostrado quando o sinal é emitido.', example: 'Condição satisfeita' },
  prioridade: { label: 'Prioridade', description: 'Importância do sinal para ordenação/envio.', example: 'alta' },
  numeroAlvo: { label: 'Número alvo', description: 'Aceita valores de 0 a 36. Deixe vazio para considerar qualquer número.', example: '17' },
  modo: { label: 'Modo', description: "Define a regra: 'ocorreu' busca presença no histórico; 'ausente' valida ausência nas últimas N rodadas.", example: 'ocorreu' },
  numero: { label: 'Número', description: 'Escolha de 0 a 36; usado em Número Específico e como alvo quando evento = número.', example: '12' },
  eixo: { label: 'Eixo', description: 'Dimensão de alternância: cor (vermelho/preto) ou paridade (par/ímpar).', example: 'cor' },
  comprimento: { label: 'Comprimento', description: 'Quantidade de rodadas consecutivas que devem alternar sem interrupções.', example: '4' },
  raio: { label: 'Raio', description: 'Distância circular na roda europeia; mede vizinhos em ambos os lados do número base seguindo a ordem do cilindro.', example: '2' },
  numeros: { label: 'Números (lista)', description: 'Lista de números da roleta. Valores fora de 0–36 serão ignorados.', example: '0, 12, 23, 34' },
  sequencia: { label: 'Sequência', description: 'Sequência de números analisada em ordem. Use vírgulas ou espaços; somente 0–36.', example: '5 9 14 21' },
  includeZero: { label: 'Incluir Zero', description: 'Inclui o 0 nas verificações de vizinhos e setor quando habilitado.', example: 'true' },
  frequenciaMinima: { label: 'Frequência mínima', description: 'Limite mínimo para considerar uma tendência, setor ou grupo "quente". Em algumas condições é proporção (0–1); em outras é contagem.', example: '0.7' },
  inicio: { label: 'Início', description: 'Tamanho mínimo do histórico para ativar a condição de janela temporal.', example: '10' },
  fim: { label: 'Fim', description: 'Tamanho máximo do histórico para ativar a condição de janela temporal.', example: '50' },
  setor: { label: 'Setor', description: 'Setor da roleta europeia: Voisins, Tiers ou Orphelins.', example: 'Voisins' }
}

// Rótulos em português para selects, mantendo valores internos originais
const SELECT_LABELS_PT: Record<string, Record<string, string>> = {
  selectionMode: { automatic: 'automático', hybrid: 'híbrido', manual: 'manual' },
  operador: { AND: 'E', OR: 'OU', NOT: 'NÃO' },
  acao: { emitir_sinal: 'emitir sinal' },
  prioridade: { normal: 'normal' }
}

// Mapeamento de cores reais da roleta europeia
const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
const BLACK_NUMBERS = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]
const GREEN_NUMBERS = [0]

function inferConditionSubtype(n: any): string | undefined {
  const t = (n.type || 'condition')
  if (t !== 'condition') return undefined
  const label = String(n?.data?.label || n?.label || '').toLowerCase()
  const cfg = n?.data?.config || n?.config || {}
  if (typeof cfg.numero === 'number' && typeof cfg.modo === 'string') return 'specific-number'
  if (typeof cfg.numero === 'number' && typeof cfg.ocorrencias === 'number') return 'repeat-number'
  if (Array.isArray(cfg.sequencia)) return cfg.modo ? 'pattern' : 'sequence'
  if (label.includes('espelho') || label.includes('mirror') || cfg.allowedPairs) return 'pattern'
  if (label.includes('irmão') || label.includes('siblings')) return 'neighbors'
  if (label.includes('janela')) return 'time-window'
  return undefined
}

function getConditionValidationMessages(n: StrategyNode): string[] {
  if (!n || n.type !== 'condition') return []
  const subtype = String(n.subtype || n.data.conditionType || '').toLowerCase()
  const cfg = n.data?.config || {}
  const msgs: string[] = []
  const isValidNumber = (x: any) => typeof x === 'number' && x >= 0 && x <= 36
  if (subtype.includes('specific-number')) {
    if (!isValidNumber(cfg.numero)) msgs.push('Defina um número válido (0–36).')
  }
  if (subtype.includes('repeat-number')) {
    if (!isValidNumber(cfg.numero)) msgs.push('Número base ausente (0–36).')
    if (typeof cfg.ocorrencias !== 'number' || cfg.ocorrencias <= 0) msgs.push('Informe ocorrências (>0).')
  }
  if (subtype.includes('neighbors')) {
    if (!isValidNumber(cfg.numero)) msgs.push('Número base inválido (0–36).')
    if (typeof cfg.raio !== 'number' || cfg.raio <= 0) msgs.push('Raio deve ser >= 1.')
  }
  if (subtype.includes('pattern')) {
    const hasPairs = Array.isArray(cfg.allowedPairs) ? cfg.allowedPairs.length > 0 : !!cfg.allowedPairs
    const hasSeq = Array.isArray(cfg.sequencia) ? cfg.sequencia.length > 1 : false
    if (!hasPairs && !hasSeq) msgs.push('Defina pares ou uma sequência para o padrão.')
  }
  if (subtype.includes('sequence')) {
    if (!Array.isArray(cfg.sequencia) || cfg.sequencia.length < 2) msgs.push('Sequência deve ter ao menos 2 elementos.')
  }
  if (subtype.includes('window')) {
    const w = cfg.janela ?? cfg.window
    if (typeof w !== 'number' || w <= 0) msgs.push('Janela deve ser um número > 0.')
  }
  return msgs
}

export default function BuilderPage() {
  const isMvpMode = useFeatureFlag(FEATURE_FLAGS.MVP_MODE)
  if (isMvpMode) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Builder de Estratégias – Em breve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para o MVP, o foco está em autenticação, checkout e dashboard. O builder completo será liberado após o lançamento inicial.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <a href="/dashboard">Ir para Dashboard</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/strategies">Ver Estratégias</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  const { user } = useAuth()
  const { userProfile, loading } = useUserStatus(user?.id)
  const { openUpgradeModal } = useUpgrade()

  useEffect(() => {
    if (!loading && userProfile) {
      // Check new fields
      const isPro = 
        (userProfile.plan === 'pro') || 
        (userProfile.role === 'admin' || userProfile.role === 'superadmin')
        
      if (!isPro) {
        openUpgradeModal('Builder de Estratégias')
      }
    }
  }, [loading, userProfile, openUpgradeModal])

  const [activeTab, setActiveTab] = useState('estratégias')
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [draftStrategyName, setDraftStrategyName] = useState('')


  const [nodes, setNodes] = useState<StrategyNode[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedNode, setSelectedNode] = useState<StrategyNode | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [draggedTpl, setDraggedTpl] = useState<{
    type: NodeType
    subtype?: string
    label: string
    defaultConfig?: Record<string, any>
  } | null>(null)

  const [strategies, setStrategies] = useState<Array<{ id: string; name: string; description?: string; status: 'active' | 'paused'; nodes: StrategyNode[]; connections: Connection[]; createdAt: number; updatedAt: number; selectionMode?: 'automatic' | 'hybrid' | 'manual'; gating?: { enabled: boolean } }>>([])
  const [currentStrategyId, setCurrentStrategyId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<any[]>([])
   const [templateQuery, setTemplateQuery] = useState('')

  const canvasRef = useRef<HTMLDivElement | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const builderRef = useRef<HTMLDivElement | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [isTestReportOpen, setIsTestReportOpen] = useState(false)
const [testReport, setTestReport] = useState<{ errors: string[]; logs: Array<{ step: number; nodeId: string; label: string; action: string }>; results: Array<{ nodeId: string; label: string; type: NodeType; subtype?: string; pass?: boolean }>; signals: Array<{ nodeId: string; label: string; acao: string; mensagem?: string; prioridade?: string }>; summary: { visited: number; totalNodes: number; totalConnections: number; durationMs: number; source?: string; sampleSize?: number; effectiveWindow?: number }; resolver?: { mode: string; derivedNumbers: number[]; telemetry: any; gated?: boolean; gateReasons?: string[] }; compiled?: { activation: any; signal: any } }>({
    errors: [],
    logs: [],
    results: [],
    signals: [],
    summary: { visited: 0, totalNodes: 0, totalConnections: 0, durationMs: 0 }
  })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [simulatedHistoryInput, setSimulatedHistoryInput] = useState('')
  const [serverToken, setServerToken] = useState('')
  const [validationSignalId, setValidationSignalId] = useState<string>('')
  const [validationResult, setValidationResult] = useState<'hit' | 'miss'>('miss')
  const [validationWinningNumber, setValidationWinningNumber] = useState<number | ''>('')
  const [validationNetPayout, setValidationNetPayout] = useState<number | ''>('')
  const [serverValidationResponse, setServerValidationResponse] = useState<any>(null)
  const [isValidatingServer, setIsValidatingServer] = useState(false)
  const [selectionMode, setSelectionMode] = useState<'automatic' | 'hybrid' | 'manual'>('automatic')
  const [gatingEnabled, setGatingEnabled] = useState<boolean>(false)
  const [historySource, setHistorySource] = useState<'manual' | 'real'>('manual')
  // Estado de saúde do backend
  const [backendHealth, setBackendHealth] = useState<{ status: 'healthy' | 'degraded' | 'unhealthy'; metrics?: { responseTime?: number }; services?: any } | null>(null)
  const [isHealthLoading, setIsHealthLoading] = useState<boolean>(false)
  const [realHistoryLimit, setRealHistoryLimit] = useState<number>(60)

  // Carregar preferências do Builder na inicialização
  useEffect(() => {
    try {
      const saved = localStorage.getItem('builder-preferences')
      if (saved) {
        const prefs = JSON.parse(saved)
        if (prefs && typeof prefs === 'object') {
          if (['automatic', 'hybrid', 'manual'].includes(prefs.selectionMode)) {
            setSelectionMode(prefs.selectionMode)
          }
          if (typeof prefs.gatingEnabled === 'boolean') {
            setGatingEnabled(prefs.gatingEnabled)
          }
          if (typeof prefs.realHistoryLimit === 'number') {
            setRealHistoryLimit(Math.max(1, Math.min(500, prefs.realHistoryLimit)))
          }
          if (prefs.historySource === 'manual' || prefs.historySource === 'real') {
            setHistorySource(prefs.historySource)
          }
        }
      }
    } catch {}
  }, [])

  // Persistir preferências do Builder ao alterar
  useEffect(() => {
    try {
      const prefs = {
        selectionMode,
        gatingEnabled,
        realHistoryLimit,
        historySource,
      }
      localStorage.setItem('builder-preferences', JSON.stringify(prefs))
    } catch {}
  }, [selectionMode, gatingEnabled, realHistoryLimit, historySource])

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // Carrega estratÃ©gias do servidor ao iniciar
  useEffect(() => {
    refreshStrategies()
  }, [])

  // Busca saúde do backend ao abrir o Builder e atualiza a cada 60s
  useEffect(() => {
    let intervalId: any = null
    if (isBuilderOpen) {
      refreshBackendHealth()
      intervalId = setInterval(refreshBackendHealth, 60000)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isBuilderOpen])

  async function refreshBackendHealth() {
    try {
      setIsHealthLoading(true)
      const resp = await fetch('/api/system/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })
      const data = await resp.json().catch(() => ({}))
      if (resp.ok) {
        setBackendHealth({ status: data.status || 'healthy', metrics: data.metrics, services: data.services })
      } else {
        setBackendHealth({ status: 'unhealthy' })
      }
    } catch (e) {
      setBackendHealth({ status: 'unhealthy' })
    } finally {
      setIsHealthLoading(false)
    }
  }

  // Revalidate automático: foco/visibilidade/online/intervalo
  useEffect(() => {
    let lastCall = 0
    const minIntervalMs = 15000
    const safeRefresh = () => {
      const now = Date.now()
      if (now - lastCall < minIntervalMs) return
      lastCall = now
      refreshStrategies()
    }

    const onFocus = () => safeRefresh()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') safeRefresh()
    }
    const onOnline = () => safeRefresh()

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onOnline)

    const intervalId = setInterval(safeRefresh, 120000)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onOnline)
      clearInterval(intervalId)
    }
  }, [])

  // Atalho para excluir nÃ³ ou conexÃ£o selecionada
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode) {
          deleteNode(selectedNode.id)
        } else if (selectedEdgeId) {
          setConnections(prev => prev.filter(c => c.id !== selectedEdgeId))
          setSelectedEdgeId(null)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedNode, selectedEdgeId])

  async function refreshStrategies() {
    try {
      const resp = await fetch('/api/strategies')
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        toast.message('Falha ao carregar do servidor.', { description: String((data as any)?.error || resp.statusText) })
        return
      }
      const data = await resp.json()
      const rawList = Array.isArray(data) ? data : (data?.strategies || [])
      // Garanta que cada estratégia tenha arrays válidos para evitar crashes no render
      const list = rawList.map((s: any) => ({
        ...s,
        nodes: Array.isArray(s?.nodes) ? s.nodes : (Array.isArray(s?.graph?.nodes) ? s.graph.nodes : []),
        connections: Array.isArray(s?.connections) ? s.connections : (Array.isArray(s?.graph?.connections) ? s.graph.connections : [])
      }))
      setStrategies(list)
      toast.success('Estratégias carregadas do servidor.')
    } catch (e: any) {
      toast.message('Erro de rede ao carregar estratégias.', { description: e?.message || String(e) })
    }
  }

  async function refreshTemplates() {
    try {
      const resp = await fetch('/api/templates/strategies')
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        toast.message('Falha ao carregar templates.', { description: String((data as any)?.error || resp.statusText) })
        return
      }
      const data = await resp.json()
      const list = Array.isArray(data?.templates) ? data.templates : []
      setTemplates(list)
      toast.success('Templates carregados.')
    } catch (e: any) {
      toast.message('Erro de rede ao carregar templates.', { description: e?.message || String(e) })
    }
  }

  useEffect(() => {
    refreshTemplates()
  }, [])

  const toggleFullscreen = useCallback(() => {
    const el = builderRef.current || canvasRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => { })
    } else {
      document.exitFullscreen?.()
    }
  }, [])

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
      ; (navigator as any).clipboard.writeText(json)
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
      const list = (Array.isArray(parsed) ? parsed : [parsed]).map((p: any) => {
        const rawNodes = ((p?.graph?.nodes ?? p?.nodes) ?? [])
        const rawConns = ((p?.graph?.connections ?? p?.connections ?? p?.edges) ?? [])
        const nodes = rawNodes.map((n: any, idx: number) => {
          const type: NodeType = (n.type as NodeType) || 'condition'
          const computedSubtype = n.subtype || inferConditionSubtype(n)
          const position = n.position || { x: 40 + (idx % 4) * 160, y: 40 + Math.floor(idx / 4) * 120 }
          const baseData = n.data ? { ...n.data } : { label: n.label || `${type || 'nó'} ${idx + 1}`, config: n.config || {} }
          if (type === 'condition' && !baseData.conditionType) {
            ;(baseData as any).conditionType = computedSubtype
          }
          return {
            id: n.id || `n_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
            type,
            subtype: computedSubtype,
            position,
            data: baseData
          }
        })
        const connections = rawConns.map((c: any, idx: number) => ({
          id: c.id || `e_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
          source: c.source,
          target: c.target,
          type: (c.type as 'success' | 'failure' | 'condition') || 'success'
        }))
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          status: (p.status as 'active' | 'paused') ?? 'paused',
          nodes,
          connections,
          createdAt: p?.meta?.createdAt ?? Date.now(),
          updatedAt: p?.meta?.updatedAt ?? Date.now(),
          selectionMode: (p?.selectionMode as 'automatic' | 'hybrid' | 'manual') ?? undefined,
          gating: (p?.gating && typeof p.gating === 'object') ? p.gating : undefined,
        }
      })
      setStrategies(list)
      // Abrir automaticamente a primeira estratÃ©gia importada no canvas
      if (list.length > 0) {
        const first = list[0]
        setCurrentStrategyId(first.id)
        setNodes(normalizeNodes(first.nodes))
        setConnections([...first.connections])
        setSelectedNode(null)
        setIsBuilderOpen(true)
      }
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
    setDraftStrategyName('')
    setIsBuilderOpen(true)
    toast.success('Rascunho iniciado. Adicione nós para montar sua estratégia.')
  }

  function duplicateTemplate(tpl: any) {
     const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
     setCurrentStrategyId(id)
     const positionedNodes = Array.isArray(tpl.nodes) ? tpl.nodes.map((n: any, idx: number) => ({
       ...n,
       id: n.id || `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
       position: n.position || { x: 120 + idx * 160, y: 120 },
       data: { ...(n.data || {}), label: n.data?.label || n.type }
     })) : []
     const conns = Array.isArray(tpl.connections) ? tpl.connections.map((c: any, i: number) => ({
       id: c.id || `c_${Date.now()}_${i}`,
       source: c.source,
       target: c.target,
       type: c.type || 'condition'
     })) : []
     setNodes(positionedNodes)
     setConnections(conns)
     setSelectedNode(null)
     setDraftStrategyName(`${tpl.name || 'Template'} (cópia)`) 
     setIsBuilderOpen(true)
     toast.success('Cópia criada. Edite e salve sua estratégia.')
   }

   // Normaliza nós carregados do servidor/arquivo para garantir posição e label
   function normalizeNodes(arr: any[]): StrategyNode[] {
     const GRID_X = 160
     const GRID_Y = 120
     return (Array.isArray(arr) ? arr : []).map((n: any, idx: number) => {
       const hasPos = n && n.position && Number.isFinite(n.position.x) && Number.isFinite(n.position.y)
       const fallbackPos = { x: 120 + (idx % 5) * GRID_X, y: 120 + Math.floor(idx / 5) * GRID_Y }
       return {
         id: String(n?.id || `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
         type: (n?.type as NodeType) || 'condition',
         subtype: n?.subtype,
         position: hasPos ? n.position : fallbackPos,
         data: { ...(n?.data || {}), label: n?.data?.label || n?.type || 'Nó' }
       }
     })
   }

   async function duplicateAndSaveTemplate(tpl: any) {
     const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
     const positionedNodes = Array.isArray(tpl.nodes) ? tpl.nodes.map((n: any, idx: number) => ({
       ...n,
       id: n.id || `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
       position: n.position || { x: 120 + idx * 160, y: 120 },
       data: { ...(n.data || {}), label: n.data?.label || n.type }
     })) : []
     const conns = Array.isArray(tpl.connections) ? tpl.connections.map((c: any, i: number) => ({
       id: c.id || `c_${Date.now()}_${i}`,
       source: c.source,
       target: c.target,
       type: c.type || 'condition'
     })) : []
     const record = {
       id,
       name: `${tpl.name || 'Template'} (cópia)`,
       description: tpl.description || '',
       status: 'active',
       nodes: positionedNodes,
       connections: conns,
       createdAt: Date.now(),
       updatedAt: Date.now(),
       source: 'builder',
       template_key: tpl.template_key || tpl.name || undefined
     }
     try {
       const resp = await fetch('/api/strategies', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(record)
       })
       if (!resp.ok) {
         const data = await resp.json().catch(() => ({}))
         toast.message('Falha ao salvar cópia.', { description: String((data as any)?.error || resp.statusText) })
         return
       }
       toast.success('Cópia salva com sucesso.')

       // Registrar no StrategyEngine (compatibilidade)
       try {
         const regResp = await fetch('/api/automation/strategy/register', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             strategy_id: id,
             rules: { nodes: positionedNodes, connections: conns },
             status: record.status,
             source: 'Builder/Templates'
           })
         })
         const regData = await regResp.json().catch(() => ({}))
         if (!regResp.ok || regData.success === false) {
           toast.message('Cópia salva, mas falha ao registrar no Engine.', { description: String((regData as any)?.error || regResp.statusText) })
         } else {
           toast.success('Estratégia registrada no Engine.')
         }
       } catch (err: any) {
         toast.message('Cópia salva, mas erro ao registrar no Engine.', { description: err?.message || String(err) })
       }

       await refreshStrategies()
     } catch (e: any) {
       toast.message('Erro de rede ao salvar cópia.', { description: e?.message || String(e) })
     }
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

  async function saveStrategy() {
    const id = currentStrategyId || `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const preferredName = (draftStrategyName || '').trim()
    const name = preferredName ? preferredName : (nodes[0]?.data.label ? `Estratégia: ${nodes[0].data.label}` : `Estratégia ${strategies.length + 1}`)
    
    // ValidaÃ§Ã£o: schemaVersion Ã© obrigatÃ³rio
    if (!CURRENT_SCHEMA_VERSION) {
      toast.message('Erro interno: versão do schema não definida.', { description: 'Contate o suporte técnico.' })
      return
    }
    
    // ValidaÃ§Ã£o: aÃ§Ã£o 'apostar' com seleÃ§Ã£o manual exige pelo menos um nÃºmero
    const invalidSignal = nodes.find(n => (
      n.type === 'signal' &&
      String((n.data?.config?.acao || '')).toLowerCase() === 'apostar' &&
      String((n.data?.config?.selectionMode || '')).toLowerCase() === 'manual' &&
      (!Array.isArray(n.data?.config?.numeros) || (n.data?.config?.numeros || []).length === 0)
    ))
    if (invalidSignal) {
      toast.message('Seleção de números obrigatória para ação "apostar".', { description: 'Defina pelo menos um número (0–36) quando o modo é manual.' })
      return
    }

    // Guardrails: validar números (0–36) e duplicatas na seleção manual
    const badSignalNums = nodes.find(n => {
      if (n.type !== 'signal') return false
      const acao = String((n.data?.config?.acao || '')).toLowerCase()
      const mode = String((n.data?.config?.selectionMode || '')).toLowerCase()
      const arr = Array.isArray(n.data?.config?.numeros) ? n.data.config.numeros : []
      if (acao !== 'apostar' || mode !== 'manual') return false
      const outOfRange = arr.some(x => !Number.isFinite(x) || x < 0 || x > 36)
      const hasDup = new Set(arr).size !== arr.length
      return outOfRange || hasDup
    })
    if (badSignalNums) {
      toast.message('Números inválidos na seleção.', { description: 'Use apenas 0–36 e evite duplicados.' })
      return
    }

    // Guardrail: stake deve ser > 0
    const badStake = nodes.find(n => (n.type === 'signal' && !(Number(n.data?.config?.stake) > 0)))
    if (badStake) {
      toast.message('Stake inválida.', { description: 'Informe um valor de stake maior que 0.' })
      return
    }

    // Guardrail: protecaoLimite deve ser inteiro >= 0
    const badProtecao = nodes.find(n => {
      if (n.type !== 'signal') return false
      const lim = Number(n.data?.config?.protecaoLimite)
      return Number.isNaN(lim) || lim < 0 || !Number.isInteger(lim)
    })
    if (badProtecao) {
      toast.message('Limite de proteção inválido.', { description: 'Use um inteiro maior ou igual a 0.' })
      return
    }

    // Guardrail: ausência com evento = número requer alvo 0–36
    const badAbsenceNumero = nodes.find(n => {
      const subtype = String(n.subtype || n.data?.conditionType || '').toLowerCase()
      if (n.type !== 'condition' || subtype !== 'absence') return false
      const ev = String(n.data?.config?.evento || '').toLowerCase()
      if (ev !== 'numero') return false
      const alvo = Number(n.data?.config?.numeroAlvo ?? n.data?.config?.numero)
      return !Number.isFinite(alvo) || alvo < 0 || alvo > 36
    })
    if (badAbsenceNumero) {
      toast.message('Número alvo inválido para ausência.', { description: 'Quando evento = número, defina um alvo entre 0 e 36.' })
      return
    }

    const existingIndex = strategies.findIndex(s => s.id === id)
    const record = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      id,
      name,
      description: 'Criada via Builder',
      status: existingIndex >= 0 ? strategies[existingIndex].status : 'paused',
      nodes: [...nodes],
      connections: [...connections],
      createdAt: existingIndex >= 0 ? strategies[existingIndex].createdAt : Date.now(),
      updatedAt: Date.now(),
      selectionMode,
      gating: { enabled: !!gatingEnabled },
    }
    setStrategies(prev => existingIndex >= 0 ? prev.map(s => (s.id === id ? record : s)) : [...prev, record])
    setCurrentStrategyId(null)
    setIsBuilderOpen(false)
    setDraftStrategyName('')
    try {
      const resp = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      })
      if (resp.ok) {
        toast.success('Estratégia salva (local + servidor).')
        // Emitir evento local para atualizaÃ§Ã£o em tempo real
        try {
          const bc = new BroadcastChannel('strategies')
          bc.postMessage({ type: 'strategy_saved', strategy: record })
          bc.close()
        } catch (_) {
          // Sem suporte a BroadcastChannel, segue sem realtime
        }
        // Registrar no StrategyEngine
        try {
          const reg = await fetch('/api/automation/strategy/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              strategy_id: record.id,
              rules: { nodes: record.nodes, connections: record.connections },
              status: record.status,
              source: 'builder'
            })
          })
          if (reg.ok) {
            toast.success('Registrada no StrategyEngine.')
          } else {
            const data = await reg.json().catch(() => ({}))
            toast.message('Registrada parcialmente. Falha no StrategyEngine.', { description: String((data as any)?.error || reg.statusText) })
          }
        } catch (e: any) {
          toast.message('Registrada parcialmente. Erro de rede no StrategyEngine.', { description: e?.message || String(e) })
        }
        // Publicar no backend (dinÃ¢micas)
        try {
          const pub = await fetch('/api/dynamic-strategies/upload-from-builder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: record.name,
              description: record.description || 'Estratégia criada via Builder',
              nodes: record.nodes,
              connections: record.connections
            })
          })
          const pubData = await pub.json().catch(() => ({}))
          if (pub.ok && (pubData as any)?.success) {
            toast.success('Publicada no backend.')
          } else {
            toast.message('Registrada. Falha ao publicar no backend.', { description: String((pubData as any)?.error || pub.statusText) })
          }
        } catch (e: any) {
          toast.message('Registrada. Erro de rede ao publicar no backend.', { description: e?.message || String(e) })
        }
      } else {
        const data = await resp.json().catch(() => ({}))
        toast.message('Salvo localmente. Falha no servidor.', { description: String((data as any)?.error || resp.statusText) })
      }
    } catch (e: any) {
      toast.message('Salvo localmente. Erro de rede ao salvar no servidor.', { description: e?.message || String(e) })
    }
  }

  function editStrategy(strategyId: string) {
    const s = strategies.find(st => st.id === strategyId)
    if (!s) return
    setCurrentStrategyId(strategyId)
    setNodes(normalizeNodes(s.nodes))
    setConnections(Array.isArray(s.connections) ? [...s.connections] : [])
    setSelectedNode(null)
    setDraftStrategyName(s.name || '')
    setSelectionMode((s.selectionMode as 'automatic' | 'hybrid' | 'manual') || 'automatic')
    setGatingEnabled(Boolean(s.gating?.enabled))
    setIsBuilderOpen(true)
  }

  async function toggleStrategyStatus(strategyId: string) {
    const s = strategies.find(st => st.id === strategyId)
    if (!s) return
    const newStatus = s.status === 'active' ? 'paused' : 'active'
    // Atualiza UI de forma otimista
    setStrategies(prev => prev.map(x => x.id === strategyId ? { ...x, status: newStatus, updatedAt: Date.now() } : x))
    try {
      const resp = await fetch(`/api/strategies/${strategyId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: s.name,
            description: s.description,
            status: newStatus,
            nodes: s.nodes,
            connections: s.connections,
            selectionMode: s.selectionMode,
            gating: s.gating,
          })
        }
      )
      const data = await resp.json().catch(() => ({}))
      if (resp.ok && (data as any)?.strategy) {
        const server = (data as any).strategy
        setStrategies(prev => prev.map(x => x.id === strategyId ? server : x))
        toast.success(newStatus === 'active' ? 'Estratégia ativada.' : 'Estratégia pausada.')
      } else {
        toast.message('Falha ao atualizar status no servidor.', { description: String((data as any)?.error || resp.statusText) })
      }
    } catch (e: any) {
      toast.message('Erro de rede ao alterar status.', { description: e?.message || String(e) })
    }
  }

  async function deleteStrategyRecord(strategyId: string) {
    try {
      const resp = await fetch(`/api/strategies/${strategyId}`, { method: 'DELETE' })
      const data = await resp.json().catch(() => ({}))
      if (resp.ok && (data as any)?.ok) {
        setStrategies(prev => prev.filter(s => s.id !== strategyId))
        if (currentStrategyId === strategyId) setCurrentStrategyId(null)
        toast.success('Estratégia excluída do servidor.')
      } else {
        toast.message('Falha ao excluir no servidor.', { description: String((data as any)?.error || resp.statusText) })
      }
    } catch (e: any) {
      toast.message('Erro de rede ao excluir estratégia.', { description: e?.message || String(e) })
    }
  }

  async function publishStrategy(strategyId: string) {
    const s = strategies.find(st => st.id === strategyId)
    if (!s) {
      toast.message('Estratégia não encontrada para publicar.')
      return
    }
    try {
      const resp = await fetch('/api/dynamic-strategies/upload-from-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: s.name,
          description: s.description || 'Estratégia criada via Builder',
          nodes: s.nodes,
          connections: s.connections
        })
      })
      const data = await resp.json().catch(() => ({}))
      if (resp.ok && (data as any)?.success) {
        toast.success('Estratégia publicada para o backend.')
      } else {
        toast.message('Falha ao publicar estratégia.', { description: String((data as any)?.error || resp.statusText) })
      }
    } catch (e: any) {
      toast.message('Erro de rede ao publicar estratégia.', { description: e?.message || String(e) })
    }
  }

  function loadCompiled(js: string) {
    const transformed = js.replace(/export\s*\{\s*METADATA,\s*checkStrategy,\s*generateSignal\s*\}/, 'return { METADATA, checkStrategy, generateSignal }')
    // eslint-disable-next-line no-new-func
    const factory = new Function(transformed)
    return factory()
  }

  function testStrategy() {
    if (isTesting) return
    setIsTesting(true)
    const start = Date.now()
    const hist = parseHistoryInput(simulatedHistoryInput)
    const effectiveWindow = (() => {
      let eff = 0
      for (const n of nodes) {
        if (n.type !== 'condition') continue
        const cfg: Record<string, any> = (n.data?.config || {})
        const subtype = String(n.subtype || n.data.conditionType || '').toLowerCase()
        const janela = Number(cfg.janela ?? cfg.window ?? 0)
        const comprimento = Number(cfg.comprimento ?? 0)
        const raio = Number(cfg.raio ?? 0)
        if (subtype === 'absence' || subtype === 'setordominante' || subtype === 'dozen_hot' || subtype === 'column_hot' || subtype === 'sector') {
          eff = Math.max(eff, janela)
        }
        if (subtype === 'alternation' || subtype === 'sequence_custom') {
          eff = Math.max(eff, comprimento)
        }
        if (subtype === 'neighbors' || subtype === 'mirror') {
          eff = Math.max(eff, Math.max(raio * 2, 12))
        }
        eff = Math.max(eff, janela, comprimento)
      }
      return eff || 0
    })()

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
      const nodeResult: Record<string, boolean> = {}
      const history = parseHistoryInput(simulatedHistoryInput)
      const results: Array<{ nodeId: string; label: string; type: NodeType; subtype?: string; pass?: boolean }> = []
      const signals: Array<{ nodeId: string; label: string; acao: string; mensagem?: string; prioridade?: string }> = []

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
          const pass = evaluateConditionNode(node, history)
          nodeResult[nodeId] = pass
          results.push({ nodeId, label: node.data.label || nodeId, type: node.type, subtype: node.subtype || node.data.conditionType, pass })
          const edge = outs.find(c => c.type === (pass ? 'success' : 'failure')) || outs[0]
          if (edge) {
            logs.push({ step, nodeId, label: node.data.label || nodeId, action: `branch:${pass ? 'success' : 'failure'}&rarr;${edge.target}` })
            step++
            if (!visitedCount.has(edge.target)) nextQueue.push(edge.target)
          }
        } else if (node.type === 'logic') {
          const pass = evaluateLogicNode(node, connections, nodeResult)
          nodeResult[nodeId] = pass
          results.push({ nodeId, label: node.data.label || nodeId, type: node.type, subtype: node.subtype || node.data.conditionType, pass })
          const edge = outs.find(c => c.type === (pass ? 'success' : 'failure')) || outs[0]
          if (edge) {
            logs.push({ step, nodeId, label: node.data.label || nodeId, action: `logic:${pass ? 'success' : 'failure'}&rarr;${edge.target}` })
            step++
            if (!visitedCount.has(edge.target)) nextQueue.push(edge.target)
          }
        } else if (node.type === 'signal') {
          results.push({ nodeId, label: node.data.label || nodeId, type: node.type, subtype: node.subtype || node.data.conditionType })
          const cfg = (node.data?.config || {})
          const payload = { nodeId, label: node.data.label || nodeId, acao: String(cfg.acao || 'emitir_sinal'), mensagem: cfg.mensagem, prioridade: cfg.prioridade }
          signals.push(payload)
          logs.push({ step, nodeId, label: node.data.label || nodeId, action: `signal:${payload.acao}:${payload.prioridade || 'normal'}` })
          step++
          const edge = outs[0]
          if (edge) {
            logs.push({ step, nodeId, label: node.data.label || nodeId, action: `next&rarr;${edge.target}` })
            step++
            if (!visitedCount.has(edge.target)) nextQueue.push(edge.target)
          }
        } else {
          results.push({ nodeId, label: node.data.label || nodeId, type: node.type, subtype: node.subtype || node.data.conditionType })
          const edge = outs[0]
          if (edge) {
            logs.push({ step, nodeId, label: node.data.label || nodeId, action: `next&rarr;${edge.target}` })
            step++
            if (!visitedCount.has(edge.target)) nextQueue.push(edge.target)
          }
        }
      }

      return { logs, visited: visitedCount.size, results, signals }
    }

    const errors = validateGraphLocal()
    if (errors.length > 0) {
      setTestReport({
        errors,
        logs: [],
        results: [],
        signals: [],
        summary: { visited: 0, totalNodes: nodes.length, totalConnections: connections.length, durationMs: Date.now() - start, source: historySource, sampleSize: Array.isArray(hist) ? hist.length : 0, effectiveWindow }
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
      results: result.results,
      signals: result.signals,
      summary: { visited: result.visited, totalNodes: nodes.length, totalConnections: connections.length, durationMs: Date.now() - start, source: historySource, sampleSize: Array.isArray(hist) ? hist.length : 0, effectiveWindow }
    })
    // Executar compilador JS e avaliar checkStrategy/generateSignal
    try {
      const preferredName = (draftStrategyName || '').trim()
      const payload = {
        name: preferredName || (nodes[0]?.data?.label ? `Estratégia: ${nodes[0].data.label}` : 'Estratégia Teste'),
        selectionMode: selectionMode,
        nodes,
        connections,
        min_spins: 1,
        gating: gatingEnabled ? { enabled: true } : {}
      }
      const js = compileBuilderToJS(payload)
      const mod = loadCompiled(js)
      const activation = mod.checkStrategy(hist, { selectionMode, gating: gatingEnabled ? { enabled: true } : {} })
      const signal = mod.generateSignal(hist, { selectionMode, gating: gatingEnabled ? { enabled: true } : {} })
      setTestReport(prev => ({ ...prev, compiled: { activation, signal } }))
    } catch (e) {
      console.warn('Falha ao compilar/avaliar estratégia no cliente:', e)
    }
    setIsTesting(false)
    setIsTestReportOpen(true)
    toast.success('Teste concluído.')
    // Derivação automática/híbrida (assíncrona)
    fetch('/api/action-resolver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodes,
        connections,
        historyInput: simulatedHistoryInput,
        selectionMode,
        gating: gatingEnabled ? { enabled: true } : {}
      })
    }).then(async (resp) => {
      try {
        const data = await resp.json().catch(() => ({}))
        if (resp.ok && (data as any)?.success) {
          const resolverData = {
            mode: String((data as any).mode || ''),
            derivedNumbers: Array.isArray((data as any).derivedNumbers) ? (data as any).derivedNumbers : [],
            telemetry: (data as any).telemetry,
            gated: Boolean((data as any).gated ?? (data as any)?.telemetry?.gatingApplied?.gated ?? false),
            gateReasons: Array.isArray((data as any).gateReasons) ? (data as any).gateReasons : ((data as any)?.telemetry?.gatingApplied?.reasons || []),
          }
          setTestReport(prev => ({ ...prev, resolver: resolverData }))
        }
      } catch {}
    }).catch(() => {})
  }

  async function testStrategyWithRealHistory() {
    if (isTesting || isValidatingServer) return
    try {
      setIsTesting(true)
      setHistorySource('real')
      const limit = Math.max(1, Math.min(500, Number(realHistoryLimit) || 60))
      const url = `/api/roulette-history?limit=${limit}`
      const headers: HeadersInit = serverToken ? { 'Authorization': `Bearer ${serverToken}` } : {}
      const resp = await fetch(url, { headers })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok || !(data as any)?.success || !Array.isArray((data as any).data)) {
        const msg = String((data as any)?.message || (data as any)?.error || resp.statusText)
        toast.message('Falha ao obter histórico real.', { description: msg })
        setHistorySource('manual')
        setIsTesting(false)
        return
      }
      const spins = ((data as any).data as any[]).map((d: any) => Number(d.number)).filter((n: number) => Number.isFinite(n))
      if (spins.length === 0) {
        toast.message('Histórico real vazio.')
        setHistorySource('manual')
        setIsTesting(false)
        return
      }
      setSimulatedHistoryInput(spins.join(','))
      // Executa teste com histórico real
      testStrategy()
    } catch (e: any) {
      toast.message('Erro de rede ao obter histórico.', { description: e?.message || String(e) })
      setHistorySource('manual')
      setIsTesting(false)
    }
  }

  // Botão único de teste: tenta histórico real quando possível e faz fallback para teste local
  async function unifiedTest() {
    if (isTesting || isValidatingServer) return
    const limit = Math.max(1, Math.min(500, Number(realHistoryLimit) || 60))
    if (serverToken) {
      try {
        const headers: HeadersInit = { 'Authorization': `Bearer ${serverToken}` }
        const resp = await fetch(`/api/roulette-history?limit=${limit}`, { headers })
        const data = await resp.json().catch(() => ({}))
        const ok = resp.ok && (data as any)?.success && Array.isArray((data as any).data)
        const spins = ok ? (((data as any).data as any[]).map((d: any) => Number(d.number)).filter((n: number) => Number.isFinite(n))) : []
        if (ok && spins.length > 0) {
          setSimulatedHistoryInput(spins.join(','))
          setHistorySource('real')
          return testStrategy()
        }
        toast.message('Histórico real indisponível. Executando teste local.')
      } catch {
        toast.message('Falha ao consultar histórico real. Executando teste local.')
      }
    }
    setHistorySource('manual')
    return testStrategy()
  }

  async function validateSignalOnServer() {
    if (isValidatingServer) return
    const signalId = validationSignalId || (testReport.signals[0]?.nodeId || '')
    if (!signalId) {
      toast.message('Selecione um sinal para validar.')
      return
    }
    if (!serverToken) {
      toast.message('Informe o token para validação.')
      return
    }
    try {
      setIsValidatingServer(true)
      const body: any = {
        signal_id: signalId,
        result: validationResult,
      }
      if (typeof validationWinningNumber === 'number') body.winning_number = validationWinningNumber
      if (typeof validationNetPayout === 'number') body.net_payout = validationNetPayout
      const resp = await fetch('/api/signals/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serverToken}`,
        },
        body: JSON.stringify(body),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        setServerValidationResponse({ ok: false, status: resp.status, error: String((data as any)?.error || resp.statusText) })
        toast.message('Falha na validação no servidor.', { description: String((data as any)?.error || resp.statusText) })
      } else {
        setServerValidationResponse({ ok: true, status: resp.status, data })
        toast.success('Validação no servidor concluída.')
      }
    } catch (e: any) {
      setServerValidationResponse({ ok: false, status: 0, error: e?.message || String(e) })
      toast.message('Erro de rede na validação.', { description: e?.message || String(e) })
    } finally {
      setIsValidatingServer(false)
    }
  }

  function exportTestReport() {
    try {
      const data = JSON.stringify(testReport, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `test-report-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Relatório exportado (.json).')
    } catch (e: any) {
      toast.message('Falha ao exportar relatório.', { description: e?.message || String(e) })
    }
  }

  // React Flow mapping and handlers
  const typeColorMap = useMemo(() => ({
    trigger: '#a855f7',
    condition: '#3b82f6',
    logic: '#64748b',
    signal: '#16a34a',
  }), [])

  const rfNodes = useMemo(() => (
    nodes.map(n => ({
      id: n.id,
      position: n.position,
      data: { label: n.data.label },
      style: { border: `1px solid ${typeColorMap[n.type]}`, borderRadius: 6, padding: 8, background: 'white' },
    }))
  ), [nodes, typeColorMap])

  const edgeColor: Record<'success' | 'failure' | 'condition', string> = {
    success: '#16a34a',
    failure: '#dc2626',
    condition: '#3b82f6',
  }

  const rfEdges = useMemo(() => (
    connections.map(c => {
      const iconLabel = c.type === 'success' ? '✔' : c.type === 'failure' ? '✖' : '∴'
      const dash = c.type === 'failure' ? '6 3' : c.type === 'condition' ? '2 2' : ''
      const isSelected = selectedEdgeId === c.id
      return {
        id: c.id,
        source: c.source,
        target: c.target,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: edgeColor[c.type], strokeWidth: isSelected ? 3.5 : 2, opacity: isSelected ? 1 : 0.9, ...(dash ? { strokeDasharray: dash } : {}) },
        label: iconLabel,
        labelStyle: { fill: edgeColor[c.type], fontWeight: isSelected ? 700 : 600, fontSize: isSelected ? 13 : 12 },
      }
    })
  ), [connections, selectedEdgeId])

  const handleConnect = useCallback((params: RFConnection) => {
    const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    if (!params.source || !params.target) return
    setConnections(prev => [...prev, { id, source: params.source as string, target: params.target as string, type: 'success' }])
  }, [])

  const onEdgesDelete = useCallback((edges: RFEdge[]) => {
    setConnections(prev => prev.filter(c => !edges.some(e => e.id === c.id)))
  }, [])

  const onNodeDragStop = useCallback((_: any, node: RFNode) => {
    setNodes(prev => prev.map(n => (n.id === node.id ? { ...n, position: node.position } : n)))
  }, [])

  const onNodeClick = useCallback((_: any, node: RFNode) => {
    const found = nodes.find(n => n.id === node.id) || null
    setSelectedNode(found)
    setSelectedEdgeId(null)
  }, [nodes])

  const onEdgeClick = useCallback((_: any, edge: RFEdge) => {
    setSelectedEdgeId(edge.id)
    setSelectedNode(null)
  }, [])

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
    }).filter(Boolean) as Array<{ x1: number; y1: number; x2: number; y2: number; type: 'success' | 'failure' | 'condition'; id: string }>

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
              <div className="flex items-center justify-between">
                <Label className="text-xs">{f.label}</Label>
                {FIELD_HELP[f.key || '']?.description ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {FIELD_HELP[f.key || '']!.description}{FIELD_HELP[f.key || '']!.example ? ` &bull; Ex.: ${FIELD_HELP[f.key || '']!.example}` : ''}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </div>
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
                  {(f.options || []).map((opt) => {
                    const labelMap = SELECT_LABELS_PT[f.key || ''] || {}
                    const label = labelMap[opt] || opt
                    return <SelectItem key={opt} value={opt}>{label}</SelectItem>
                  })}
                </SelectContent>
              </Select>
            </div>
          )
        }
        if (f.type === 'number') {
          // Oculta "NÃºmero alvo" salvo quando o evento selecionado Ã© 'numero' na condiÃ§Ã£o de ausÃªncia
          if (f.key === 'numeroAlvo' && typeKey === 'condition:absence') {
            const evento = String((selectedNode.data.config || {}).evento || '').toLowerCase()
            if (evento !== 'numero') {
              return null
            }
          }
          return (
            <div key={f.key}>
              <div className="flex items-center justify-between">
                <Label className="text-xs">{f.label}</Label>
                {FIELD_HELP[f.key || '']?.description ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {FIELD_HELP[f.key || '']!.description}{FIELD_HELP[f.key || '']!.example ? ` &bull; Ex.: ${FIELD_HELP[f.key || '']!.example}` : ''}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </div>
              <Input
                type="number"
                min={f.key === 'numero' || f.key === 'numeroAlvo' ? 0 : undefined}
                max={f.key === 'numero' || f.key === 'numeroAlvo' ? 36 : undefined}
                step={f.key === 'stake' ? 0.01 : undefined}
                value={String(val ?? '')}
                onChange={(e) => {
                  const raw = Number(e.target.value)
                  const isComprimento = (f.key === 'comprimento' && typeKey === 'condition:alternation')
                  const isJanelaSetor = (f.key === 'janela' && typeKey === 'condition:setorDominante')
                  const isFreqSetor = (f.key === 'frequenciaMinima' && typeKey === 'condition:setorDominante')
                  const isNumeroField = (f.key === 'numero' || f.key === 'numeroAlvo')
                  const isOcorrencias = (f.key === 'ocorrencias')
                  const isJanelaGeneric = (f.key === 'janela' || f.key === 'inicio' || f.key === 'fim')
                  const isProtecaoOrLimite = (f.key === 'protecaoLimite' || f.key === 'limiteRodadas')
                  const janelaAtual = Number((selectedNode.data.config || {}).janela ?? 1)
                  let next = raw
                  next = isComprimento ? Math.max(2, next) : next
                  next = isJanelaSetor ? Math.max(1, next) : next
                  next = isFreqSetor ? Math.max(1, Math.min(next, Math.max(1, janelaAtual))) : next
                  next = isNumeroField ? Math.max(0, Math.min(36, next)) : next
                  next = isOcorrencias ? Math.max(1, next) : next
                  next = isJanelaGeneric ? Math.max(1, next) : next
                  if (String(f.key) === 'protecaoLimite') {
                    next = Math.min(10, Math.max(0, Math.floor(next)))
                  } else {
                    next = isProtecaoOrLimite ? Math.max(0, next) : next
                  }
                  updateNode(selectedNode.id, {
                    data: { 
                      ...selectedNode.data,
                      config: { ...(selectedNode.data.config || {}), [f.key!]: next } 
                    }
                  })
                }}
              />
              {f.key === 'numeroAlvo' ? (
                <div className="text-[10px] text-muted-foreground mt-1">Aceita 0–36. Opcional: deixe vazio para qualquer número.</div>
              ) : null}
              {f.key === 'comprimento' && typeKey === 'condition:alternation' ? (
                <div className="text-[10px] mt-1">
                  {Number(val) < 2 ? (
                    <span className="text-red-600">Comprimento mínimo é 2.</span>
                  ) : (
                    (() => {
                      const eixo = String((selectedNode.data.config || {}).eixo || 'cor').toLowerCase()
                      const comp = Number((selectedNode.data.config || {}).comprimento || 0)
                      const history = parseHistoryInput(simulatedHistoryInput)
                      const slice = history.slice(-Math.max(comp, 0))
                      const hasZero = slice.some(t => t === 0 || t === 'zero')
                      if ((eixo === 'cor' || eixo === 'paridade') && hasZero && comp >= 2) {
                        return <span className="text-muted-foreground">Zero nas últimas {comp} rodadas interrompe a alternância.</span>
                      }
                      return null
                    })()
                  )}
                </div>
              ) : null}
            </div>
          )
        }
        if (f.type === 'slider') {
          return (
            <div key={f.key}>
              <div className="flex items-center justify-between">
                <Label className="text-xs">{f.label}</Label>
                {FIELD_HELP[f.key || '']?.description ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {FIELD_HELP[f.key || '']!.description}{FIELD_HELP[f.key || '']!.example ? ` &bull; Ex.: ${FIELD_HELP[f.key || '']!.example}` : ''}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
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
                <Input
                  type="number"
                  className="h-8 w-16"
                  min={f.min ?? 0}
                  max={f.max ?? 100}
                  step={f.step ?? 1}
                  value={String(val ?? '')}
                  onChange={(e) => {
                    let v = Number(e.target.value)
                    const min = f.min ?? 0
                    const max = f.max ?? 100
                    if (!Number.isFinite(v)) return
                    v = Math.max(min, Math.min(max, v))
                    updateNode(selectedNode.id, {
                      data: { 
                        ...selectedNode.data,
                        config: { ...(selectedNode.data.config || {}), [f.key!]: v } 
                      }
                    })
                  }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">{`${f.min ?? 0}–${f.max ?? 100}${f.step ? ` (passo ${f.step})` : ''}`}</div>
            </div>
          )
        }
        if (f.type === 'array') {
          // Seletor visual para nÃºmeros do nÃ³ Signal
          if (selectedNode.type === 'signal' && f.key === 'numeros') {
            const cfg = selectedNode.data.config || {}
            const selectedNums: number[] = Array.isArray(cfg.numeros) ? cfg.numeros : []
            const mode = String(cfg.selectionMode || 'manual').toLowerCase()
            // No MVP, o seletor de números deve estar sempre disponível
            const toggleNumber = (num: number) => {
              let next = Array.isArray(selectedNums) ? [...selectedNums] : []
              if (next.includes(num)) next = next.filter(n => n !== num)
              else next.push(num)
              next = next.filter(n => Number.isFinite(n) && n >= 0 && n <= 36).sort((a, b) => a - b)
              updateNode(selectedNode.id, { data: { 
                ...selectedNode.data,
                config: { ...(selectedNode.data.config || {}), numeros: next } 
              } })
            }
            const setSelection = (arr: number[]) => {
              const uniq = Array.from(new Set(arr.filter(n => Number.isFinite(n) && n >= 0 && n <= 36))).sort((a,b)=>a-b)
              updateNode(selectedNode.id, { data: { 
                ...selectedNode.data,
                config: { ...(selectedNode.data.config || {}), numeros: uniq } 
              } })
              // Se o usuário começar a selecionar números e o modo for automático, mudar para manual
              if (uniq.length > 0 && selectionMode === 'automatic') {
                setSelectionMode('manual')
              }
            }
            const invertSelection = () => {
              const all = Array.from({ length: 37 }, (_, i) => i)
              const next = all.filter(n => !selectedNums.includes(n))
              setSelection(next)
            }
            const selectNone = () => { setSelection([]); }
            const selectReds = () => setSelection(RED_NUMBERS)
            const selectBlacks = () => setSelection(BLACK_NUMBERS)
            const selectZero = () => setSelection([0])
            const selectEven = () => setSelection(Array.from({ length: 36 }, (_, i) => i + 1).filter(n => n % 2 === 0))
            const selectOdd = () => setSelection(Array.from({ length: 36 }, (_, i) => i + 1).filter(n => n % 2 === 1))
            const selectLow = () => setSelection(Array.from({ length: 18 }, (_, i) => i + 1))
            const selectHigh = () => setSelection(Array.from({ length: 18 }, (_, i) => i + 19))
            const selectDozen = (k: number) => {
              const start = (k - 1) * 12 + 1
              const arr = Array.from({ length: 12 }, (_, i) => start + i)
              setSelection(arr)
            }
            const selectColumn = (k: number) => {
              const arr = Array.from({ length: 36 }, (_, i) => i + 1).filter(n => {
                const mod = n % 3
                if (k === 1) return mod === 1
                if (k === 2) return mod === 2
                return mod === 0
              })
              setSelection(arr)
            }
            const EUROPEAN_WHEEL = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26]
            const wheelIndexOf = (n: number) => EUROPEAN_WHEEL.indexOf(n)
            const circularDistanceLocal = (a: number, b: number): number => {
              const ia = wheelIndexOf(a)
              const ib = wheelIndexOf(b)
              if (ia < 0 || ib < 0) return 999
              const len = EUROPEAN_WHEEL.length
              const diff = Math.abs(ia - ib)
              return Math.min(diff, len - diff)
            }
            const addNeighbors = (radius: number) => {
              if (!selectedNums.length) return
              const next = new Set(selectedNums)
              selectedNums.forEach(seed => {
                EUROPEAN_WHEEL.forEach(n => {
                  if (circularDistanceLocal(n, seed) <= radius) next.add(n)
                })
              })
              setSelection(Array.from(next))
            }
            const redsCount = selectedNums.filter(n => RED_NUMBERS.includes(n)).length
            const blacksCount = selectedNums.filter(n => BLACK_NUMBERS.includes(n)).length
            const zeroCount = selectedNums.includes(0) ? 1 : 0
            const evenCount = selectedNums.filter(n => n !== 0 && n % 2 === 0).length
            const oddCount = selectedNums.filter(n => n % 2 === 1).length
            const dozen1Count = selectedNums.filter(n => n >= 1 && n <= 12).length
            const dozen2Count = selectedNums.filter(n => n >= 13 && n <= 24).length
            const dozen3Count = selectedNums.filter(n => n >= 25 && n <= 36).length
            const col1Count = selectedNums.filter(n => n >= 1 && n <= 36 && n % 3 === 1).length
            const col2Count = selectedNums.filter(n => n >= 1 && n <= 36 && n % 3 === 2).length
            const col3Count = selectedNums.filter(n => n >= 1 && n <= 36 && n % 3 === 0).length
            return (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                <div className="mt-1 pr-1">
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Button size="sm" variant="outline" onClick={selectNone}>Limpar</Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button size="sm" variant="outline" onClick={selectReds}>Vermelhos</Button>
                    <Button size="sm" variant="outline" onClick={selectBlacks}>Pretos</Button>
                    <Button size="sm" variant="outline" onClick={selectZero}>Zero</Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button size="sm" variant="outline" onClick={selectEven}>Pares</Button>
                    <Button size="sm" variant="outline" onClick={selectOdd}>Ímpares</Button>
                    <Button size="sm" variant="outline" onClick={selectLow}>Baixos 1-18</Button>
                    <Button size="sm" variant="outline" onClick={selectHigh}>Altos 19-36</Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button size="sm" variant="outline" onClick={() => selectDozen(1)}>Dúzia 1</Button>
                    <Button size="sm" variant="outline" onClick={() => selectDozen(2)}>Dúzia 2</Button>
                    <Button size="sm" variant="outline" onClick={() => selectDozen(3)}>Dúzia 3</Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button size="sm" variant="outline" onClick={() => selectColumn(1)}>Coluna 1</Button>
                    <Button size="sm" variant="outline" onClick={() => selectColumn(2)}>Coluna 2</Button>
                    <Button size="sm" variant="outline" onClick={() => selectColumn(3)}>Coluna 3</Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button size="sm" variant="outline" onClick={invertSelection}>Inverter</Button>
                    <Button size="sm" variant="outline" disabled={!selectedNums.length} onClick={() => addNeighbors(1)}>+ Vizinhos ±1</Button>
                    <Button size="sm" variant="outline" disabled={!selectedNums.length} onClick={() => addNeighbors(2)}>+ Vizinhos ±2</Button>
                  </div>
                  {/* Seletor circular estilo roleta europeia */}
                  <div className="relative mx-auto" style={{ width: 240, height: 240 }}>
                    {EUROPEAN_WHEEL.map((num, i) => {
                      const active = selectedNums.includes(num)
                      const isRed = RED_NUMBERS.includes(num)
                      const isGreen = GREEN_NUMBERS.includes(num)
                      const isBlack = BLACK_NUMBERS.includes(num)
                      const style = isRed
                        ? (active ? 'bg-red-600 hover:bg-red-700 text-white border-red-700' : 'text-red-600 border-red-400 hover:bg-white/10')
                        : isGreen
                        ? (active ? 'bg-green-600 hover:bg-green-700 text-white border-green-700' : 'text-green-600 border-green-300 hover:bg-green-50')
                        : (active ? 'bg-black hover:bg-black text-white border-black' : 'text-white border-white hover:bg-white/10 font-normal')
                      const N = EUROPEAN_WHEEL.length
                      const angle = (2 * Math.PI * i) / N - Math.PI / 2
                      const r = 100
                      const cx = 120
                      const cy = 120
                      const left = cx + r * Math.cos(angle) - 14
                      const top = cy + r * Math.sin(angle) - 14
                      return (
                        <Button
                          key={`wheel-n-${num}`}
                          size="sm"
                          variant={active ? 'default' : 'outline'}
                          className={`h-7 w-7 p-0 absolute ${style}`}
                          style={{ left, top }}
                          onClick={() => toggleNumber(num)}
                        >
                          {num}
                        </Button>
                      )
                    })}
                    {/* Centro decorativo */}
                    <div className="absolute rounded-full border border-white/30" style={{ left: 90, top: 90, width: 60, height: 60 }} />
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground mt-2">Selecionados: {selectedNums.length ? `[${selectedNums.join(', ')}]` : '(nenhum)'}</div>
                <div className="mt-2 text-[10px] text-muted-foreground">
                  <div>Resumo: total {selectedNums.length}; Vermelhos {redsCount}; Pretos {blacksCount}; Zero {zeroCount}</div>
                  <div>Par {evenCount}; Ímpar {oddCount}; Dúzias [ {dozen1Count}, {dozen2Count}, {dozen3Count} ]</div>
                  <div>Colunas [ {col1Count}, {col2Count}, {col3Count} ]</div>
                  <div className="mt-1">MVP: ação = "Emitir Sinal"; a seleção de números é opcional e serve para visualização/futuras apostas.</div>
                </div>
              </div>
            )
          }

          // Seletor visual para números em nós de condição
          if (selectedNode.type === 'condition' && (f.key === 'numero' || f.key === 'numeroAlvo')) {
            const cfg = selectedNode.data.config || {}
            const subtype = String(selectedNode.subtype || '').toLowerCase()
            const evento = String(cfg.evento || '').toLowerCase()
            
            // Só mostrar o picker para condições que usam números específicos
            const shouldShowPicker = (
              subtype === 'specific-number' ||
              subtype === 'repeat-number' ||
              subtype === 'neighbors' ||
              (subtype === 'absence' && evento === 'numero')
            )
            
            if (!shouldShowPicker) {
              return (
                <div key={f.key}>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{f.label}</Label>
                    {FIELD_HELP[f.key || '']?.description ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            {FIELD_HELP[f.key || '']!.description}{FIELD_HELP[f.key || '']!.example ? ` • Ex.: ${FIELD_HELP[f.key || '']!.example}` : ''}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : null}
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={36}
                    step={1}
                    value={val ?? ''}
                    onChange={(e) => {
                      const next = e.target.value === '' ? undefined : Math.max(0, Math.min(36, Math.round(Number(e.target.value))))
                      updateNode(selectedNode.id, {
                        data: {
                          ...selectedNode.data,
                          config: { ...(selectedNode.data.config || {}), [f.key!]: next }
                        }
                      })
                    }}
                  />
                </div>
              )
            }

            const currentNumber = typeof val === 'number' ? val : undefined
            
            const selectNumber = (num: number) => {
              updateNode(selectedNode.id, {
                data: {
                  ...selectedNode.data,
                  config: { ...(selectedNode.data.config || {}), [f.key!]: num }
                }
              })
            }

            const clearSelection = () => {
              updateNode(selectedNode.id, {
                data: {
                  ...selectedNode.data,
                  config: { ...(selectedNode.data.config || {}), [f.key!]: undefined }
                }
              })
            }

            return (
              <div key={f.key}>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{f.label}</Label>
                  {FIELD_HELP[f.key || '']?.description ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          {FIELD_HELP[f.key || '']!.description}{FIELD_HELP[f.key || '']!.example ? ` • Ex.: ${FIELD_HELP[f.key || '']!.example}` : ''}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null}
                </div>
                
                <div className="mt-1 pr-1">
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Button size="sm" variant="outline" onClick={clearSelection}>Limpar</Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button size="sm" variant="outline" onClick={() => selectNumber(0)}>Zero</Button>
                    <Button size="sm" variant="outline" onClick={() => selectNumber(RED_NUMBERS[Math.floor(Math.random() * RED_NUMBERS.length)])}>Vermelho Aleatório</Button>
                    <Button size="sm" variant="outline" onClick={() => selectNumber(BLACK_NUMBERS[Math.floor(Math.random() * BLACK_NUMBERS.length)])}>Preto Aleatório</Button>
                  </div>
                  
                  <div className="grid grid-cols-9 gap-1">
                    {Array.from({ length: 37 }, (_, i) => i).map((num) => {
                      const active = currentNumber === num
                      const isRed = RED_NUMBERS.includes(num)
                      const isGreen = GREEN_NUMBERS.includes(num)
                      const isBlack = BLACK_NUMBERS.includes(num)
                      const style = isRed
                        ? (active ? 'bg-red-600 hover:bg-red-700 text-white border-red-700' : 'text-red-600 border-red-400 hover:bg-white/10')
                        : isGreen
                        ? (active ? 'bg-green-600 hover:bg-green-700 text-white border-green-700' : 'text-green-600 border-green-300 hover:bg-green-50')
                        : (active ? 'bg-black hover:bg-black text-white border-black' : 'text-white border-white hover:bg-white/10 font-normal')
                      return (
                        <Button
                          key={`cond-n-${num}`}
                          size="sm"
                          variant={active ? 'default' : 'outline'}
                          className={`h-7 w-7 p-0 ${style}`}
                          onClick={() => selectNumber(num)}
                        >
                          {num}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground mt-2">
                  Selecionado: {typeof currentNumber === 'number' ? currentNumber : '(nenhum)'}
                </div>
              </div>
            )
          }

          // Fallback genérico para arrays
          return (
            <div key={f.key}>
              <div className="flex items-center justify-between">
                <Label className="text-xs">{f.label}</Label>
                {FIELD_HELP[f.key || '']?.description ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {FIELD_HELP[f.key || '']!.description}{FIELD_HELP[f.key || '']!.example ? ` • Ex.: ${FIELD_HELP[f.key || '']!.example}` : ''}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </div>
              <Textarea
                value={Array.isArray(val) ? ((val as any[]).length ? `[${(val as any[]).join(', ')}]` : '') : String(val ?? '')}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[\[\]]/g, '')
                  const parts = cleaned.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean)
                  const nums = parts.map(p => Number(p)).filter(n => Number.isFinite(n) && n >= 0 && n <= 36)
                  updateNode(selectedNode.id, {
                    data: {
                      ...selectedNode.data,
                      config: { ...(selectedNode.data.config || {}), [f.key!]: nums }
                    }
                  })
                }}
              />
              <div className="text-[10px] text-muted-foreground mt-1">Separe itens por vírgula ou espaço. Apenas números 0–36 são aceitos.</div>
            </div>
          )
        }
        if (f.type === 'checkbox') {
          return (
            <div key={f.key}>
              <div className="flex items-center justify-between">
                <Label className="text-xs">{f.label}</Label>
                {FIELD_HELP[f.key || '']?.description ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {FIELD_HELP[f.key || '']!.description}{FIELD_HELP[f.key || '']!.example ? ` • Ex.: ${FIELD_HELP[f.key || '']!.example}` : ''}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </div>
              <Switch
                checked={Boolean(val)}
                onCheckedChange={(checked) => updateNode(selectedNode.id, {
                  data: {
                    ...selectedNode.data,
                    config: { ...(selectedNode.data.config || {}), [f.key!]: checked }
                  }
                })}
              />
            </div>
          )
        }
        return (
          <div key={f.key}>
            <div className="flex items-center justify-between">
              <Label className="text-xs">{f.label}</Label>
              {FIELD_HELP[f.key || '']?.description ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {FIELD_HELP[f.key || '']!.description}{FIELD_HELP[f.key || '']!.example ? ` • Ex.: ${FIELD_HELP[f.key || '']!.example}` : ''}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>
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

    return Object.entries(selectedNode.data.config).map(([key, value]) => {
      const help = FIELD_HELP[key]
      const label = help?.label || key
      const isBool = typeof value === 'boolean' || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'false'
      const isNumber = typeof value === 'number' || (/^-?\d+(\.\d+)?$/.test(String(value)))
      const isArray = Array.isArray(value)

      return (
        <div key={key}>
          <div className="flex items-center justify-between">
            <Label className="text-xs">{label}</Label>
            {help?.description ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    {help.description}{help.example ? ` &bull; Ex.: ${help.example}` : ''}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </div>

          {isBool ? (
            <Switch
              checked={String(value).toLowerCase() === 'true'}
              onCheckedChange={(checked) => updateNode(selectedNode.id, {
                data: {
                  ...selectedNode.data,
                  config: { ...selectedNode.data.config, [key]: checked }
                }
              })}
            />
          ) : isNumber ? (
            <Input
              type="number"
              min={key === 'numero' || key === 'numeroAlvo' ? 0 : undefined}
              max={key === 'numero' || key === 'numeroAlvo' ? 36 : undefined}
              step={key === 'stake' ? 0.01 : undefined}
              value={String(value)}
              onChange={(e) => {
                const raw = Number(e.target.value)
                const isNumeroField = (key === 'numero' || key === 'numeroAlvo')
                const isComprimento = (key === 'comprimento')
                const isJanelaGeneric = (key === 'janela' || key === 'inicio' || key === 'fim')
                const isOcorrencias = (key === 'ocorrencias')
                const isProtecaoOrLimite = (key === 'protecaoLimite' || key === 'limiteRodadas')
                let next = raw
                next = isNumeroField ? Math.max(0, Math.min(36, next)) : next
                next = isComprimento ? Math.max(2, next) : next
                next = isJanelaGeneric ? Math.max(1, next) : next
                next = isOcorrencias ? Math.max(1, next) : next
                if (key === 'protecaoLimite') {
                  next = Math.min(10, Math.max(0, Math.floor(next)))
                } else {
                  next = isProtecaoOrLimite ? Math.max(0, next) : next
                }
                updateNode(selectedNode.id, {
                  data: {
                    ...selectedNode.data,
                    config: { ...selectedNode.data.config, [key]: next }
                  }
                })
              }}
            />
          ) : isArray ? (
            <Textarea
              value={Array.isArray(value) ? ((value as any[]).length ? `[${(value as any[]).join(', ')}]` : '') : String(value ?? '')}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[\[\]]/g, '')
                const parts = cleaned.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean)
                const nums = parts.map(p => Number(p)).filter(n => Number.isFinite(n) && n >= 0 && n <= 36)
                updateNode(selectedNode.id, {
                  data: { 
                    ...selectedNode.data,
                    config: { ...selectedNode.data.config, [key]: nums } 
                  }
                })
              }}
            />
          ) : (
            <Input
              value={String(value)}
              onChange={(e) => updateNode(selectedNode.id, {
                data: { 
                  ...selectedNode.data,
                  config: { ...selectedNode.data.config, [key]: e.target.value } 
                }
              })}
            />
          )}
          {help?.example ? <div className="text-[10px] text-muted-foreground mt-1">Ex.: {help.example}</div> : null}
        </div>
      )
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{((builderSpec.layout.sections.header.elements.find((e: any) => e.type === 'title') as any)?.value) ?? 'Builder'}</CardTitle>
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
              {/* Removido export geral para priorizar download individual por estratÃ©gia */}
              <Button variant="outline" onClick={() => importInputRef.current?.click()}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Importar JSON
              </Button>

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
                {strategies.length === 0 ? (
                    <div className="p-3 border rounded-md bg-muted/20">
                      <div className="text-sm text-muted-foreground">Nenhuma estratégia salva ainda. Use o botão no topo para criar uma nova.</div>
                    </div>
                  ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {strategies.map(s => (
                        <Card key={s.id}>
                          <CardContent className="py-3 flex items-center justify-between">
                            <div>
                              <div className="font-medium">{s.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {s.status === 'active' ? 'Ativa' : 'Pausada'} &bull; {Array.isArray(s.nodes) ? s.nodes.length : 0} nós &bull; atualizado {new Date(s.updatedAt).toLocaleString()}
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

                    <Separator />
                    <div>
                      <div className="text-sm font-medium mb-2">Templates disponíveis</div>
                      {templates.length === 0 ? (
                        <div className="p-3 border rounded-md bg-muted/20">
                          <div className="text-sm font-medium mb-1">Nenhum template disponível</div>
                          <div className="text-xs text-muted-foreground mb-2">Carregue templates ou crie uma nova estratégia.</div>
                          <div className="flex gap-2">
                            <Button onClick={createNewStrategy}>
                              <Puzzle className="mr-2 h-4 w-4" /> Nova Estratégia
                            </Button>
                            <Button variant="secondary" onClick={refreshTemplates}>
                              <RotateCcw className="mr-2 h-4 w-4" /> Carregar Templates
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {templates.map((tpl: any) => (
                            <Card key={tpl.template_key || tpl.name}>
                              <CardContent className="py-3 flex items-center justify-between">
                                <div>
                                  <div className="font-medium flex items-center">
                                    {tpl.name}
                                    <Badge variant="outline" className="ml-2">Template</Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {tpl.description || 'Template curado'} &bull; v{tpl.version || '1.0.0'}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button onClick={() => duplicateTemplate(tpl)}>
                                    <Puzzle className="mr-2 h-4 w-4" /> Duplicar e Editar
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="templates">
                {templates.length === 0 ? (
                    <div className="p-3 border rounded-md bg-muted/20">
                      <div className="text-sm font-medium mb-1">Nenhum template disponível</div>
                      <div className="text-xs text-muted-foreground mb-2">Carregue templates ou crie uma nova estratégia.</div>
                      <div className="flex gap-2">
                        <Button onClick={createNewStrategy}>
                          <Puzzle className="mr-2 h-4 w-4" /> Nova Estratégia
                        </Button>
                        <Button variant="secondary" onClick={refreshTemplates}>
                          <RotateCcw className="mr-2 h-4 w-4" /> Carregar Templates
                        </Button>
                      </div>
                    </div>
                  ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Buscar template por nome..."
                        value={templateQuery}
                        onChange={(e) => setTemplateQuery(e.target.value)}
                      />
                    </div>
                    {(templates.filter((tpl: any) => (tpl.name || '').toLowerCase().includes(templateQuery.toLowerCase()))).map((tpl: any) => (
                      <Card key={tpl.template_key || tpl.name}>
                        <CardContent className="py-3 flex items-center justify-between">
                          <div>
                            <div className="font-medium flex items-center">
                              {tpl.name}
                              <Badge variant="outline" className="ml-2">Template</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {tpl.description || 'Template curado'} &bull; v{tpl.version || '1.0.0'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button onClick={() => duplicateTemplate(tpl)}>
                              <Puzzle className="mr-2 h-4 w-4" /> Duplicar e Editar
                            </Button>
                            <Button variant="secondary" onClick={() => duplicateAndSaveTemplate(tpl)}>
                              Salvar cópia
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
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
            <Input
              value={draftStrategyName}
              onChange={(e) => setDraftStrategyName(e.target.value)}
              placeholder="Defina o nome da estratégia"
              className="h-8 m-0"
            />
            <div className={`flex gap-4 ${isFullscreen ? 'h-[100vh]' : ''} min-h-0`} ref={builderRef}>
              <Card className="w-64">
                <CardHeader>
                  <CardTitle className="text-base">{builderSpec.builderModal.columns.toolbox.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className={`${isFullscreen ? 'h-[calc(100vh-140px)]' : 'h-[480px]'} pr-2`}>
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
                    className={`relative ${isFullscreen ? 'h-[100vh]' : 'h-[520px]'} border rounded-sm bg-background`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleCanvasDrop}
                  >
                    <Button className="absolute right-2 top-2 z-10" size="sm" variant="outline" onClick={toggleFullscreen}>
                      {isFullscreen ? 'Sair de tela cheia' : 'Tela cheia'}
                    </Button>
                    <ReactFlow
                      nodes={rfNodes}
                      edges={rfEdges}
                      fitView
                      onConnect={handleConnect}
                      onEdgesDelete={onEdgesDelete}
                      onNodeDragStop={onNodeDragStop}
                      onNodeClick={onNodeClick}
                      onEdgeClick={onEdgeClick}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <Background />
                      <Controls />
                    </ReactFlow>
                    <div className="absolute bottom-2 left-2 z-10 p-2 rounded bg-white/90 shadow text-[11px] space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        <div className="h-[0px] w-10 border-t-2 border-green-600" />
                        <span>success</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-3.5 w-3.5 text-red-600" />
                        <div className="h-[0px] w-10 border-t-2 border-red-600 border-dashed" />
                        <span>failure</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-blue-600" />
                        <div className="h-[0px] w-10 border-t-2 border-blue-600 border-dotted" />
                        <span>condition</span>
                      </div>
                    </div>
                    {nodes.length === 0 ? (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Layers className="h-8 w-8" />
                          <div className="text-sm text-center max-w-[360px]">{builderSpec.builderModal.columns.canvas.emptyStateText}</div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card className={`w-80 ${isFullscreen ? 'h-[100vh]' : ''} overflow-hidden`}>
                <CardHeader>
                  <CardTitle className="text-base">{builderSpec.builderModal.columns.propertiesPanel.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className={`${isFullscreen ? 'h-[calc(100vh-140px)]' : 'h-[520px]'} pr-2`}>
            {selectedEdgeId ? (
              <div className="space-y-3">
                <div className="text-sm">Editar conexão</div>
                <div className="text-xs text-muted-foreground">
                  De: {nodes.find(n => n.id === (connections.find(c => c.id === selectedEdgeId)?.source))?.data.label || connections.find(c => c.id === selectedEdgeId)?.source}
                  {' '}&rarr;{' '}
                  Para: {nodes.find(n => n.id === (connections.find(c => c.id === selectedEdgeId)?.target))?.data.label || connections.find(c => c.id === selectedEdgeId)?.target}
                </div>
                <div>
                  <Label className="text-xs">Tipo da conexão</Label>
                  <Select
                    value={connections.find(c => c.id === selectedEdgeId)?.type || 'success'}
                    onValueChange={(val) =>
                      setConnections(prev => prev.map(c => c.id === selectedEdgeId ? { ...c, type: val as 'success' | 'failure' | 'condition' } : c))
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="success">
                        <div className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-600" /> success</div>
                      </SelectItem>
                      <SelectItem value="failure">
                        <div className="flex items-center gap-2"><XCircle className="h-3.5 w-3.5 text-red-600" /> failure</div>
                      </SelectItem>
                      <SelectItem value="condition">
                        <div className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-blue-600" /> condition</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={() => {
                    setConnections(prev => prev.filter(c => c.id !== selectedEdgeId))
                    setSelectedEdgeId(null)
                  }}>
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir conexão
                  </Button>
                </div>
              </div>
            ) : !selectedNode ? (
              <div className="text-sm text-muted-foreground">Selecione um nó ou conexão para editar.</div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Rótulo</Label>
                    <Input
                      value={selectedNode.data.label}
                      onChange={(e) => updateNode(selectedNode.id, { data: { ...selectedNode.data, label: e.target.value } })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" className="h-7 px-2" onClick={() => deleteNode(selectedNode.id)}>
                      <Trash2 className="mr-1 h-3 w-3" /> Excluir
                    </Button>
                  </div>
                </div>

                {selectedNode.type === 'condition' && (
                  <Collapsible>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Tipo de condição</Label>
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Escolha um tipo para ver campos específicos. Se importou de JSON e o tipo não foi reconhecido, mantenha "Genérico (importado)".
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="px-2 h-6">
                            <ChevronRight className="mr-1 h-3 w-3" /> Alterar
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                    <CollapsibleContent className="mt-2">
                      <Select
                        value={selectedNode.subtype || selectedNode.data.conditionType || 'generic'}
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
                          <SelectItem value="generic">Genérico (importado)</SelectItem>
                          {conditionTemplates.map(n => (
                            <SelectItem key={String(n.subtype || n.label)} value={String(n.subtype || '')}>{n.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {selectedNode.type === 'condition' ? (
                  (() => {
                    const msgs = getConditionValidationMessages(selectedNode)
                    return msgs.length ? (
                      <div className="mt-2 rounded border border-yellow-300 bg-yellow-50 text-yellow-800 text-xs p-2 space-y-1">
                        {msgs.map((m, i) => (
                          <div key={`${m}-${i}`} className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> {m}
                          </div>
                        ))}
                      </div>
                    ) : null
                  })()
                ) : null}

                {renderFields()}
              </div>
            )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <Separator className="my-4" />
      <DialogFooter className="sm:justify-start">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Modo de seleção oculto no MVP */}
            <div className="flex items-center gap-2 mt-5">
              <Switch checked={gatingEnabled} onCheckedChange={setGatingEnabled} />
              <Label className="text-xs">Limites (gating)</Label>
            </div>
            <div className="space-y-1 mt-5">
              <Label className="text-xs">Amostra real (giros)</Label>
              <Input
                type="number"
                min={1}
                max={500}
                value={realHistoryLimit}
                onChange={(e) => {
                  const val = Math.floor(Number(e.target.value) || 0)
                  setRealHistoryLimit(val)
                }}
                onBlur={() => setRealHistoryLimit((prev) => Math.max(1, Math.min(500, Math.floor(prev || 0))))}
                className={`h-8 w-[120px] ${realHistoryLimit < 1 || realHistoryLimit > 500 ? 'border-red-500' : ''}`}
              />
              <p className="text-[10px] text-muted-foreground">1–500; usado ao testar com histórico real.</p>
            </div>
            {/* Bloco de status do backend removido para simplificação da UI */}

            {/* Botão de teste movido para o lado esquerdo */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" onClick={unifiedTest} disabled={isTesting || isValidatingServer} className="mt-5">
                    <Play className="mr-2 h-4 w-4" /> {isTesting ? 'Testando...' : 'Testar'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Executa o teste (usa histórico real quando disponível)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </DialogFooter>
    </DialogContent>
        </Dialog >
    <Dialog open={isTestReportOpen} onOpenChange={setIsTestReportOpen}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Relatório de Teste</DialogTitle>
          <DialogDescription>Resumo visual da execução local</DialogDescription>
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
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  Nós: {testReport.summary.visited} / {testReport.summary.totalNodes}
                </div>
                <div className="flex items-center gap-2">
                  <Puzzle className="h-4 w-4 text-muted-foreground" />
                  Conexões: {testReport.summary.totalConnections}
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                  Duração: {Math.round(testReport.summary.durationMs)} ms
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Origem: {String((testReport.summary as any).source || 'manual')}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Amostra: {Number((testReport.summary as any).sampleSize || 0)} giros</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Janela efetiva: {Number((testReport.summary as any).effectiveWindow || 0)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {testReport.signals.length > 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  Resultado: {testReport.signals.length > 0 ? 'Sinal gerado' : 'Nenhum sinal gerado'}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs">Fluxo lógico</Label>
                <div className="flex items-center flex-wrap gap-2 text-sm">
                  {testReport.results.map((r, idx) => (
                    <React.Fragment key={r.nodeId}>
                      <div className="inline-flex items-center gap-1 rounded border px-2 py-1">
                        {r.pass === undefined ? (
                          <AlertTriangle className="h-3 w-3 text-yellow-600" />
                        ) : r.pass ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-600" />
                        )}
                        <span className="font-medium">{r.label}</span>
                      </div>
                      {idx < testReport.results.length - 1 && (
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs">Condições avaliadas</Label>
                <ScrollArea className="h-24">
                  <ul className="text-sm space-y-1">
                    {testReport.results.filter(r => r.type === 'condition').map((r) => (
                      <li key={r.nodeId} className="flex items-center gap-2">
                        {r.pass ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-600" />
                        )}
                        <span className="font-medium">{r.label}</span>
                        <span className="text-muted-foreground">{r.subtype ? `(${r.subtype})` : ''}</span>
                      </li>
                    ))}
                    {testReport.results.filter(r => r.type === 'condition').length === 0 && (
                      <li className="text-muted-foreground">Nenhuma condição foi avaliada.</li>
                    )}
                  </ul>
                </ScrollArea>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs">Sinais gerados</Label>
                <ScrollArea className="h-24">
                  <ul className="text-sm space-y-1">
                    {testReport.signals.length === 0 ? (
                      <li className="text-muted-foreground">Nenhum sinal gerado.</li>
                    ) : testReport.signals.map((s) => (
                      <li key={s.nodeId}>
                        <strong>{s.label}</strong> &bull; ação: {s.acao} &bull; prioridade: {s.prioridade || 'normal'} {s.mensagem ? `&bull; ${s.mensagem}` : ''}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>

              <Separator />

              {/* Derivação (automatic/hybrid) */}
              {testReport.resolver ? (
                <div className="space-y-2">
                  <Label className="text-xs">Derivação (automatic/hybrid)</Label>
                  <div className="text-sm">Modo: {testReport.resolver.mode || '(desconhecido)'}</div>
                  <div className="text-sm">Números derivados: {testReport.resolver.derivedNumbers?.length ? `[${testReport.resolver.derivedNumbers.join(', ')}]` : '(nenhum)'}</div>
                  
                  {/* Enhanced telemetry display */}
                  {(testReport.resolver as any)?.telemetry?.source_chain && (
                    <div className="space-y-1">
                      <Label className="text-xs">Cadeia de origem</Label>
                      <div className="text-xs bg-muted p-2 rounded font-mono">
                        {(testReport.resolver as any).telemetry.source_chain}
                      </div>
                    </div>
                  )}
                  
                  {(testReport.resolver as any)?.telemetry?.reasoning && (
                    <div className="space-y-1">
                      <Label className="text-xs">Raciocínio</Label>
                      <div className="text-xs bg-muted p-2 rounded">
                        {(testReport.resolver as any).telemetry.reasoning}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">Fontes: {(Array.isArray(testReport.resolver.telemetry?.derivedBy) ? testReport.resolver.telemetry.derivedBy.length : 0)} regras aplicadas</div>
                  <div className="text-sm">Gating: {testReport.resolver.gated ? 'aplicado' : 'não aplicado'}</div>
                  <div className="text-sm">Motivos: {Array.isArray((testReport.resolver as any).gateReasons) && (testReport.resolver as any).gateReasons.length ? (testReport.resolver as any).gateReasons.join(', ') : '(nenhum)'}</div>
                   {(testReport.resolver as any)?.telemetry?.gatingApplied ? (
                     <div className="text-xs text-muted-foreground">
                       Pré: {(testReport.resolver as any).telemetry.gatingApplied.preCount} &bull; Pós: {(testReport.resolver as any).telemetry.gatingApplied.postCount}
                       <br />
                       Regras: maxAuto={(testReport.resolver as any).telemetry.gatingApplied.rules?.maxNumbersAuto}, maxHybrid={(testReport.resolver as any).telemetry.gatingApplied.rules?.maxNumbersHybrid}, minManual={(testReport.resolver as any).telemetry.gatingApplied.rules?.minManualHybrid}, excluirZero={(testReport.resolver as any).telemetry.gatingApplied.rules?.excludeZero ? 'sim' : 'não'}
                     </div>
                   ) : null}

                  {Array.isArray((testReport.resolver as any)?.telemetry?.derivedBy) && (testReport.resolver as any).telemetry.derivedBy.length ? (
                    <div className="space-y-1">
                      <Label className="text-xs">Fontes detalhadas</Label>
                      <ScrollArea className="h-24">
                        <ul className="text-sm space-y-1">
                          {(testReport.resolver as any).telemetry.derivedBy.map((d: any, idx: number) => {
                            const node = nodes.find((n: any) => n.id === d.nodeId)
                            const label = node?.data?.label || d.nodeId
                            const count = Array.isArray(d.params?.numbers) ? d.params.numbers.length : 0
                            const preview = Array.isArray(d.params?.numbers) && d.params.numbers.length ? `[${d.params.numbers.slice(0, 18).join(', ')}${d.params.numbers.length > 18 ? '…' : ''}]` : '(nenhum)'
                            return (
                              <li key={`${d.nodeId}-${idx}`}>
                                <strong>{label}</strong> &bull; tipo: {d.subtype || '(?)'} &bull; razão: {d.reason || '(?)'} &bull; qtd: {count} &bull; nums: {preview}
                              </li>
                            )
                          })}
                        </ul>
                      </ScrollArea>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <Separator />

              {testReport.compiled ? (
                <div className="space-y-2">
                  <Label className="text-xs">Compilação (cliente)</Label>
                  <div className="text-sm">
                    Ativação: {
                      typeof testReport.compiled.activation === 'boolean'
                        ? (testReport.compiled.activation ? 'ativa' : 'inativa')
                        : (
                            testReport.compiled.activation && typeof testReport.compiled.activation === 'object' && 'shouldActivate' in (testReport.compiled.activation as any)
                              ? ((testReport.compiled.activation as any).shouldActivate ? 'ativa' : 'inativa')
                              : JSON.stringify(testReport.compiled.activation)
                          )
                    }
                  </div>
                  <div className="text-sm">
                    Números sinal: {
                      Array.isArray((testReport.compiled as any)?.signal?.derivedNumbers) && (testReport.compiled as any).signal.derivedNumbers.length
                        ? `[${(testReport.compiled as any).signal.derivedNumbers.join(', ')}]`
                        : '(nenhum)'
                    }
                  </div>
                  {(testReport.compiled as any)?.signal?.telemetry ? (
                    <div className="text-xs text-muted-foreground">
                      Telemetria: lógica {Array.isArray((testReport.compiled as any).signal.telemetry?.logicTrace) ? (testReport.compiled as any).signal.telemetry.logicTrace.length : 0}, decisão {Array.isArray((testReport.compiled as any).signal.telemetry?.decisionTrace) ? (testReport.compiled as any).signal.telemetry.decisionTrace.length : 0}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <Separator />

              <Accordion type="single" collapsible>
                <AccordionItem value="advanced">
                  <AccordionTrigger>Validação avançada</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px]">Token (Bearer)</Label>
                        <Input
                          placeholder="Cole o token"
                          value={serverToken}
                          onChange={(e) => setServerToken(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Sinal</Label>
                        <Select
                          value={validationSignalId || (testReport.signals[0]?.nodeId || '')}
                          onValueChange={(val) => setValidationSignalId(val)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Selecione um sinal" />
                          </SelectTrigger>
                          <SelectContent>
                            {testReport.signals.map((s) => (
                              <SelectItem key={s.nodeId} value={s.nodeId}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px]">Resultado</Label>
                        <Select
                          value={validationResult}
                          onValueChange={(val) => setValidationResult(val as 'hit' | 'miss')}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                  <SelectItem value="hit">acerto</SelectItem>
                  <SelectItem value="miss">erro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px]">Número vencedor (0-36)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={36}
                          value={validationWinningNumber}
                          onChange={(e) => {
                            const v = e.target.value
                            setValidationWinningNumber(v === '' ? '' : Math.max(0, Math.min(36, Number(v))))
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Pagamento líquido (opcional)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={validationNetPayout}
                          onChange={(e) => {
                            const v = e.target.value
                            setValidationNetPayout(v === '' ? '' : Number(v))
                          }}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={validateSignalOnServer} disabled={isValidatingServer || !serverToken || (testReport.signals.length === 0)}>
                          {isValidatingServer ? 'Validando...' : 'Validar no servidor'}
                        </Button>
                      </div>
                    </div>
                    {serverValidationResponse ? (
                      <div className="text-xs">
                        {serverValidationResponse.ok ? (
                          <div>
                            <div>Servidor: OK ({serverValidationResponse.status})</div>
                            <pre className="text-[10px] bg-muted p-2 rounded overflow-x-auto">{JSON.stringify(serverValidationResponse.data, null, 2)}</pre>
                          </div>
                        ) : (
                          <div>
                            <div>Servidor: Falha ({serverValidationResponse.status})</div>
                            <div className="text-destructive">{serverValidationResponse.error}</div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="logs">
                  <AccordionTrigger>Logs da execução</AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="h-48">
                      <ul className="text-sm space-y-1">
                        {testReport.logs.map((l) => (
                          <li key={`${l.step}-${l.nodeId}`}>
                            <code>#{l.step}</code> &bull; <strong>{l.label}</strong> &bull; {l.action}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </>
          )}
        </div>
        <DialogFooter>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportTestReport}>
              <Download className="mr-2 h-4 w-4" /> Exportar relatório (.json)
            </Button>
            <Button onClick={() => setIsTestReportOpen(false)}>Fechar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
      </div>
    </DashboardLayout>
  )
}


