// Configuração da página Builder de Estratégias baseada no JSON de Prompts/Json

// Versão atual do schema de estratégias
export const CURRENT_SCHEMA_VERSION = '1.0.0'

export type FieldType = 'number' | 'select' | 'slider' | 'array' | 'text' | 'checkbox'

export interface FieldSpec {
  label: string
  type: FieldType
  key?: string
  options?: string[]
  min?: number
  max?: number
  step?: number
}

export interface BuilderSpec {
  page: {
    route: string
    title: string
    description: string
  }
  layout: {
    type: string
    sections: {
      header: {
        elements: Array<
          | { type: 'title'; value: string }
          | { type: 'button'; label: string; action: string }
          | { type: 'tabs'; options: string[] }
        >
      }
      content: {
        tabs: {
          strategies: { components: string[] }
          templates: { components: string[] }
          performance: { components: string[] }
        }
      }
    }
  }
  builderModal: {
    visibleState: string
    columns: {
      toolbox: {
        width: number
        title: string
        categories: {
          name: string
          nodes: Array<{
            type: 'trigger' | 'condition' | 'logic' | 'signal'
            subtype?: string
            label: string
            description: string
            defaultConfig?: Record<string, any>
          }>
        }[]
      }
      canvas: {
        type: string
        description: string
        supportsDragAndDrop: boolean
        nodeTypes: Array<'trigger' | 'condition' | 'logic' | 'signal'>
        exampleFlow: string[]
        emptyStateText: string
      }
      propertiesPanel: {
        width: number
        title: string
        visibleWhen: string
        fieldsByType: Record<string, FieldSpec[]>
      }
    }
    footer: {
      buttons: { label: string; action: string; icon: string }[]
    }
  }
  strategySchema: any
}

