import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth-server'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase admin credentials are not configured')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

async function seedCoreTemplates(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const OFFICIAL_SEEDS: Array<{ name: string; slug: string; description: string; graph: any; meta?: any }> = [
    {
      name: 'Conexão de Cores SOFIA',
      slug: 'sofia-conexao-cores-v1',
      description: 'Estratégia baseada em tendência de cor em janela recente.',
      meta: { category: 'colors_trend', tags: ['cores', 'tendência', 'builder'] },
      graph: {
        schemaVersion: '1.0.0',
        selectionMode: 'manual',
        gating: { enabled: false },
        nodes: [
          { id: 'trigger_1', type: 'trigger', position: { x: 100, y: 100 }, data: { label: 'Analisar Janela', config: { janela: 30 } } },
          { id: 'cond_trend_red', type: 'condition', subtype: 'trend', position: { x: 320, y: 80 }, data: { label: 'Tendência Vermelho', conditionType: 'trend', config: { evento: 'vermelho', janela: 10, frequenciaMinima: 0.7 } } },
          { id: 'cond_trend_black', type: 'condition', subtype: 'trend', position: { x: 320, y: 160 }, data: { label: 'Tendência Preto', conditionType: 'trend', config: { evento: 'preto', janela: 10, frequenciaMinima: 0.7 } } },
          { id: 'logic_or', type: 'logic', position: { x: 540, y: 120 }, data: { label: 'Cor Quente (OR)', config: { operador: 'OR' } } },
          { id: 'signal_cores', type: 'signal', position: { x: 780, y: 120 }, data: { label: 'Gerar Sinal Conexão de Cores', config: { acao: 'emitir_sinal', mensagem: 'Tendência de cor detectada na janela recente.', prioridade: 'normal', selectionMode: 'manual', numeros: [], stake: 1.0 } } },
        ],
        connections: [
          { id: 'e1', source: 'trigger_1', target: 'cond_trend_red', type: 'success' },
          { id: 'e2', source: 'trigger_1', target: 'cond_trend_black', type: 'success' },
          { id: 'e3', source: 'cond_trend_red', target: 'logic_or', type: 'condition' },
          { id: 'e4', source: 'cond_trend_black', target: 'logic_or', type: 'condition' },
          { id: 'e5', source: 'logic_or', target: 'signal_cores', type: 'success' },
        ],
      },
    },
    {
      name: 'Dúzias Estatísticas SOFIA',
      slug: 'sofia-duzias-estatisticas-v1',
      description: 'Aposta na dúzia mais quente em uma janela recente de spins.',
      meta: { category: 'dozens_hot', tags: ['duzias', 'estatistica', 'builder'] },
      graph: {
        schemaVersion: '1.0.0',
        selectionMode: 'manual',
        gating: { enabled: false },
        nodes: [
          { id: 'trigger_1', type: 'trigger', position: { x: 80, y: 120 }, data: { label: 'Analisar Janela', config: { janela: 100 } } },
          { id: 'cond_dozen_hot', type: 'condition', subtype: 'dozen_hot', position: { x: 320, y: 120 }, data: { label: 'Dúzia Quente', conditionType: 'dozen_hot', config: { janela: 100, frequenciaMinima: 8 } } },
          { id: 'signal_duzias', type: 'signal', position: { x: 600, y: 120 }, data: { label: 'Gerar Sinal Dúzias Estatísticas', config: { acao: 'emitir_sinal', mensagem: 'Dúzia quente detectada na janela recente.', prioridade: 'normal', selectionMode: 'manual', numeros: [], stake: 1.0 } } },
        ],
        connections: [
          { id: 'e1', source: 'trigger_1', target: 'cond_dozen_hot', type: 'success' },
          { id: 'e2', source: 'cond_dozen_hot', target: 'signal_duzias', type: 'success' },
        ],
      },
    },
    {
      name: 'Espelhos e Irmãos SOFIA',
      slug: 'sofia-espelhos-irmaos-v1',
      description: 'Explora padrões de espelhos e irmãos na roleta.',
      meta: { category: 'mirrors_siblings', tags: ['espelhos', 'irmaos', 'vizinhos', 'builder'] },
      graph: {
        schemaVersion: '1.0.0',
        selectionMode: 'manual',
        gating: { enabled: false },
        nodes: [
          { id: 'trigger_1', type: 'trigger', position: { x: 60, y: 140 }, data: { label: 'Analisar Janela', config: { janela: 20 } } },
          { id: 'cond_mirror', type: 'condition', subtype: 'mirror', position: { x: 300, y: 80 }, data: { label: 'Presença de Espelho', conditionType: 'mirror', config: { raio: 1, includeZero: false } } },
          { id: 'cond_neighbors', type: 'condition', subtype: 'neighbors', position: { x: 300, y: 200 }, data: { label: 'Vizinhos do Último Número', conditionType: 'neighbors', config: { numero: 0, raio: 2, includeZero: true } } },
          { id: 'logic_and', type: 'logic', position: { x: 540, y: 140 }, data: { label: 'Espelhos + Vizinhos', config: { operador: 'AND' } } },
          { id: 'signal_espelhos', type: 'signal', position: { x: 800, y: 140 }, data: { label: 'Sinal Espelhos e Irmãos', config: { acao: 'emitir_sinal', mensagem: 'Contexto de espelhos e vizinhos detectado; configure irmãos e espelhos como alvos.', prioridade: 'normal', selectionMode: 'manual', numeros: [], stake: 1.0 } } },
        ],
        connections: [
          { id: 'e1', source: 'trigger_1', target: 'cond_mirror', type: 'success' },
          { id: 'e2', source: 'trigger_1', target: 'cond_neighbors', type: 'success' },
          { id: 'e3', source: 'cond_mirror', target: 'logic_and', type: 'condition' },
          { id: 'e4', source: 'cond_neighbors', target: 'logic_and', type: 'condition' },
          { id: 'e5', source: 'logic_and', target: 'signal_espelhos', type: 'success' },
        ],
      },
    },
    {
      name: 'Atlas SOFIA',
      slug: 'sofia-atlas-v1',
      description: 'Ativa quando algum número do conjunto Atlas aparece na janela recente.',
      meta: { category: 'atlas', tags: ['atlas', 'conjuntos', 'builder'] },
      graph: {
        schemaVersion: '1.0.0',
        selectionMode: 'automatic',
        gating: { enabled: false },
        nodes: [
          { id: 'trigger_1', type: 'trigger', position: { x: 80, y: 120 }, data: { label: 'Analisar Janela', config: { janela: 10 } } },
          { id: 'cond_atlas_recent', type: 'condition', subtype: 'recent-in-set', position: { x: 320, y: 120 }, data: { label: 'Atlas - Recente no Conjunto', conditionType: 'recent-in-set', config: { janela: 5, set: [13, 14, 15, 16, 17, 18, 31, 32, 33, 34, 35, 36], outputNumbers: [13, 14, 15, 16, 17, 18, 31, 32, 33, 34, 35, 36] } } },
          { id: 'signal_atlas', type: 'signal', position: { x: 620, y: 120 }, data: { label: 'Gerar Sinal Atlas', config: { acao: 'emitir_sinal', mensagem: 'Conjunto Atlas detectado na janela recente.', prioridade: 'normal', selectionMode: 'automatic', numeros: [], stake: 1.0 } } },
        ],
        connections: [
          { id: 'e1', source: 'trigger_1', target: 'cond_atlas_recent', type: 'success' },
          { id: 'e2', source: 'cond_atlas_recent', target: 'signal_atlas', type: 'success' },
        ],
      },
    },
    {
      name: 'Trovão SOFIA',
      slug: 'sofia-trovao-v1',
      description: 'Ativa quando aparecem triggers adjacentes em sequência.',
      meta: { category: 'trovao', tags: ['trovao', 'sequencia', 'builder'] },
      graph: {
        schemaVersion: '1.0.0',
        selectionMode: 'automatic',
        gating: { enabled: false },
        nodes: [
          { id: 'trigger_1', type: 'trigger', position: { x: 80, y: 120 }, data: { label: 'Analisar Janela', config: { janela: 10 } } },
          { id: 'cond_trovao_adjacent', type: 'condition', subtype: 'adjacent-in-list', position: { x: 320, y: 120 }, data: { label: 'Trovão - Triggers Adjacentes', conditionType: 'adjacent-in-list', config: { janela: 6, list: [21, 23, 25, 27], circular: false, outputNumbers: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36] } } },
          { id: 'signal_trovao', type: 'signal', position: { x: 620, y: 120 }, data: { label: 'Gerar Sinal Trovão', config: { acao: 'emitir_sinal', mensagem: 'Sequência de triggers do Trovão detectada.', prioridade: 'normal', selectionMode: 'automatic', numeros: [], stake: 1.0 } } },
        ],
        connections: [
          { id: 'e1', source: 'trigger_1', target: 'cond_trovao_adjacent', type: 'success' },
          { id: 'e2', source: 'cond_trovao_adjacent', target: 'signal_trovao', type: 'success' },
        ],
      },
    },
    {
      name: 'Irmãos SOFIA',
      slug: 'sofia-irmaos-v1',
      description: 'Ativa quando um número irmão (11, 22, 33) aparece recentemente.',
      meta: { category: 'irmaos', tags: ['irmaos', 'vizinhos', 'builder'] },
      graph: {
        schemaVersion: '1.0.0',
        selectionMode: 'automatic',
        gating: { enabled: false },
        nodes: [
          { id: 'trigger_1', type: 'trigger', position: { x: 80, y: 120 }, data: { label: 'Analisar Janela', config: { janela: 10 } } },
          { id: 'cond_irmaos_recent', type: 'condition', subtype: 'recent-in-set', position: { x: 320, y: 120 }, data: { label: 'Irmãos - Recente no Conjunto', conditionType: 'recent-in-set', config: { janela: 6, set: [11, 22, 33], outputNumbers: [0, 5, 7, 8, 9, 10, 11, 16, 18, 22, 23, 24, 28, 29, 30, 33] } } },
          { id: 'signal_irmaos', type: 'signal', position: { x: 600, y: 120 }, data: { label: 'Gerar Sinal Irmãos', config: { acao: 'emitir_sinal', mensagem: 'Número irmão detectado recentemente; sugerindo irmãos e vizinhos (inclui 0).', prioridade: 'normal', selectionMode: 'automatic', numeros: [], stake: 1.0 } } },
        ],
        connections: [
          { id: 'e1', source: 'trigger_1', target: 'cond_irmaos_recent', type: 'condition' },
          { id: 'e2', source: 'cond_irmaos_recent', target: 'signal_irmaos', type: 'condition' },
        ],
      },
    },
    {
      name: 'Espelhos SOFIA',
      slug: 'sofia-espelhos-v1',
      description: 'Deriva o número espelho do último giro e sugere o espelho com vizinhos.',
      meta: { category: 'mirrors', tags: ['espelhos', 'espelho', 'builder'] },
      graph: {
        schemaVersion: '1.0.0',
        selectionMode: 'manual',
        gating: { enabled: false },
        nodes: [
          { id: 'trigger_1', type: 'trigger', position: { x: 80, y: 120 }, data: { label: 'Analisar Janela', config: { janela: 10 } } },
          { id: 'cond_mirror', type: 'condition', subtype: 'mirror', position: { x: 320, y: 120 }, data: { label: 'Espelho do Último Número', conditionType: 'mirror', config: { raio: 1, includeZero: true } } },
          { id: 'signal_espelhos', type: 'signal', position: { x: 600, y: 120 }, data: { label: 'Sinal Espelhos SOFIA', config: { acao: 'emitir_sinal', mensagem: 'Espelho do último número derivado (com vizinhos).', prioridade: 'normal', selectionMode: 'manual', numeros: [], stake: 1.0 } } },
        ],
        connections: [
          { id: 'e1', source: 'trigger_1', target: 'cond_mirror', type: 'success' },
          { id: 'e2', source: 'cond_mirror', target: 'signal_espelhos', type: 'success' },
        ],
      },
    },
    {
      name: 'Padrões Alternados SOFIA',
      slug: 'sofia-padroes-alternados-v1',
      description: 'Deriva uma previsão por alternância (cor/paridade) com base no último giro.',
      meta: { category: 'alternation_patterns', tags: ['alternados', 'alternancia', 'builder'] },
      graph: {
        schemaVersion: '1.0.0',
        selectionMode: 'manual',
        gating: { enabled: false },
        nodes: [
          { id: 'trigger_1', type: 'trigger', position: { x: 80, y: 140 }, data: { label: 'Analisar Janela', config: { janela: 10 } } },
          { id: 'cond_alt_color', type: 'condition', subtype: 'alternation', position: { x: 320, y: 80 }, data: { label: 'Alternância por Cor', conditionType: 'alternation', config: { eixo: 'cor' } } },
          { id: 'cond_alt_parity', type: 'condition', subtype: 'alternation', position: { x: 320, y: 200 }, data: { label: 'Alternância por Paridade', conditionType: 'alternation', config: { eixo: 'paridade' } } },
          { id: 'logic_or', type: 'logic', position: { x: 560, y: 140 }, data: { label: 'Alternância Ativa (OR)', config: { operador: 'OR' } } },
          { id: 'signal_alternados', type: 'signal', position: { x: 820, y: 140 }, data: { label: 'Sinal Padrões Alternados', config: { acao: 'emitir_sinal', mensagem: 'Alternância detectada e conjunto derivado para o próximo giro.', prioridade: 'normal', selectionMode: 'manual', numeros: [], stake: 1.0 } } },
        ],
        connections: [
          { id: 'e1', source: 'trigger_1', target: 'cond_alt_color', type: 'success' },
          { id: 'e2', source: 'trigger_1', target: 'cond_alt_parity', type: 'success' },
          { id: 'e3', source: 'cond_alt_color', target: 'logic_or', type: 'condition' },
          { id: 'e4', source: 'cond_alt_parity', target: 'logic_or', type: 'condition' },
          { id: 'e5', source: 'logic_or', target: 'signal_alternados', type: 'success' },
        ],
      },
    },
    {
      name: 'Padrões de Duplas SOFIA',
      slug: 'sofia-padroes-duplas-v1',
      description: 'Ativa quando há repetição recente (dupla) e sugere o conjunto derivado.',
      meta: { category: 'double_patterns', tags: ['duplas', 'repeticao', 'builder'] },
      graph: {
        schemaVersion: '1.0.0',
        selectionMode: 'manual',
        gating: { enabled: false },
        nodes: [
          { id: 'trigger_1', type: 'trigger', position: { x: 80, y: 120 }, data: { label: 'Analisar Janela', config: { janela: 12 } } },
          { id: 'cond_double', type: 'condition', subtype: 'repetition', position: { x: 320, y: 120 }, data: { label: 'Dupla por Repetição', conditionType: 'repetition', config: { eixo: 'cor', minRun: 2 } } },
          { id: 'signal_duplas', type: 'signal', position: { x: 600, y: 120 }, data: { label: 'Sinal Padrões de Duplas', config: { acao: 'emitir_sinal', mensagem: 'Dupla detectada por repetição recente.', prioridade: 'normal', selectionMode: 'manual', numeros: [], stake: 1.0 } } },
        ],
        connections: [
          { id: 'e1', source: 'trigger_1', target: 'cond_double', type: 'success' },
          { id: 'e2', source: 'cond_double', target: 'signal_duplas', type: 'success' },
        ],
      },
    },
    {
      name: 'Reflexão de Números SOFIA',
      slug: 'sofia-reflexao-numeros-v1',
      description: 'Deriva o espelho do último número e seus vizinhos por raio.',
      meta: { category: 'mirror_numbers', tags: ['reflexao', 'espelho', 'builder'] },
      graph: {
        schemaVersion: '1.0.0',
        selectionMode: 'manual',
        gating: { enabled: false },
        nodes: [
          { id: 'trigger_1', type: 'trigger', position: { x: 80, y: 120 }, data: { label: 'Analisar Janela', config: { janela: 10 } } },
          { id: 'cond_mirror', type: 'condition', subtype: 'mirror', position: { x: 320, y: 120 }, data: { label: 'Espelho do Último Número', conditionType: 'mirror', config: { raio: 1, includeZero: true } } },
          { id: 'signal_reflexao', type: 'signal', position: { x: 600, y: 120 }, data: { label: 'Sinal Reflexão de Números', config: { acao: 'emitir_sinal', mensagem: 'Espelho do último número (com vizinhos) derivado.', prioridade: 'normal', selectionMode: 'manual', numeros: [], stake: 1.0 } } },
        ],
        connections: [
          { id: 'e1', source: 'trigger_1', target: 'cond_mirror', type: 'success' },
          { id: 'e2', source: 'cond_mirror', target: 'signal_reflexao', type: 'success' },
        ],
      },
    },
    {
      name: 'Puxador de Terminais SOFIA',
      slug: 'sofia-puxador-terminais-v1',
      description: 'Explora padrões de terminais (último dígito) em sequências recentes.',
      meta: { category: 'terminals_pull', tags: ['terminais', 'puxador', 'builder'] },
      graph: {
        schemaVersion: '1.0.0',
        selectionMode: 'manual',
        gating: { enabled: false },
        nodes: [
          { id: 'trigger_1', type: 'trigger', position: { x: 80, y: 120 }, data: { label: 'Analisar Janela', config: { janela: 20 } } },
          { id: 'cond_terminal_pattern', type: 'condition', subtype: 'terminal-pattern', position: { x: 320, y: 120 }, data: { label: 'Padrão de Terminais', conditionType: 'terminal-pattern', config: { janela: 20, padrao: 'any', minStrength: 1, includeNeighbors: true, neighborRadius: 2, includeZero: true } } },
          { id: 'signal_terminais', type: 'signal', position: { x: 600, y: 120 }, data: { label: 'Sinal Puxador de Terminais', config: { acao: 'emitir_sinal', mensagem: 'Padrão de terminais detectado em sequência recente.', prioridade: 'normal', selectionMode: 'manual', numeros: [], stake: 1.0 } } },
        ],
        connections: [
          { id: 'e1', source: 'trigger_1', target: 'cond_terminal_pattern', type: 'success' },
          { id: 'e2', source: 'cond_terminal_pattern', target: 'signal_terminais', type: 'success' },
        ],
      },
    },
    {
      name: 'Terminais Refinados SOFIA',
      slug: 'sofia-terminais-refinados-v1',
      description: 'Detecta padrões no último dígito (terminal) e sugere números do terminal com vizinhos.',
      meta: { category: 'terminal-pattern', tags: ['terminais', 'vizinhos', 'builder'] },
      graph: {
        schemaVersion: '1.0.0',
        selectionMode: 'automatic',
        gating: { enabled: false },
        nodes: [
          { id: 'trigger_1', type: 'trigger', position: { x: 80, y: 120 }, data: { label: 'Analisar Janela', config: { janela: 6 } } },
          { id: 'cond_terminal_pattern', type: 'condition', subtype: 'terminal-pattern', position: { x: 320, y: 120 }, data: { label: 'Padrão de Terminais', conditionType: 'terminal-pattern', config: { janela: 6, padrao: 'any', minStrength: 1, includeNeighbors: true, neighborRadius: 2, includeZero: true } } },
          { id: 'signal_terminais_refinados', type: 'signal', position: { x: 600, y: 120 }, data: { label: 'Gerar Sinal Terminais Refinados', config: { acao: 'emitir_sinal', mensagem: 'Padrão de terminais detectado; sugerindo números do terminal e vizinhos (inclui 0).', prioridade: 'normal', selectionMode: 'automatic', numeros: [], stake: 1.0 } } },
        ],
        connections: [
          { id: 'e1', source: 'trigger_1', target: 'cond_terminal_pattern', type: 'success' },
          { id: 'e2', source: 'cond_terminal_pattern', target: 'signal_terminais_refinados', type: 'success' },
        ],
      },
    },
    {
      name: 'Números Puxam SOFIA',
      slug: 'sofia-numeros-puxam-v1',
      description: 'Explora relações de puxada entre números.',
      meta: { category: 'numbers_pull', tags: ['numeros', 'puxam', 'sequencia', 'builder'] },
      graph: {
        schemaVersion: '1.0.0',
        selectionMode: 'manual',
        gating: { enabled: false },
        nodes: [
          { id: 'trigger_1', type: 'trigger', position: { x: 80, y: 140 }, data: { label: 'Analisar Janela', config: { janela: 25 } } },
          { id: 'cond_sequence', type: 'condition', subtype: 'sequence_custom', position: { x: 320, y: 80 }, data: { label: 'Sequência de Puxada', conditionType: 'sequence_custom', config: { sequencia: [7, 17, 27], tolerancia: 1 } } },
          { id: 'cond_neighbors', type: 'condition', subtype: 'neighbors', position: { x: 320, y: 220 }, data: { label: 'Vizinhos do Último Número', conditionType: 'neighbors', config: { numero: 0, raio: 2, includeZero: true } } },
          { id: 'logic_and', type: 'logic', position: { x: 560, y: 150 }, data: { label: 'Puxada Ativa', config: { operador: 'AND' } } },
          { id: 'signal_puxam', type: 'signal', position: { x: 820, y: 150 }, data: { label: 'Sinal Números Puxam', config: { acao: 'emitir_sinal', mensagem: 'Padrão de puxada entre números detectado.', prioridade: 'normal', selectionMode: 'manual', numeros: [], stake: 1.0 } } },
        ],
        connections: [
          { id: 'e1', source: 'trigger_1', target: 'cond_sequence', type: 'success' },
          { id: 'e2', source: 'trigger_1', target: 'cond_neighbors', type: 'success' },
          { id: 'e3', source: 'cond_sequence', target: 'logic_and', type: 'condition' },
          { id: 'e4', source: 'cond_neighbors', target: 'logic_and', type: 'condition' },
          { id: 'e5', source: 'logic_and', target: 'signal_puxam', type: 'success' },
        ],
      },
    },
    {
      name: 'Ondas SOFIA',
      slug: 'sofia-ondas-v1',
      description: 'Captura ondas de padrão combinando tendência de cor com alternância.',
      meta: { category: 'waves_pattern', tags: ['ondas', 'tendência', 'alternância', 'builder'] },
      graph: {
        schemaVersion: '1.0.0',
        selectionMode: 'manual',
        gating: { enabled: false },
        nodes: [
          { id: 'trigger_1', type: 'trigger', position: { x: 80, y: 120 }, data: { label: 'Analisar Janela', config: { janela: 30 } } },
          { id: 'cond_trend_color', type: 'condition', subtype: 'trend', position: { x: 320, y: 80 }, data: { label: 'Tendência de Cor', conditionType: 'trend', config: { evento: 'vermelho', janela: 10, frequenciaMinima: 0.7 } } },
          { id: 'cond_alternation', type: 'condition', subtype: 'alternation', position: { x: 320, y: 200 }, data: { label: 'Alternância de Cor', conditionType: 'alternation', config: { eixo: 'cor', comprimento: 4 } } },
          { id: 'logic_and', type: 'logic', position: { x: 560, y: 140 }, data: { label: 'Onda Ativa', config: { operador: 'AND' } } },
          { id: 'signal_ondas', type: 'signal', position: { x: 820, y: 140 }, data: { label: 'Sinal Ondas SOFIA', config: { acao: 'emitir_sinal', mensagem: 'Onda de padrão (tendência + alternância) detectada.', prioridade: 'normal', selectionMode: 'manual', numeros: [], stake: 1.0 } } },
        ],
        connections: [
          { id: 'e1', source: 'trigger_1', target: 'cond_trend_color', type: 'success' },
          { id: 'e2', source: 'trigger_1', target: 'cond_alternation', type: 'success' },
          { id: 'e3', source: 'cond_trend_color', target: 'logic_and', type: 'condition' },
          { id: 'e4', source: 'cond_alternation', target: 'logic_and', type: 'condition' },
          { id: 'e5', source: 'logic_and', target: 'signal_ondas', type: 'success' },
        ],
      },
    },
  ]

  const core = OFFICIAL_SEEDS.map(seed => {
    const graph = seed.graph && typeof seed.graph === 'object' ? seed.graph : {}
    const payload = {
      schemaVersion: String(graph.schemaVersion || '1.0.0'),
      nodes: Array.isArray(graph.nodes) ? graph.nodes : [],
      connections: Array.isArray(graph.connections) ? graph.connections : [],
      selectionMode: String(graph.selectionMode || 'automatic') as any,
      gating: (graph as any).gating || { enabled: false },
      metadata: {
        origin: 'official',
        author: { displayName: 'SOFIA' },
        ...(seed.meta && typeof seed.meta === 'object' ? seed.meta : {})
      }
    }
    return { name: seed.name, slug: seed.slug, description: seed.description, builderPayload: payload }
  })

  const slugs = core.map(c => c.slug)
  const legacySlugToNew: Record<string, string> = {
    'conexao-de-cores-sofia': 'sofia-conexao-cores-v1',
    'puxador-de-terminais': 'sofia-puxador-terminais-v1',
    'estrategia-de-irmaos': 'sofia-irmaos-v1',
    'estrategia-de-espelho': 'sofia-espelhos-v1',
  }

  const slugListForLookup = Array.from(new Set([...slugs, ...Object.keys(legacySlugToNew)]))
  const { data: existing, error: existingError } = await supabase
    .from('strategy_templates')
    .select('id,published_strategy_slug')
    .eq('user_id', 'system')
    .in('published_strategy_slug', slugListForLookup)

  if (existingError) {
    throw new Error(existingError.message)
  }

  const existingRows = (existing || []).map((x: any) => ({
    id: String(x?.id || '').trim(),
    slug: String(x?.published_strategy_slug || '').trim()
  })).filter(x => x.id && x.slug)

  const rowBySlug: Record<string, { id: string; slug: string }> = {}
  for (const r of existingRows) rowBySlug[r.slug] = r

  const coreBySlug: Record<string, any> = {}
  for (const c of core) coreBySlug[c.slug] = c

  const existingSlugs = new Set(Object.keys(rowBySlug))

  for (const [oldSlug, newSlug] of Object.entries(legacySlugToNew)) {
    const oldRow = rowBySlug[oldSlug]
    if (!oldRow) continue
    if (existingSlugs.has(newSlug)) continue
    const target = coreBySlug[newSlug]
    if (!target) continue

    const { error: updateError } = await supabase
      .from('strategy_templates')
      .update({
        name: target.name,
        description: target.description,
        builder_payload: (target as any).builderPayload,
        is_published: true,
        published_strategy_slug: newSlug
      })
      .eq('id', oldRow.id)
      .eq('user_id', 'system')

    if (updateError) {
      throw new Error(updateError.message)
    }

    delete rowBySlug[oldSlug]
    rowBySlug[newSlug] = { id: oldRow.id, slug: newSlug }
    existingSlugs.delete(oldSlug)
    existingSlugs.add(newSlug)
  }

  const missing = core.filter(c => !existingSlugs.has(c.slug))

  if (missing.length === 0) return

  const rows = missing.map(c => ({
    user_id: 'system',
    name: c.name,
    description: c.description,
    builder_payload: (c as any).builderPayload,
    is_published: true,
    published_strategy_slug: c.slug
  }))

  const { error: insertError } = await supabase.from('strategy_templates').insert(rows)
  if (insertError) {
    throw new Error(insertError.message)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    await seedCoreTemplates(supabase)
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (id) {
      const { data, error } = await supabase
        .from('strategy_templates')
        .select('id,user_id,name,description,builder_payload,is_published,published_strategy_slug,created_at,updated_at')
        .eq('id', id)
        .or(`user_id.eq.${userId},user_id.eq.system`)
        .maybeSingle()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      if (!data) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      const templateUserId = String((data as any)?.user_id || '').trim()
      if (templateUserId && templateUserId !== 'system') {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('user_id,full_name,avatar_url')
          .eq('user_id', templateUserId)
          .maybeSingle()

        return NextResponse.json({ ok: true, template: { ...(data as any), author_profile: profile || null } })
      }

      return NextResponse.json({ ok: true, template: { ...(data as any), author_profile: null } })
    }

    const { data, error } = await supabase
      .from('strategy_templates')
      .select('id,user_id,name,description,builder_payload,is_published,published_strategy_slug,created_at,updated_at')
      .or(`user_id.eq.${userId},user_id.eq.system`)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const list = Array.isArray(data) ? data : []
    const authorIds = Array.from(
      new Set(
        list
          .map((t: any) => String(t?.user_id || '').trim())
          .filter((id) => Boolean(id) && id !== 'system')
      )
    )

    let profilesById: Record<string, any> = {}
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id,full_name,avatar_url')
        .in('user_id', authorIds)

      for (const p of profiles || []) {
        const key = String((p as any)?.user_id || '').trim()
        if (key) profilesById[key] = p
      }
    }

    const withProfiles = list.map((t: any) => ({
      ...t,
      author_profile: profilesById[String(t?.user_id || '').trim()] || null
    }))

    return NextResponse.json({ ok: true, templates: withProfiles })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const anyBody = body as any
    let name = String(anyBody.name || '').trim()
    let description = typeof anyBody.description === 'string' ? anyBody.description : ''
    let builderPayload = anyBody.builder_payload

    if (anyBody.type === 'sofia_strategy_template' && anyBody.graph && typeof anyBody.graph === 'object') {
      const graph = anyBody.graph
      const rawNodes = Array.isArray(graph.nodes) ? graph.nodes : []
      const rawConnections = Array.isArray(graph.connections) ? graph.connections : []
      builderPayload = {
        schemaVersion: String(anyBody.schemaVersion || graph.schemaVersion || '1.0.0'),
        nodes: rawNodes,
        connections: rawConnections,
        selectionMode: graph.selectionMode,
        gating: graph.gating,
        metadata: (anyBody.metadata && typeof anyBody.metadata === 'object') ? anyBody.metadata : undefined
      }
      if (!name) {
        name = String(anyBody.name || 'Template importado').trim()
      }
      if (!description && typeof anyBody.description === 'string') {
        description = anyBody.description
      }
    }

    if (anyBody.author && typeof anyBody.author === 'object') {
      const existingMeta = (builderPayload && typeof builderPayload === 'object' && (builderPayload as any).metadata && typeof (builderPayload as any).metadata === 'object')
        ? (builderPayload as any).metadata
        : {}
      builderPayload = {
        ...(builderPayload || {}),
        metadata: {
          ...existingMeta,
          author: anyBody.author
        }
      }
    }

    if (Array.isArray(anyBody.tags)) {
      const existingMeta = (builderPayload && typeof builderPayload === 'object' && (builderPayload as any).metadata && typeof (builderPayload as any).metadata === 'object')
        ? (builderPayload as any).metadata
        : {}
      builderPayload = {
        ...(builderPayload || {}),
        metadata: {
          ...existingMeta,
          tags: anyBody.tags
        }
      }
    }

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (!builderPayload || typeof builderPayload !== 'object') {
      return NextResponse.json({ error: 'builder_payload is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('strategy_templates')
      .insert({
        user_id: userId,
        name,
        description,
        builder_payload: builderPayload,
        is_published: false,
        published_strategy_slug: null
      })
      .select('id,user_id,name,description,builder_payload,is_published,published_strategy_slug,created_at,updated_at')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, template: data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const id = String((body as any).id || '').trim()
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const update: any = {}
    if (typeof (body as any).name === 'string') {
      const name = String((body as any).name).trim()
      if (!name) {
        return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 })
      }
      update.name = name
    }
    if (typeof (body as any).description === 'string') {
      update.description = (body as any).description
    }
    if ((body as any).builder_payload && typeof (body as any).builder_payload === 'object') {
      update.builder_payload = (body as any).builder_payload
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('strategy_templates')
      .update(update)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id,user_id,name,description,builder_payload,is_published,published_strategy_slug,created_at,updated_at')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, template: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let id = new URL(request.url).searchParams.get('id') || ''
    if (!id) {
      const body = await request.json().catch(() => null)
      if (body && typeof body === 'object' && (body as any).id) {
        id = String((body as any).id || '').trim()
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('strategy_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, deletedId: data.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
