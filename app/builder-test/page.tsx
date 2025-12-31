"use client"
import React, { useMemo, useState } from "react"

// Config mínimo baseado no JSON fornecido
const pageConfig = {
  title: "Builder de Estratégias",
  description: "Crie e edite suas estratégias definindo condições de satisfação baseadas no histórico de roleta.",
  tabs: ["Estratégias", "Templates", "Performance"],
  builder: {
    toolbox: {
      categories: [
        {
          name: "Gatilhos",
          nodes: [
            {
              type: "trigger" as const,
              label: "Analisar Janela",
              defaultConfig: { janela: 30 },
            },
          ],
        },
        {
          name: "Condições",
          nodes: [
            { type: "condition" as const, subtype: "repetition" as const, label: "Repetição de Evento", defaultConfig: { evento: "vermelho", ocorrencias: 3 } },
            { type: "condition" as const, subtype: "absence" as const, label: "Ausência de Evento", defaultConfig: { evento: "zero", rodadasSemOcorrer: 40 } },
            { type: "condition" as const, subtype: "trend" as const, label: "Tendência/Frequência", defaultConfig: { evento: "vermelho", janela: 10, frequenciaMinima: 0.7 } },
            { type: "condition" as const, subtype: "pattern" as const, label: "Padrão Customizado", defaultConfig: { sequencia: ["vermelho", "preto", "vermelho"], modo: "exato" } },
            { type: "condition" as const, subtype: "break" as const, label: "Quebra de Padrão", defaultConfig: { evento: "cor", tamanhoSequencia: 6 } },
            { type: "condition" as const, subtype: "neighbors" as const, label: "Vizinhos / Setor", defaultConfig: { numeroBase: 17, alcanceVizinho: 2, frequencia: 3 } },
          ],
        },
        {
          name: "Lógica",
          nodes: [
            { type: "logic" as const, label: "Operador Lógico", defaultConfig: { operador: "AND" } },
          ],
        },
        {
          name: "Sinal",
          nodes: [
            { type: "signal" as const, label: "Gerar Sinal", defaultConfig: { acao: "emitir_sinal", mensagem: "Condição satisfeita", prioridade: "normal" } },
          ],
        },
      ],
    },
    fieldsByType: {
      trigger: [
        { label: "Janela de Análise", type: "number", key: "janela" },
      ],
      "condition:repetition": [
        { label: "Evento", type: "select", key: "evento", options: ["vermelho", "preto", "par", "ímpar", "zero"] },
        { label: "Ocorrências", type: "number", key: "ocorrencias" },
      ],
      "condition:absence": [
        { label: "Evento", type: "select", key: "evento", options: ["zero", "vermelho", "preto"] },
        { label: "Rodadas sem ocorrer", type: "number", key: "rodadasSemOcorrer" },
      ],
      "condition:trend": [
        { label: "Evento", type: "select", key: "evento", options: ["vermelho", "preto", "par", "ímpar"] },
        { label: "Janela de análise", type: "number", key: "janela" },
        { label: "Frequência mínima", type: "slider", key: "frequenciaMinima", min: 0, max: 1, step: 0.05 },
      ],
      "condition:pattern": [
        { label: "Sequência", type: "array", key: "sequencia" },
        { label: "Modo", type: "select", key: "modo", options: ["exato", "parcial"] },
      ],
      logic: [
        { label: "Operador", type: "select", key: "operador", options: ["AND", "OR", "NOT"] },
      ],
      signal: [
        { label: "Ação", type: "select", key: "acao", options: ["emitir_sinal", "notificar", "apostar"] },
        { label: "Mensagem", type: "text", key: "mensagem" },
        { label: "Prioridade", type: "select", key: "prioridade", options: ["normal", "alta", "baixa"] },
      ],
    },
  },
}

type NodeType = "trigger" | "condition" | "logic" | "signal"
type ConditionSubtype = "repetition" | "absence" | "trend" | "pattern" | "break" | "neighbors"

type StrategyNode = {
  id: string
  type: NodeType
  subtype?: ConditionSubtype
  data: { label: string; config: Record<string, any> }
}

type Strategy = {
  id: string
  name: string
  status: "active" | "paused" | "draft" | "testing"
  nodes: StrategyNode[]
}