export const builderSpec: BuilderSpec = {
  page: {
    route: '/builder',
    title: 'Builder de Estratégias',
    description: 'Crie e edite suas estratégias definindo condições de satisfação baseadas no histórico de roleta.'
  },
  layout: {
    type: 'DashboardLayout',
    sections: {
      header: {
        elements: [
          { type: 'title', value: 'Builder de Estratégias' },
          { type: 'button', label: 'Nova Estratégia', action: 'createNewStrategy' },
          { type: 'tabs', options: ['Estratégias', 'Templates', 'Performance'] }
        ]
      },
      content: {
        tabs: {
          strategies: {
            components: ['StrategyList', 'StatusCard', 'EditButton', 'DeleteButton', 'ActivateButton']
          },
          templates: {
            components: ['TemplateList', 'UseTemplateButton']
          },
          performance: {
            components: ['MetricsCards', 'TopStrategiesList']
          }
        }
      }
    }
  },
  builderModal: {
    visibleState: 'isBuilderOpen',
    columns: {
      toolbox: {
        width: 64,
        title: 'Componentes',
        categories: [
          {
            name: 'Gatilhos',
            nodes: [
              {
                type: 'trigger',
                label: 'Analisar Janela',
                description: 'Define quantas rodadas o sistema usa para avaliar o histórico.',
                defaultConfig: { janela: 30 }
              }
            ]
          },
          {
            name: 'Condições',
            nodes: [
              {
                type: 'condition',
                subtype: 'absence',
                label: 'Ausência de Evento',
                description: 'Verifica se um evento está ausente há X rodadas.',
                defaultConfig: { evento: 'zero', rodadasSemOcorrer: 40 }
              },
              {
                type: 'condition',
                subtype: 'trend',
                label: 'Tendência/Frequência',
                description: 'Detecta concentração de um evento em uma janela de rodadas.',
                defaultConfig: { evento: 'vermelho', janela: 10, frequenciaMinima: 0.7 }
              },
              {
                type: 'condition',
                subtype: 'repetition',
                label: 'Repetição de Evento',
                description: 'Verifica se um evento (cor, número, setor) se repete N vezes seguidas.',
                defaultConfig: { evento: 'vermelho', ocorrencias: 3 }
              },
              {
                type: 'condition',
                subtype: 'neighbors',
                label: 'Vizinhos',
                description: 'Seleciona vizinhos ao redor de um número de referência (raio ±N na roda europeia).',
                defaultConfig: { numero: 17, raio: 2, includeZero: true }
              },
              {
                type: 'condition',
                subtype: 'mirror',
                label: 'Espelho',
                description: 'Deriva o oposto diametral do último número e seus vizinhos pelo raio.',
                defaultConfig: { raio: 1, includeZero: false }
              }
              ,
              {
                type: 'condition',
                subtype: 'specific-number',
                label: 'Número Específico',
                description: 'Inclui um número específico para a derivação do sinal.',
                defaultConfig: { numero: 0 }
              },
              {
                type: 'condition',
                subtype: 'alternation',
                label: 'Alternância',
                description: 'Prevê a próxima categoria por alternância (cor ou paridade).',
                defaultConfig: { eixo: 'cor' }
              },
              {
                type: 'condition',
                subtype: 'setorDominante',
                label: 'Setor Dominante',
                description: 'Seleciona um setor dominante (Voisins/Tiers/Orphelins) manual ou automaticamente.',
                defaultConfig: { setor: 'Voisins de Zero', auto: false, janela: 18, frequenciaMinima: 0 }
              },
              {
                type: 'condition',
                subtype: 'dozen_hot',
                label: 'Dúzias Quentes',
                description: 'Detecta dúzias com alta frequência em uma janela.',
                defaultConfig: { janela: 12, frequenciaMinima: 5 }
              },
              {
                type: 'condition',
                subtype: 'column_hot',
                label: 'Colunas Quentes',
                description: 'Detecta colunas com alta frequência em uma janela.',
                defaultConfig: { janela: 12, frequenciaMinima: 5 }
              },
              {
                type: 'condition',
                subtype: 'sequence_custom',
                label: 'Sequência Personalizada',
                description: 'Verifica correspondência com uma sequência definida e prevê o próximo.',
                defaultConfig: { sequencia: [1,2,3], tolerancia: 0 }
              }
            ]
          },
          {
            name: 'Lógica',
            nodes: [
              {
                type: 'logic',
                label: 'Operador Lógico',
                description: 'Combina condições com AND/OR/NOT.',
                defaultConfig: { operador: 'AND' }
              }
            ]
          },
          {
            name: 'Sinal',
            nodes: [
              {
                type: 'signal',
                label: 'Gerar Sinal',
                description: 'Define o que acontece quando as condições são satisfeitas.',
                defaultConfig: {
                  acao: 'emitir_sinal',
                  mensagem: 'Condição satisfeita',
                  prioridade: 'normal',
                  selectionMode: 'manual',
                  numeros: [],
                  stake: 1.0
                }
              }
            ]
          }
        ]
      },
      canvas: {
        type: 'StrategyCanvas',
        description: 'Área central para montar a lógica visualmente conectando os nós.',
        supportsDragAndDrop: true,
        nodeTypes: ['trigger', 'condition', 'logic', 'signal'],
        exampleFlow: ['Trigger  Condition  Condition  Logic (AND)  Signal'],
        emptyStateText: 'Arraste componentes da Toolbox para começar a montar sua estratégia.'
      },
      propertiesPanel: {
        width: 80,
        title: 'Propriedades do Nó',
        visibleWhen: 'selectedNode != null',
        fieldsByType: {
          'trigger': [
            { label: 'Janela de Análise', type: 'number', key: 'janela' }
          ],
          'condition:absence': [
            { label: 'Evento', type: 'select', options: ['zero', 'vermelho', 'preto', 'numero'], key: 'evento' },
            { label: 'Número alvo (0–36, opcional)', type: 'number', key: 'numeroAlvo' },
            { label: 'Rodadas sem ocorrer', type: 'number', key: 'rodadasSemOcorrer' }
          ],
          'condition:trend': [
            { label: 'Evento', type: 'select', options: ['vermelho', 'preto', 'par', 'ímpar'], key: 'evento' },
            { label: 'Janela de análise', type: 'number', key: 'janela' },
            { label: 'Frequência mínima', type: 'slider', min: 0, max: 1, step: 0.05, key: 'frequenciaMinima' }
          ],
          'condition:repetition': [
            { label: 'Evento', type: 'select', options: ['vermelho', 'preto', 'par', 'ímpar', 'zero'], key: 'evento' },
            { label: 'Ocorrências', type: 'number', key: 'ocorrencias' }
          ],
          'condition:neighbors': [
            { label: 'Número de referência (0–36)', type: 'number', key: 'numero' },
            { label: 'Raio (±N na roda)', type: 'number', key: 'raio' },
            { label: 'Incluir Zero', type: 'checkbox', key: 'includeZero' }
          ],
          'condition:mirror': [
            { label: 'Raio (±N na roda)', type: 'number', key: 'raio' },
            { label: 'Incluir Zero', type: 'checkbox', key: 'includeZero' }
          ],
          'condition:specific-number': [
            { label: 'Número (0–36)', type: 'number', key: 'numero' }
          ],
          'condition:alternation': [
            { label: 'Eixo', type: 'select', options: ['cor', 'paridade'], key: 'eixo' }
          ],
          'condition:setorDominante': [
            { label: 'Modo Automático', type: 'checkbox', key: 'auto' },
            { label: 'Janela (spins)', type: 'number', key: 'janela' },
            { label: 'Frequência mínima (0–1)', type: 'slider', min: 0, max: 1, step: 0.05, key: 'frequenciaMinima' },
            { label: 'Setor', type: 'select', options: ['Voisins de Zero', 'Tiers du Cylindre', 'Orphelins'], key: 'setor' }
          ],
          'condition:dozen_hot': [
            { label: 'Janela (spins)', type: 'number', key: 'janela' },
            { label: 'Frequência mínima (ocorrências)', type: 'number', key: 'frequenciaMinima' }
          ],
          'condition:column_hot': [
            { label: 'Janela (spins)', type: 'number', key: 'janela' },
            { label: 'Frequência mínima (ocorrências)', type: 'number', key: 'frequenciaMinima' }
          ],
          'condition:sequence_custom': [
            { label: 'Sequência (lista de números)', type: 'array', key: 'sequencia' },
            { label: 'Tolerância (erros permitidos)', type: 'number', key: 'tolerancia' }
          ],
          'logic': [
            { label: 'Operador', type: 'select', options: ['AND', 'OR', 'NOT'], key: 'operador' }
          ],
          'signal': [
            { label: 'Ação', type: 'select', options: ['emitir_sinal'], key: 'acao' },
            { label: 'Mensagem', type: 'text', key: 'mensagem' },
            { label: 'Prioridade', type: 'select', options: ['normal'], key: 'prioridade' },
            { label: 'Modo de Seleção', type: 'select', options: ['manual', 'automatic', 'hybrid'], key: 'selectionMode' },
            { label: 'Números (0–36)', type: 'array', key: 'numeros' },
            { label: 'Stake', type: 'number', key: 'stake' }
          ]
        }
      }
    },
    footer: {
      buttons: [
        { label: 'Testar Estratégia', action: 'testStrategy', icon: 'Play' },
        { label: 'Salvar', action: 'saveStrategy', icon: 'Save' },
        { label: 'Cancelar', action: 'closeBuilder', icon: 'X' }
      ]
    }
  },
  strategySchema: {
    schemaVersion: 'string (required, ex.: "1.0.0")',
    id: 'uuid',
    name: 'string',
    description: 'string',
    status: 'active | paused | draft | testing',
    createdAt: 'datetime',
    lastModified: 'datetime',
    nodes: [
      {
        id: 'string',
        type: 'trigger | condition | logic | signal',
        subtype: 'optional string (ex.: repetition, absence, trend)',
        data: {
          label: 'string',
          config: 'object (params depend on type)'
        },
        position: { x: 'number', y: 'number' }
      }
    ],
    connections: [
      { id: 'string', source: 'nodeId', target: 'nodeId', type: 'success | failure | condition' }
    ]
  }
}
