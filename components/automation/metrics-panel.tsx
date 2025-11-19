import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Activity, BarChart3, Cpu, Database, Gauge } from 'lucide-react'
import type { AutomationMetrics } from '@/hooks/useAutomation'

function fmt(n: any, digits = 2) {
  const num = Number(n)
  if (!Number.isFinite(num)) return '0.00'
  try { return num.toFixed(digits) } catch { return String(num) }
}

function pct(n: any) {
  const num = Number(n)
  return Number.isFinite(num) ? Math.max(0, Math.min(100, num)) : 0
}

export function MetricsPanel({ metrics }: { metrics: AutomationMetrics }) {
  const sr = pct(metrics?.successRate)
  const cpu = pct(metrics?.cpuUsage)
  const mem = pct(metrics?.memoryUsage)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
          <Activity className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">{fmt(sr, 0)}%</div>
            <div className="text-sm text-muted-foreground">em tempo real</div>
          </div>
          <Progress value={sr} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Apostas Totais</CardTitle>
          <BarChart3 className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{fmt(metrics?.totalBets, 0)}</div>
          <p className="text-xs text-muted-foreground mt-1">Fila: {fmt(metrics?.queueSize, 0)} | Avg RT: {fmt(metrics?.avgResponseTime, 0)}ms</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
          <Gauge className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {fmt(metrics?.totalProfit, 2)}</div>
          <p className="text-xs text-muted-foreground mt-1">Uptime: {metrics?.systemUptime || '00:00:00'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CPU</CardTitle>
          <Cpu className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">{fmt(cpu, 0)}%</div>
            <div className="text-sm text-muted-foreground">utilização</div>
          </div>
          <Progress value={cpu} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Memória</CardTitle>
          <Database className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">{fmt(mem, 0)}%</div>
            <div className="text-sm text-muted-foreground">utilização</div>
          </div>
          <Progress value={mem} className="mt-2" />
        </CardContent>
      </Card>
    </div>
  )
}