function rid() {
  // Gera um id simples
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2)
}

export default function BuilderTestPage() {
  const [activeTab, setActiveTab] = useState(pageConfig.tabs[0])
  const [isBuilderOpen, setBuilderOpen] = useState(false)
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const nodeTemplates = useMemo(() => {
    return pageConfig.builder.toolbox.categories.flatMap((cat) =>
      cat.nodes.map((n) => ({ ...n, category: cat.name }))
    )
  }, [])

  const selectedNode = useMemo(
    () => strategy?.nodes.find((n) => n.id === selectedNodeId) || null,
    [strategy, selectedNodeId]
  )

  function createNewStrategy() {
    setStrategy({ id: rid(), name: "Nova Estratégia", status: "draft", nodes: [] })
    setSelectedNodeId(null)
    setBuilderOpen(true)
  }

  function addNode(tpl: any) {
    if (!strategy) return
    const node: StrategyNode = {
      id: rid(),
      type: tpl.type,
      subtype: tpl.subtype,
      data: { label: tpl.label, config: { ...(tpl.defaultConfig || {}) } },
    }
    setStrategy({ ...strategy, nodes: [...strategy.nodes, node] })
    setSelectedNodeId(node.id)
  }

  function updateNode(id: string, changes: Partial<StrategyNode>) {
    if (!strategy) return
    setStrategy({
      ...strategy,
      nodes: strategy.nodes.map((n) => (n.id === id ? { ...n, ...changes, data: { ...n.data, ...(changes.data || {}) } } : n)),
    })
  }

  function testStrategy() {
    console.log("Teste de estratégia", strategy)
    alert("Teste disparado. Veja console para detalhes.")
  }

  function saveStrategy() {
    if (!strategy) return
    try {
      const key = "builder-test-strategies"
      const existing = JSON.parse(localStorage.getItem(key) || "[]")
      existing.push(strategy)
      localStorage.setItem(key, JSON.stringify(existing))
      alert("Estratégia salva (localStorage)")
      setBuilderOpen(false)
    } catch (e) {
      console.error(e)
      alert("Falha ao salvar")
    }
  }

  const fields = useMemo(() => {
    if (!selectedNode) return [] as any[]
    const key = selectedNode.type === "condition" && selectedNode.subtype ? `condition:${selectedNode.subtype}` : selectedNode.type
    return (pageConfig.builder.fieldsByType as any)[key] || []
  }, [selectedNode])

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{pageConfig.title}</h1>
          <p className="text-sm text-gray-600">{pageConfig.description}</p>
        </div>
        <button
          className="px-3 py-2 rounded bg-blue-600 text-white"
          onClick={createNewStrategy}
        >
          Nova Estratégia
        </button>
      </header>

      <nav className="flex gap-2 border-b pb-2">
        {pageConfig.tabs.map((tab) => (
          <button
            key={tab}
            className={`px-3 py-1 rounded ${activeTab === tab ? "bg-gray-200" : "hover:bg-gray-100"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <section>
        {activeTab === "Estratégias" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Lista de Estratégias (placeholder)</span>
              <div className="flex gap-2 text-sm">
                <button className="px-2 py-1 rounded border">Editar</button>
                <button className="px-2 py-1 rounded border">Excluir</button>
                <button className="px-2 py-1 rounded border">Ativar</button>
              </div>
            </div>
            <div className="rounded border p-3 text-sm text-gray-600">Nenhuma estratégia carregada. Use "Nova Estratégia".</div>
          </div>
        )}
        {activeTab === "Templates" && (
          <div className="space-y-2">
            <span className="font-medium">Templates disponíveis</span>
            <div className="grid grid-cols-2 gap-2">
              {nodeTemplates.map((tpl: any) => (
                <div key={tpl.label} className="rounded border p-2">
                  <div className="text-sm font-medium">{tpl.label}</div>
                  <div className="text-xs text-gray-600">{tpl.category}</div>
                  <button className="mt-2 px-2 py-1 rounded bg-gray-100" onClick={() => createNewStrategy()}>Usar template</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "Performance" && (
          <div className="space-y-2">
            <span className="font-medium">Métricas (placeholder)</span>
            <div className="rounded border p-3 text-sm text-gray-600">KPIs e top estratégias aqui.</div>
          </div>
        )}
      </section>

      {isBuilderOpen && strategy && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white w-[95vw] h-[85vh] rounded shadow flex flex-col">
            <div className="p-3 border-b flex items-center justify-between">
              <div className="font-medium">Builder: {strategy.name}</div>
              <button className="text-sm px-2 py-1 rounded border" onClick={() => setBuilderOpen(false)}>Fechar</button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              {/* Toolbox */}
              <div className="w-64 border-r p-3 overflow-auto">
                <div className="font-medium mb-2">Componentes</div>
                {pageConfig.builder.toolbox.categories.map((cat) => (
                  <div key={cat.name} className="mb-4">
                    <div className="text-sm font-semibold">{cat.name}</div>
                    <div className="mt-2 space-y-2">
                      {cat.nodes.map((n) => (
                        <button
                          key={n.label}
                          className="w-full text-left px-2 py-1 rounded border hover:bg-gray-50"
                          onClick={() => addNode(n)}
                        >
                          {n.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Canvas */}
              <div className="flex-1 p-3 overflow-auto">
                <div className="text-sm text-gray-600">Arraste componentes da Toolbox para começar a montar sua estratégia (aqui, clique para adicionar).</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                  {strategy.nodes.map((n) => (
                    <div key={n.id} className={`rounded border p-2 cursor-pointer ${selectedNodeId === n.id ? "border-blue-600" : ""}`} onClick={() => setSelectedNodeId(n.id)}>
                      <div className="text-sm font-medium">{n.data.label}</div>
                      <div className="text-xs text-gray-600">{n.type}{n.subtype ? `:${n.subtype}` : ""}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Properties */}
              <div className="w-80 border-l p-3 overflow-auto">
                <div className="font-medium">Propriedades do Nó</div>
                {!selectedNode && (
                  <div className="text-sm text-gray-600 mt-2">Selecione um nó no canvas.</div>
                )}
                {selectedNode && (
                  <div className="mt-2 space-y-3">
                    <div>
                      <div className="text-xs text-gray-600">Tipo</div>
                      <div className="text-sm">{selectedNode.type}{selectedNode.subtype ? `:${selectedNode.subtype}` : ""}</div>
                    </div>
                    {fields.map((f: any) => (
                      <div key={f.key} className="space-y-1">
                        <label className="text-xs">{f.label}</label>
                        {f.type === "number" && (
                          <input
                            type="number"
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={Number(selectedNode.data.config[f.key] ?? 0)}
                            onChange={(e) => updateNode(selectedNode.id, { data: { config: { ...selectedNode.data.config, [f.key]: Number(e.target.value) } } } as any)}
                          />
                        )}
                        {f.type === "text" && (
                          <input
                            type="text"
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={String(selectedNode.data.config[f.key] ?? "")}
                            onChange={(e) => updateNode(selectedNode.id, { data: { config: { ...selectedNode.data.config, [f.key]: e.target.value } } } as any)}
                          />
                        )}
                        {f.type === "select" && (
                          <select
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={String(selectedNode.data.config[f.key] ?? "")}
                            onChange={(e) => updateNode(selectedNode.id, { data: { config: { ...selectedNode.data.config, [f.key]: e.target.value } } } as any)}
                          >
                            {(f.options || []).map((opt: any) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                        {f.type === "slider" && (
                          <input
                            type="range"
                            className="w-full"
                            min={f.min}
                            max={f.max}
                            step={f.step}
                            value={Number(selectedNode.data.config[f.key] ?? 0)}
                            onChange={(e) => updateNode(selectedNode.id, { data: { config: { ...selectedNode.data.config, [f.key]: Number(e.target.value) } } } as any)}
                          />
                        )}
                        {f.type === "array" && (
                          <input
                            type="text"
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={(selectedNode.data.config[f.key] || []).join(", ")}
                            onChange={(e) => updateNode(selectedNode.id, { data: { config: { ...selectedNode.data.config, [f.key]: e.target.value.split(",").map(s => s.trim()) } } } as any)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 border-t flex items-center gap-2 justify-end">
              <button className="px-3 py-2 rounded border" onClick={testStrategy}>Testar Estratégia</button>
              <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={saveStrategy}>Salvar</button>
              <button className="px-3 py-2 rounded border" onClick={() => setBuilderOpen(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
