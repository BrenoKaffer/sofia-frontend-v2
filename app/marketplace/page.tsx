'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { NetflixTopBar } from '@/components/layout/netflix-top-bar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Download, RefreshCw, Search, Puzzle } from 'lucide-react'

type TemplateRow = {
  id: string
  user_id: string
  name: string
  description: string | null
  builder_payload: any
  is_published: boolean
  published_strategy_slug: string | null
  created_at?: string
  updated_at?: string
}

type StrategyTemplateFile = {
  type: 'sofia_strategy_template'
  schemaVersion: string
  templateId?: string
  name: string
  description?: string
  author?: { displayName: string; contact?: string }
  tags?: string[]
  metadata?: Record<string, any>
  graph: {
    schemaVersion: string
    nodes: any[]
    connections: any[]
    selectionMode?: 'automatic' | 'hybrid' | 'manual'
    gating?: { enabled: boolean } | undefined
  }
  createdAt?: string
  updatedAt?: string
}

function getTemplateMeta(tpl: TemplateRow): any {
  const payload = tpl?.builder_payload
  const meta = payload && typeof payload === 'object' ? payload.metadata : null
  return meta && typeof meta === 'object' ? meta : null
}

function getAuthorName(tpl: TemplateRow): string {
  if (String(tpl?.user_id || '') === 'system') return 'SOFIA'
  const meta = getTemplateMeta(tpl)
  const display = String(meta?.author?.displayName || '').trim()
  return display || 'Comunidade'
}

function getOriginLabel(tpl: TemplateRow): string {
  return String(tpl?.user_id || '') === 'system' ? 'Oficial' : 'Comunidade'
}

function downloadTemplateFile(tpl: TemplateRow) {
  try {
    const payload = tpl?.builder_payload && typeof tpl.builder_payload === 'object' ? tpl.builder_payload : {}
    const meta = getTemplateMeta(tpl) || {}

    const schemaVersion = String(payload.schemaVersion || '1.0.0')
    const nodes = Array.isArray(payload.nodes) ? payload.nodes : []
    const connections = Array.isArray(payload.connections) ? payload.connections : []

    const file: StrategyTemplateFile = {
      type: 'sofia_strategy_template',
      schemaVersion,
      templateId: String(tpl.id),
      name: String(tpl.name || 'Template'),
      description: tpl.description || undefined,
      author: meta?.author && typeof meta.author === 'object' ? meta.author : { displayName: getAuthorName(tpl) },
      tags: Array.isArray(meta?.tags) ? meta.tags : undefined,
      metadata: meta && typeof meta === 'object' ? meta : undefined,
      graph: {
        schemaVersion,
        nodes,
        connections,
        selectionMode: payload.selectionMode,
        gating: payload.gating
      },
      createdAt: tpl.created_at,
      updatedAt: tpl.updated_at
    }

    const json = JSON.stringify(file, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const safeName = String(tpl.name || 'template')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const a = document.createElement('a')
    a.href = url
    a.download = `sofia-template-${safeName}-${tpl.id}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch {
    toast.error('Falha ao baixar template')
  }
}

export default function MarketplacePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [query, setQuery] = useState('')

  async function load() {
    try {
      setLoading(true)
      const resp = await fetch('/api/dynamic-strategies/templates', { cache: 'no-store' })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok || !(data as any)?.ok) {
        toast.message('Falha ao carregar marketplace.', { description: String((data as any)?.error || resp.statusText) })
        setTemplates([])
        return
      }
      const list = Array.isArray((data as any)?.templates) ? ((data as any).templates as TemplateRow[]) : []
      setTemplates(list)
    } catch (e: any) {
      toast.message('Erro de rede ao carregar marketplace.', { description: e?.message || String(e) })
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const marketplaceTemplates = useMemo(() => {
    const q = String(query || '').trim().toLowerCase()
    const list = Array.isArray(templates) ? templates : []

    const published = list.filter(t => Boolean(t?.is_published))
    const onlySystem = published.filter(t => String(t?.user_id || '') === 'system')

    const filtered = q
      ? onlySystem.filter(t => {
          const name = String(t?.name || '').toLowerCase()
          const slug = String(t?.published_strategy_slug || '').toLowerCase()
          const author = String(getAuthorName(t) || '').toLowerCase()
          return name.includes(q) || slug.includes(q) || author.includes(q)
        })
      : onlySystem

    filtered.sort((a, b) => {
      const aDate = new Date(a?.updated_at || a?.created_at || 0).getTime()
      const bDate = new Date(b?.updated_at || b?.created_at || 0).getTime()
      return bDate - aDate
    })

    return filtered
  }, [templates, query])

  return (
    <div className="min-h-screen bg-black text-foreground pb-20 overflow-x-hidden">
      <NetflixTopBar />

      <div className="pt-24 px-4 md:px-12 lg:px-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-semibold">Marketplace de Estratégias</h1>
            <p className="text-sm text-muted-foreground">
              Explore templates oficiais e carregue no Builder com um clique.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome, autor ou slug..."
                className="pl-9 w-[320px] max-w-full"
              />
            </div>
            <Button variant="secondary" onClick={load} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando templates...</div>
        ) : marketplaceTemplates.length === 0 ? (
          <div className="p-4 border rounded-md bg-muted/10">
            <div className="text-sm font-medium mb-1">Nenhum template encontrado</div>
            <div className="text-xs text-muted-foreground">Tente ajustar a busca ou atualize a lista.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {marketplaceTemplates.map((tpl) => {
              const origin = getOriginLabel(tpl)
              const author = getAuthorName(tpl)
              const slug = String(tpl.published_strategy_slug || '').trim()

              return (
                <Card key={tpl.id} className="bg-card/40 backdrop-blur-sm border-white/10">
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{tpl.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {tpl.description || 'Template de estratégia'}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge variant="outline" className="border-white/20">
                          {origin}
                        </Badge>
                        <Badge variant="secondary">{author}</Badge>
                      </div>
                    </div>

                    {slug ? (
                      <div className="text-xs text-muted-foreground">
                        Slug: <span className="text-foreground">{slug}</span>
                      </div>
                    ) : null}
                  </CardHeader>

                  <CardContent className="flex items-center justify-between gap-2">
                    <Button onClick={() => router.push(`/builder?templateId=${encodeURIComponent(tpl.id)}`)}>
                      <Puzzle className="mr-2 h-4 w-4" />
                      Usar no Builder
                    </Button>
                    <Button variant="outline" onClick={() => downloadTemplateFile(tpl)}>
                      <Download className="mr-2 h-4 w-4" />
                      Baixar JSON
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

