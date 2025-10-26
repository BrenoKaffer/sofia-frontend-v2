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
                subtype: 'repetition',
                label: 'Repetição de Evento',
                description: 'Verifica se um evento (cor, número, setor) se repete N vezes seguidas.',
                defaultConfig: { evento: 'vermelho', ocorrencias: 3 }
              },
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
                subtype: 'pattern',
                label: 'Padrão Customizado',
                description: 'Busca uma sequência específica no histórico (ex.: vermelho, preto, vermelho).',
                defaultConfig: { sequencia: ['vermelho', 'preto', 'vermelho'], modo: 'exato' }
              },
              {
                type: 'condition',
                subtype: 'break',
                label: 'Quebra de Padrão',
                description: 'Detecta quando uma sequência é interrompida (ex.: 6 pretos → vermelho).',
                defaultConfig: { evento: 'preto', minimo: 6 }
              },
              {
                type: 'condition',
                subtype: 'neighbors',
                label: 'Vizinhos / Setor',
                description: 'Verifica ocorrências em torno de um número ou setor do cilindro.',
                defaultConfig: { numero: 17, raio: 2, includeZero: true }
              },
              {
                type: 'condition',
                subtype: 'repeat-number',
                label: 'Número Repetido',
                description: 'Verifica se um número se repete N vezes seguidas.',
                defaultConfig: { numero: 7, ocorrencias: 2 }
              },
              {
                type: 'condition',
                subtype: 'time-window',
                label: 'Janela Temporal',
                description: 'Ativa quando o tamanho do histórico está entre início e fim.',
                defaultConfig: { inicio: 10, fim: 50 }
              },
              {
                type: 'condition',
                subtype: 'sequence',
                label: 'Sequência Exata',
                description: 'Verifica se as últimas rodadas correspondem exatamente à sequência.',
                defaultConfig: { sequencia: ['vermelho', 'preto', 'vermelho'] }
              },
              {
                type: 'condition',
                subtype: 'sequence_custom',
                label: 'Sequência Custom',
                description: 'Busca uma sequência com modo exato ou parcial.',
                defaultConfig: { sequencia: ['vermelho', 'preto'], modo: 'exato' }
              },
              {
                type: 'condition',
                subtype: 'specific-number',
                label: 'Número Específico',
                description: 'Verifica presença ou ausência de um número específico.',
                defaultConfig: { numero: 7, modo: 'ocorreu' }
              },
              {
                type: 'condition',
                subtype: 'alternation',
                label: 'Alternância',
                description: 'Verifica alternância entre duas categorias (cor ou paridade).',
                defaultConfig: { eixo: 'cor', comprimento: 4 }
              },
              {
                type: 'condition',
                subtype: 'setorDominante',
                label: 'Setor Dominante',
                description: 'Detecta predominância de um setor (Voisins/Tiers/Orphelins) em janela.',
                defaultConfig: { setor: 'Voisins', janela: 6, frequenciaMinima: 4 }
              },
              {
                type: 'condition',
                subtype: 'dozen_hot',
                label: 'Dezena Quente',
                description: 'Detecta dezenas (1–12, 13–24, 25–36) com alta frequência na janela.',
                defaultConfig: { janela: 12, frequenciaMinima: 5 }
              },
              {
                type: 'condition',
                subtype: 'column_hot',
                label: 'Coluna Quente',
                description: 'Detecta colunas (1ª, 2ª, 3ª) com alta frequência na janela.',
                defaultConfig: { janela: 12, frequenciaMinima: 5 }
              },
              {
                type: 'condition',
                subtype: 'mirror',
                label: 'Espelho',
                description: 'Seleciona o oposto diametral do último número na roda.',
                defaultConfig: { raio: 0, includeZero: true }
              }
            ]
          },
          {
            name: 'Lógica',
            nodes: [
              {
                type: 'logic',
                label: 'Operador Lógico',
                description: 'Combina condições com AND / OR / NOT.',
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
                  stake: 1.0,
                  protecaoTipo: 'martingale',
                  protecaoLimite: 3,
                  limiteRodadas: 5,
                  excludeZero: false,
                  maxNumbersAuto: 18,
                  maxNumbersHybrid: 24,
                  minManualHybrid: 1
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
          'condition:repetition': [
            { label: 'Evento', type: 'select', options: ['vermelho', 'preto', 'par', 'ímpar', 'zero'], key: 'evento' },
            { label: 'Ocorrências', type: 'number', key: 'ocorrencias' }
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
          'condition:pattern': [
            { label: 'Sequência', type: 'array', key: 'sequencia' },
            { label: 'Modo', type: 'select', options: ['exato', 'parcial'], key: 'modo' }
          ],
          'condition:break': [
            { label: 'Evento', type: 'select', options: ['vermelho', 'preto', 'par', 'ímpar', 'zero'], key: 'evento' },
            { label: 'Mínimo de sequência', type: 'number', key: 'minimo' }
          ],
          'condition:neighbors': [
            { label: 'Número base', type: 'number', key: 'numero' },
            { label: 'Raio', type: 'slider', key: 'raio', min: 0, max: 6, step: 1 },
            { label: 'Incluir Zero', type: 'checkbox', key: 'includeZero' }
          ],
          'condition:repeat-number': [
            { label: 'Número', type: 'number', key: 'numero' },
            { label: 'Ocorrências', type: 'number', key: 'ocorrencias' }
          ],
          'condition:time-window': [
            { label: 'Início', type: 'number', key: 'inicio' },
            { label: 'Fim', type: 'number', key: 'fim' }
          ],
          'condition:sequence': [
            { label: 'Sequência', type: 'array', key: 'sequencia' }
          ],
          'condition:sequence_custom': [
            { label: 'Sequência', type: 'array', key: 'sequencia' },
            { label: 'Modo', type: 'select', options: ['exato', 'parcial'], key: 'modo' }
          ],
          'condition:specific-number': [
            { label: 'Número', type: 'number', key: 'numero' },
            { label: 'Modo', type: 'select', options: ['ocorreu', 'ausente'], key: 'modo' }
          ],
          'condition:alternation': [
            { label: 'Eixo', type: 'select', options: ['cor', 'paridade'], key: 'eixo' },
            { label: 'Comprimento', type: 'number', key: 'comprimento' }
          ],
          'condition:setorDominante': [
            { label: 'Setor', type: 'select', options: ['Voisins', 'Tiers', 'Orphelins'], key: 'setor' },
            { label: 'Janela (N últimas rodadas)', type: 'number', key: 'janela' },
            { label: 'Frequência mínima no setor', type: 'number', key: 'frequenciaMinima' }
          ],
          'condition:dozen_hot': [
            { label: 'Janela de análise', type: 'number', key: 'janela' },
            { label: 'Ocorrências mínimas na dezena', type: 'number', key: 'frequenciaMinima' }
          ],
          'condition:column_hot': [
            { label: 'Janela de análise', type: 'number', key: 'janela' },
            { label: 'Ocorrências mínimas na coluna', type: 'number', key: 'frequenciaMinima' }
          ],
          'condition:mirror': [
            { label: 'Raio (vizinhos do espelho)', type: 'slider', key: 'raio', min: 0, max: 6, step: 1 },
            { label: 'Incluir Zero', type: 'checkbox', key: 'includeZero' }
          ],
          'logic': [
            { label: 'Operador', type: 'select', options: ['AND', 'OR', 'NOT'], key: 'operador' }
          ],
          'signal': [
            { label: 'Ação', type: 'select', options: ['emitir_sinal', 'notificar', 'apostar'], key: 'acao' },
            { label: 'Mensagem', type: 'text', key: 'mensagem' },
            { label: 'Prioridade', type: 'select', options: ['normal', 'alta', 'baixa'], key: 'prioridade' },
            { label: 'Modo de Seleção', type: 'select', options: ['manual', 'automatic', 'hybrid'], key: 'selectionMode' },
            { label: 'Números (0–36)', type: 'array', key: 'numeros' },
            { label: 'Stake', type: 'number', key: 'stake' },
            { label: 'Proteção', type: 'select', options: ['martingale', 'fibonacci', 'flat'], key: 'protecaoTipo' },
            { label: 'Limite da Proteção', type: 'number', key: 'protecaoLimite' },
            { label: 'Rodadas de Execução', type: 'number', key: 'limiteRodadas' },
            { label: 'Excluir Zero', type: 'checkbox', key: 'excludeZero' },
            { label: 'Máx. números (modo automático)', type: 'number', key: 'maxNumbersAuto' },
            { label: 'Máx. números (modo híbrido)', type: 'number', key: 'maxNumbersHybrid' },
            { label: 'Mín. manuais (modo híbrido)', type: 'number', key: 'minManualHybrid' }
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
