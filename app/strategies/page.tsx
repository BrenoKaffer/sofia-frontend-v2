'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2, Save, RotateCcw, Settings, Target, Table, BookOpen } from 'lucide-react'
import { StrategyFilter } from '@/components/dashboard/strategy-filter'
import { StrategyGrid } from '@/components/dashboard/strategy-grid'
import { apiClient } from '@/lib/api-client'

interface Strategy {
  id: string
  name: string
  enabled: boolean
}

interface StrategyDescription {
  name: string
  description: string
  logic: string
  focus: string
  risk: string
  recommendedChips: string
  category: string
}

interface FilterState {
  search: string
  category: string
  risk: string
  chips: string
}

interface RouletteTable {
  id: string
  name: string
  enabled: boolean
}

interface UserPreferences {
  strategies: string[]
  tables: string[]
}

interface AvailableOptions {
  strategies: string[]
  tables: { id: string; name: string }[]
  default_preferences: UserPreferences
}

export default function EstrategiasAtivas() {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [tables, setTables] = useState<RouletteTable[]>([])
  const [strategyDescriptions, setStrategyDescriptions] = useState<StrategyDescription[]>([])
  const [filteredDescriptions, setFilteredDescriptions] = useState<StrategyDescription[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [descriptionsLoading, setDescriptionsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('active')
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    risk: '',
    chips: ''
  })

  // Carregar opções disponíveis e preferências do usuário
  useEffect(() => {
    loadData()
  }, [])

  // Carregar descrições de estratégias quando a aba for ativada
  useEffect(() => {
    if (activeTab === 'descriptions' && strategyDescriptions.length === 0) {
      loadStrategyDescriptions()
    }
  }, [activeTab])

  // Aplicar filtros nas descrições
  useEffect(() => {
    applyFilters()
  }, [strategyDescriptions, filters])

  const loadStrategyDescriptions = async () => {
    try {
      setDescriptionsLoading(true)
      const response = await apiClient.getStrategyDescriptions()
      
      if (response.data && Array.isArray((response.data as any).strategies)) {
        setStrategyDescriptions((response.data as any).strategies)
        setCategories((response.data as any).categories || [])
      } else if (response.data && Array.isArray(response.data)) {
        // Caso a resposta seja diretamente um array de estratégias
        setStrategyDescriptions(response.data as StrategyDescription[])
      }
    } catch (error) {
      toast.error('Erro ao carregar descrições de estratégias')
    } finally {
      setDescriptionsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...strategyDescriptions]

    // Filtro por busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(strategy => 
        strategy.name.toLowerCase().includes(searchLower) ||
        strategy.description.toLowerCase().includes(searchLower) ||
        strategy.focus.toLowerCase().includes(searchLower)
      )
    }

    // Filtro por categoria
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(strategy => strategy.category === filters.category)
    }

    // Filtro por risco
    if (filters.risk && filters.risk !== 'all') {
      filtered = filtered.filter(strategy => strategy.risk === filters.risk)
    }

    // Filtro por fichas
    if (filters.chips && filters.chips !== 'all') {
      filtered = filtered.filter(strategy => strategy.recommendedChips === filters.chips)
    }

    setFilteredDescriptions(filtered)
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Buscar opções disponíveis e preferências do usuário
      const [availableResponse, preferencesResponse] = await Promise.all([
        fetch('/api/available-options'),
        fetch('/api/user-preferences')
      ])

      let availableOptions: AvailableOptions
      let userPreferences: UserPreferences | null = null

      if (availableResponse.ok) {
        availableOptions = await availableResponse.json()
      } else {
        // Fallback para dados padrão se a API não estiver disponível
        availableOptions = {
          strategies: [
            'Irmãos de Cores',
            'Terminais Pull',
            'Espelho',
            'Onda',
            'As Dúzias (Atrasadas)',
            'Terminais que se Puxam',
            'Os Opostos',
            'Cavalo/Linha',
            'Sequência de Números',
            'Padrão Fibonacci'
          ],
          tables: [],
          default_preferences: {
            strategies: [],
            tables: []
          }
        }
        
        // Buscar mesas de roleta da API real
        try {
          const tablesResponse = await fetch('/api/roulette-tables')
          
          if (tablesResponse.ok) {
            const tablesData = await tablesResponse.json()
            availableOptions.tables = tablesData.map((table: any) => ({
              id: table.id,
              name: table.name
            }))
          }
        } catch (error) {
          // Erro silencioso - mesas serão carregadas do fallback
        }
      }

      if (preferencesResponse.ok) {
        userPreferences = await preferencesResponse.json()
      }

      // Se não há preferências do usuário, usar preferências padrão
      if (!userPreferences) {
        userPreferences = availableOptions.default_preferences
      }

      // Configurar estratégias com estado baseado nas preferências
      const strategiesWithState: Strategy[] = availableOptions.strategies.map(strategyName => ({
        id: strategyName,
        name: strategyName,
        enabled: userPreferences?.strategies.includes(strategyName) ?? true
      }))

      // Configurar mesas com estado baseado nas preferências
      // Mostrar TODAS as mesas disponíveis, não apenas as que estão nas preferências
      const tablesWithState: RouletteTable[] = availableOptions.tables.map(table => ({
        id: table.id,
        name: table.name,
        enabled: userPreferences?.tables.includes(table.id) ?? false // Padrão false para mostrar que não estão sendo monitoradas
      }))

      // Ordenar mesas: ativas por padrão primeiro, depois as outras
      const defaultTables = availableOptions.default_preferences.tables
      tablesWithState.sort((a, b) => {
        const aIsDefault = defaultTables.includes(a.id)
        const bIsDefault = defaultTables.includes(b.id)
        
        if (aIsDefault && !bIsDefault) return -1
        if (!aIsDefault && bIsDefault) return 1
        return a.name.localeCompare(b.name)
      })

      setStrategies(strategiesWithState)
      setTables(tablesWithState)
      setHasChanges(false)
    } catch (error) {
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const toggleStrategy = (strategyId: string) => {
    setStrategies(prev => 
      prev.map(strategy => 
        strategy.id === strategyId 
          ? { ...strategy, enabled: !strategy.enabled }
          : strategy
      )
    )
    setHasChanges(true)
  }

  const toggleTable = (tableId: string) => {
    setTables(prev => 
      prev.map(table => 
        table.id === tableId 
          ? { ...table, enabled: !table.enabled }
          : table
      )
    )
    setHasChanges(true)
  }

  const savePreferences = async () => {
    try {
      setSaving(true)
      
      const preferences: UserPreferences = {
        strategies: strategies.filter(s => s.enabled).map(s => s.id),
        tables: tables.filter(t => t.enabled).map(t => t.id)
      }

      const response = await fetch('/api/user-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
      })

      if (response.ok) {
        setHasChanges(false)
        toast.success('Configurações salvas com sucesso!')
      } else {
        throw new Error('Falha ao salvar preferências')
      }
    } catch (error) {
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = async () => {
    try {
      // Buscar preferências padrão curadas da API
      const response = await fetch('/api/available-options')

      if (response.ok) {
        const data = await response.json()
        const defaultPreferences = data.default_preferences

        // Restaurar estratégias baseadas no padrão curado
        setStrategies(prev => 
          prev.map(strategy => ({
            ...strategy,
            enabled: defaultPreferences.strategies.includes(strategy.id)
          }))
        )

        // Restaurar mesas baseadas no padrão curado
        setTables(prev => 
          prev.map(table => ({
            ...table,
            enabled: defaultPreferences.tables.includes(table.id)
          }))
        )

        setHasChanges(true)
        toast.info('Configurações restauradas para o padrão curado')
      } else {
        throw new Error('Falha ao buscar configurações padrão')
      }
    } catch (error) {
      toast.error('Erro ao restaurar configurações padrão')
    }
  }

  const enabledStrategiesCount = strategies.filter(s => s.enabled).length
  const enabledTablesCount = tables.filter(t => t.enabled).length

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Carregando configurações...</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Estratégias
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas estratégias ativas e explore descrições detalhadas
            </p>
          </div>
          
          {activeTab === 'active' && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={resetToDefaults}
                disabled={saving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restaurar Padrão
              </Button>
              
              <Button
                onClick={savePreferences}
                disabled={!hasChanges || saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Configurações
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Estratégias Ativas
            </TabsTrigger>
            <TabsTrigger value="descriptions" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Descrições de Estratégias
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estratégias Ativas</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enabledStrategiesCount}</div>
              <p className="text-xs text-muted-foreground">
                de {strategies.length} disponíveis
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mesas Monitoradas</CardTitle>
              <Table className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enabledTablesCount}</div>
              <p className="text-xs text-muted-foreground">
                de {tables.length} disponíveis
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Estratégias Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Estratégias Disponíveis
            </CardTitle>
            <CardDescription>
              Selecione quais estratégias você deseja que a SOFIA monitore e analise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {strategies.map((strategy) => (
                <div
                  key={strategy.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={strategy.enabled}
                      onCheckedChange={() => toggleStrategy(strategy.id)}
                    />
                    <div>
                      <p className="font-medium">{strategy.name}</p>
                      <Badge variant={strategy.enabled ? "default" : "secondary"} className="text-xs">
                        {strategy.enabled ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Mesas de Roleta Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              Mesas de Roleta
            </CardTitle>
            <CardDescription>
              Escolha quais mesas de roleta você deseja monitorar para receber os padrões encontrados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={table.enabled}
                      onCheckedChange={() => toggleTable(table.id)}
                    />
                    <div>
                      <p className="font-medium">{table.name}</p>
                      <p className="text-sm text-muted-foreground">{table.id}</p>
                      <Badge variant={table.enabled ? "default" : "secondary"} className="text-xs">
                        {table.enabled ? "Monitorada" : "Inativa"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

            {/* Warning Message */}
            {hasChanges && (
              <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2 text-orange-800 dark:text-orange-200">
                    <Settings className="h-4 w-4" />
                    <p className="text-sm font-medium">
                      Você tem alterações não salvas. Clique em &quot;Salvar Configurações&quot; para aplicar as mudanças.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="descriptions" className="space-y-6">
            {/* Filtros */}
            <StrategyFilter
              categories={categories}
              onFilterChange={handleFilterChange}
              totalStrategies={strategyDescriptions.length}
              filteredCount={filteredDescriptions.length}
            />

            {/* Grid de Estratégias */}
            <StrategyGrid
              strategies={filteredDescriptions}
              loading={descriptionsLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
   )
}