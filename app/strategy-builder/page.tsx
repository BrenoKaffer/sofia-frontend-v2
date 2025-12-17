"use client"
import React, { useEffect, useState } from 'react'
import { listStrategies, createStrategy, updateConfig, toggleStrategy, deleteStrategy, exportConfig, PriorityString, ConfidenceString } from '../../lib/builderApi'

interface StrategyItem {
  filename?: string
  name: string
  description?: string
  category?: string
  enabled?: boolean
}

export default function StrategyBuilderPage() {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<StrategyItem[]>([])
  const [message, setMessage] = useState<string>('')

  // Create form
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<PriorityString>('medium')
  const [confidence, setConfidence] = useState<ConfidenceString>('Medium')

  // Update config form
  const [cfgName, setCfgName] = useState('')
  const [cfgEnabled, setCfgEnabled] = useState<boolean>(true)
  const [cfgPriority, setCfgPriority] = useState<number>(5)
  const [cfgConfidenceWeight, setCfgConfidenceWeight] = useState<number>(0.8)
  const [cfgMaxTables, setCfgMaxTables] = useState<number>(2)

  // Toggle form
  const [toggleName, setToggleName] = useState('')
  const [toggleEnabled, setToggleEnabled] = useState<boolean>(true)

  // Delete form
  const [delFilename, setDelFilename] = useState('')

  async function refresh() {
    setLoading(true)
    try {
      const data = await listStrategies()
      const items = (data?.data?.loaded_strategies || []) as StrategyItem[]
      setList(items)
      setMessage('Lista atualizada')
    } catch (err: any) {
      setMessage(`Erro ao listar: ${err?.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await createStrategy({ name, description, priority, confidence })
      setMessage('Estratégia criada com sucesso')
      setName('')
      setDescription('')
      refresh()
    } catch (err: any) {
      setMessage(`Falha ao criar: ${err?.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  async function onUpdateCfg(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await updateConfig(cfgName, {
        enabled: cfgEnabled,
        priority: cfgPriority,
        confidence_weight: cfgConfidenceWeight,
        max_tables: cfgMaxTables,
      })
      setMessage('Configuração atualizada com sucesso')
      refresh()
    } catch (err: any) {
      setMessage(`Falha ao atualizar: ${err?.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  async function onToggle(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await toggleStrategy(toggleName, toggleEnabled, 'UI toggle')
      setMessage('Alternância aplicada com sucesso')
      refresh()
    } catch (err: any) {
      setMessage(`Falha ao alternar: ${err?.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  async function onDelete(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await deleteStrategy(delFilename)
      setMessage('Estratégia removida com sucesso')
      setDelFilename('')
      refresh()
    } catch (err: any) {
      setMessage(`Falha ao remover: ${err?.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  async function onExport() {
    setLoading(true)
    setMessage('')
    try {
      const result = await exportConfig()
      setMessage(`Export OK: ${JSON.stringify(result?.data || result).slice(0, 200)}...`)
    } catch (err: any) {
      setMessage(`Falha ao exportar: ${err?.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Strategy Builder</h1>
      {loading && <p>Carregando...</p>}
      {message && <p>{message}</p>}

      <section>
        <h2>Lista</h2>
        <button onClick={refresh}>Atualizar</button>
        <ul>
          {list.map((s, i) => (
            <li key={i}>
              <strong>{s.name}</strong> ({s.filename}) — {s.enabled ? 'Ativa' : 'Pausada'}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Criar Estratégia</h2>
        <form onSubmit={onCreate}>
          <input placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />
          <input placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} />
          <label>
            Prioridade
            <select value={priority} onChange={e => setPriority(e.target.value as any)}>
              <option value="very_low">very_low</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="very_high">very_high</option>
            </select>
          </label>
          <label>
            Confiança
            <select value={confidence} onChange={e => setConfidence(e.target.value as any)}>
              <option value="Very Low">Very Low</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Very High">Very High</option>
            </select>
          </label>
          <button type="submit">Criar</button>
        </form>
      </section>

      <section>
        <h2>Atualizar Configuração</h2>
        <form onSubmit={onUpdateCfg}>
          <input placeholder="Nome da estratégia" value={cfgName} onChange={e => setCfgName(e.target.value)} />
          <label>
            Enabled
            <input type="checkbox" checked={cfgEnabled} onChange={e => setCfgEnabled(e.target.checked)} />
          </label>
          <label>
            Priority (1-10)
            <input type="number" min={1} max={10} value={cfgPriority} onChange={e => setCfgPriority(Number(e.target.value))} />
          </label>
          <label>
            Confidence Weight (0.1-5)
            <input type="number" step="0.1" min={0.1} max={5} value={cfgConfidenceWeight} onChange={e => setCfgConfidenceWeight(Number(e.target.value))} />
          </label>
          <label>
            Max Tables (1-1000)
            <input type="number" min={1} max={1000} value={cfgMaxTables} onChange={e => setCfgMaxTables(Number(e.target.value))} />
          </label>
          <button type="submit">Salvar Config</button>
        </form>
      </section>

      <section>
        <h2>Alternar Estratégia</h2>
        <form onSubmit={onToggle}>
          <input placeholder="Nome" value={toggleName} onChange={e => setToggleName(e.target.value)} />
          <label>
            Enabled
            <input type="checkbox" checked={toggleEnabled} onChange={e => setToggleEnabled(e.target.checked)} />
          </label>
          <button type="submit">Alternar</button>
        </form>
      </section>

      <section>
        <h2>Remover Estratégia</h2>
        <form onSubmit={onDelete}>
          <input placeholder="Arquivo .js" value={delFilename} onChange={e => setDelFilename(e.target.value)} />
          <button type="submit">Remover</button>
        </form>
      </section>

      <section>
        <h2>Exportar Configuração</h2>
        <button onClick={onExport}>Exportar</button>
      </section>
    </div>
  )
}