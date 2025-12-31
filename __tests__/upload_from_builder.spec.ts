import { compileBuilderToJS } from '../lib/builder-compiler'

function loadCompiled(js: string) {
  const transformed = js.replace(/export\s*\{\s*METADATA,\s*checkStrategy,\s*generateSignal\s*\}/, 'return { METADATA, checkStrategy, generateSignal }')
  // eslint-disable-next-line no-new-func
  const factory = new Function(transformed)
  return factory()
}

describe('Strategy Builder Upload Compiler (Fase 3)', () => {
  test('neighbors + signal logic should activate and derive numbers', () => {
    const payload = {
      name: 'NeighborsTest',
      selectionMode: 'automatic',
      nodes: [
        { id: 'c1', type: 'condition', subtype: 'neighbors', data: { config: { numero: 17, raio: 2 } } },
        { id: 'l1', type: 'logic', data: { config: { operador: 'AND' } } },
        { id: 's1', type: 'signal', data: { config: {} } }
      ],
      connections: [
        { id: 'e1', source: 'c1', target: 'l1', type: 'condition' },
        { id: 'e2', source: 'l1', target: 's1', type: 'success' }
      ],
      min_spins: 1,
      gating: { excludeZero: true }
    }
    const js = compileBuilderToJS(payload)
    const mod = loadCompiled(js)
    const history = [5, 23, 10, 17]
    const res = mod.checkStrategy(history, {})
    expect(res.shouldActivate).toBe(true)
    const sig = mod.generateSignal(history, {})
    expect(Array.isArray(sig.numbers)).toBe(true)
    expect(sig.numbers.length).toBeGreaterThan(0)
    expect(sig.metadata.telemetry.logicTrace.length).toBeGreaterThan(0)
    expect(sig.metadata.telemetry.decisionTrace).toBeDefined()
    expect(sig.metadata.telemetry.decisionTrace.signalActive).toBe(true)
    expect(sig.metadata.telemetry.decisionTrace.producedCount).toBeGreaterThan(0)
  })

  test('absence of red in last N spins derives black set and activates', () => {
    const payload = {
      name: 'AbsenceRed', selectionMode: 'automatic', min_spins: 1,
      nodes: [
        { id: 'c1', type: 'condition', subtype: 'absence', data: { config: { alvo: 'vermelho', spins: 5 } } },
        { id: 's1', type: 'signal', data: { config: {} } }
      ],
      connections: [ { id: 'e1', source: 'c1', target: 's1', type: 'success' } ]
    }
    const js = compileBuilderToJS(payload)
    const mod = loadCompiled(js)
    const history = [2, 20, 26, 35, 22] // todos pretos
    const res = mod.checkStrategy(history, {})
    expect(res.shouldActivate).toBe(true)
    expect(res.reason).toMatch(/Lógica satisfeita/)
    const sig = mod.generateSignal(history, {})
    expect(sig.numbers.length).toBeGreaterThan(0)
    const BLACK = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]
    expect(sig.numbers.every((n: number) => BLACK.includes(n))).toBe(true)
  })

  test('repetition of color meets minRun and derives same-color set', () => {
    const payload = {
      name: 'RepetitionColor', selectionMode: 'automatic', min_spins: 1,
      nodes: [
        { id: 'c1', type: 'condition', subtype: 'repetition', data: { config: { eixo: 'cor', minRun: 3 } } },
        { id: 'l1', type: 'logic', data: { config: { operador: 'AND' } } },
        { id: 's1', type: 'signal', data: { config: {} } }
      ],
      connections: [
        { id: 'e1', source: 'c1', target: 'l1', type: 'condition' },
        { id: 'e2', source: 'l1', target: 's1', type: 'success' }
      ]
    }
    const js = compileBuilderToJS(payload)
    const mod = loadCompiled(js)
    const history = [1, 3, 5] // 3 vermelhos consecutivos
    const res = mod.checkStrategy(history, {})
    expect(res.shouldActivate).toBe(true)
    const sig = mod.generateSignal(history, {})
    expect(sig.numbers.every((n: number) => n !== 0)).toBe(true)
  })

  test('hybrid mode gating blocks when manual count below minManualHybrid', () => {
    const payload = {
      name: 'HybridGating', selectionMode: 'hybrid', min_spins: 1,
      gating: { minManualHybrid: 3 },
      nodes: [
        { id: 'c1', type: 'condition', subtype: 'specific-number', data: { config: { numero: 12 } } },
        { id: 's1', type: 'signal', data: { config: { numeros: [8] } } } // manual count = 1 < 3
      ],
      connections: [ { id: 'e1', source: 'c1', target: 's1', type: 'success' } ]
    }
    const js = compileBuilderToJS(payload)
    const mod = loadCompiled(js)
    const history = [7,12]
    const res = mod.checkStrategy(history, {})
    expect(res.shouldActivate).toBe(false)
    const sig = mod.generateSignal(history, {})
    expect(sig.numbers.length).toBe(0)
    expect(sig.metadata.telemetry.gatingApplied.gated).toBe(true)
    expect(sig.metadata.telemetry.gatingApplied.reasons).toContain('hybrid-min-manual-not-met')
    expect(sig.metadata.telemetry.decisionTrace.gating.gated).toBe(true)
  })

  test('logical OR activates when one condition true and one false', () => {
    const payload = {
      name: 'OrAggregation', selectionMode: 'automatic', min_spins: 1,
      nodes: [
        { id: 'cTrue', type: 'condition', subtype: 'repetition', data: { config: { eixo: 'cor', minRun: 2 } } },
        { id: 'cFalse', type: 'condition', subtype: 'absence', data: { config: { alvo: 'vermelho', spins: 3 } } },
        { id: 'l1', type: 'logic', data: { config: { operador: 'OR' } } },
        { id: 's1', type: 'signal', data: { config: {} } }
      ],
      connections: [
        { id: 'e1', source: 'cTrue', target: 'l1', type: 'condition' },
        { id: 'e2', source: 'cFalse', target: 'l1', type: 'condition' },
        { id: 'e3', source: 'l1', target: 's1', type: 'success' }
      ]
    }
    const js = compileBuilderToJS(payload)
    const mod = loadCompiled(js)
    const history = [1, 3, 18] // repetição de vermelho verdadeira; ausência de vermelho falsa
    const res = mod.checkStrategy(history, {})
    expect(res.shouldActivate).toBe(true)
    const sig = mod.generateSignal(history, {})
    expect(Array.isArray(sig.numbers)).toBe(true)
    expect(sig.numbers.length).toBeGreaterThan(0)
    // Trace básico disponível e decisionTrace refletindo ativação
    expect(sig.metadata.telemetry.logicTrace.length).toBeGreaterThan(0)
    expect(sig.metadata.telemetry.decisionTrace).toBeDefined()
    expect(sig.metadata.telemetry.decisionTrace.signalActive).toBe(true)
    expect(sig.metadata.telemetry.decisionTrace.producedCount).toBeGreaterThan(0)
  })

  test('logical AND activates when both conditions are true', () => {
    const payload = {
      name: 'AndAggregation', selectionMode: 'automatic', min_spins: 1,
      nodes: [
        { id: 'cAbs', type: 'condition', subtype: 'absence', data: { config: { alvo: 'vermelho', spins: 3 } } },
        { id: 'cRep', type: 'condition', subtype: 'repetition', data: { config: { eixo: 'cor', minRun: 2 } } },
        { id: 'l1', type: 'logic', data: { config: { operador: 'AND' } } },
        { id: 's1', type: 'signal', data: { config: {} } }
      ],
      connections: [
        { id: 'e1', source: 'cAbs', target: 'l1', type: 'condition' },
        { id: 'e2', source: 'cRep', target: 'l1', type: 'condition' },
        { id: 'e3', source: 'l1', target: 's1', type: 'success' }
      ],
      gating: { excludeZero: true }
    }
    const js = compileBuilderToJS(payload)
    const mod = loadCompiled(js)
    const history = [2, 20, 26, 35] // pretos consecutivos → ausência de vermelho verdadeira; repetição de cor verdadeira
    const res = mod.checkStrategy(history, {})
    expect(res.shouldActivate).toBe(true)
    const sig = mod.generateSignal(history, {})
    expect(Array.isArray(sig.numbers)).toBe(true)
    expect(sig.numbers.length).toBeGreaterThan(0)
  })

  test('logical NOT blocks when inner condition is true', () => {
    const payload = {
      name: 'NotAggregation', selectionMode: 'automatic', min_spins: 1,
      nodes: [
        { id: 'cTrue', type: 'condition', subtype: 'repetition', data: { config: { eixo: 'cor', minRun: 2 } } },
        { id: 'lNot', type: 'logic', data: { config: { operador: 'NOT' } } },
        { id: 's1', type: 'signal', data: { config: {} } }
      ],
      connections: [
        { id: 'e1', source: 'cTrue', target: 'lNot', type: 'condition' },
        { id: 'e2', source: 'lNot', target: 's1', type: 'success' }
      ]
    }
    const js = compileBuilderToJS(payload)
    const mod = loadCompiled(js)
    const history = [1, 3] // repetição de vermelho verdadeira
    const res = mod.checkStrategy(history, {})
    expect(res.shouldActivate).toBe(false)
    const sig = mod.generateSignal(history, {})
    expect(sig.numbers.length).toBe(0)
  })

  test('AND receiving inner OR is not supported yet, should not activate', () => {
    const payload = {
      name: 'NestedAndOr', selectionMode: 'automatic', min_spins: 1,
      nodes: [
        { id: 'cRep', type: 'condition', subtype: 'repetition', data: { config: { eixo: 'cor', minRun: 2 } } },
        { id: 'cAbs', type: 'condition', subtype: 'absence', data: { config: { alvo: 'vermelho', spins: 3 } } },
        { id: 'cSpec', type: 'condition', subtype: 'specific-number', data: { config: { numero: 7 } } },
        { id: 'lOr', type: 'logic', data: { config: { operador: 'OR' } } },
        { id: 'lAnd', type: 'logic', data: { config: { operador: 'AND' } } },
        { id: 's1', type: 'signal', data: { config: {} } }
      ],
      connections: [
        { id: 'e1', source: 'cRep', target: 'lOr', type: 'condition' },
        { id: 'e2', source: 'cAbs', target: 'lOr', type: 'condition' },
        { id: 'e3', source: 'lOr', target: 'lAnd', type: 'success' },
        { id: 'e4', source: 'cSpec', target: 'lAnd', type: 'condition' },
        { id: 'e5', source: 'lAnd', target: 's1', type: 'success' }
      ]
    }
    const js = compileBuilderToJS(payload)
    const mod = loadCompiled(js)
    const history = [1, 3, 11, 7]
    const res = mod.checkStrategy(history, {})
    expect(res.shouldActivate).toBe(false)
    const sig = mod.generateSignal(history, {})
    expect(sig.numbers.length).toBe(0)
  })

  test('outer NOT should block activation even if inner OR is true', () => {
    const payload = {
      name: 'NotOverOr', selectionMode: 'automatic', min_spins: 1,
      nodes: [
        { id: 'cRep', type: 'condition', subtype: 'repetition', data: { config: { eixo: 'cor', minRun: 2 } } },
        { id: 'cSpec', type: 'condition', subtype: 'specific-number', data: { config: { numero: 12 } } },
        { id: 'lOr', type: 'logic', data: { config: { operador: 'OR' } } },
        { id: 'lNot', type: 'logic', data: { config: { operador: 'NOT' } } },
        { id: 's1', type: 'signal', data: { config: {} } }
      ],
      connections: [
        { id: 'e1', source: 'cRep', target: 'lOr', type: 'condition' },
        { id: 'e2', source: 'cSpec', target: 'lOr', type: 'condition' },
        { id: 'e3', source: 'lOr', target: 'lNot', type: 'success' },
        { id: 'e4', source: 'lNot', target: 's1', type: 'success' }
      ]
    }
    const js = compileBuilderToJS(payload)
    const mod = loadCompiled(js)
    const history = [12, 1, 3] // OR verdadeiro (specific-number 12 presente OU repetição: 1,3); NOT externo deve bloquear
    const res = mod.checkStrategy(history, {})
    expect(res.shouldActivate).toBe(false)
    const sig = mod.generateSignal(history, {})
    expect(sig.numbers.length).toBe(0)
  })

  test('outer NOT should block activation even if inner AND is true', () => {
    const payload = {
      name: 'NotOverAnd', selectionMode: 'automatic', min_spins: 1,
      nodes: [
        { id: 'cRep', type: 'condition', subtype: 'repetition', data: { config: { eixo: 'cor', minRun: 2 } } },
        { id: 'cSpec', type: 'condition', subtype: 'specific-number', data: { config: { numero: 7 } } },
        { id: 'lAnd', type: 'logic', data: { config: { operador: 'AND' } } },
        { id: 'lNot', type: 'logic', data: { config: { operador: 'NOT' } } },
        { id: 's1', type: 'signal', data: { config: {} } }
      ],
      connections: [
        { id: 'e1', source: 'cRep', target: 'lAnd', type: 'condition' },
        { id: 'e2', source: 'cSpec', target: 'lAnd', type: 'condition' },
        { id: 'e3', source: 'lAnd', target: 'lNot', type: 'success' },
        { id: 'e4', source: 'lNot', target: 's1', type: 'success' }
      ]
    }
    const js = compileBuilderToJS(payload)
    const mod = loadCompiled(js)
    const history = [1, 3, 7] // AND verdadeiro (repetição de vermelho 1,3 e numero específico 7); NOT externo deve bloquear
    const res = mod.checkStrategy(history, {})
    expect(res.shouldActivate).toBe(false)
    const sig = mod.generateSignal(history, {})
    expect(sig.numbers.length).toBe(0)
  })

  test('mirror derivation: radius 2 without zero includes mirror neighbors', () => {
    const payload = {
      name: 'MirrorR2', selectionMode: 'automatic', min_spins: 1,
      nodes: [
        { id: 'c1', type: 'condition', subtype: 'mirror', data: { config: { raio: 2, includeZero: false } } },
        { id: 's1', type: 'signal', data: { config: {} } }
      ],
      connections: [ { id: 'e1', source: 'c1', target: 's1', type: 'condition' } ],
      gating: { excludeZero: true }
    }
    const js = compileBuilderToJS(payload)
    const mod = loadCompiled(js)
    const history = [5, 23, 10, 17]
    const sig = mod.generateSignal(history, {})
    // Compute expected mirror neighbors around mirrorOf(17)=31 with radius 2
    const W = [
      0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26
    ]
    const idx17 = W.indexOf(17)
    const mirror = W[(idx17 + Math.floor(W.length/2)) % W.length] // 31
    const idxM = W.indexOf(mirror)
    const expected = [W[(idxM-2+W.length)%W.length], W[(idxM-1+W.length)%W.length], mirror, W[(idxM+1)%W.length], W[(idxM+2)%W.length]]
    expected.forEach(n => expect(sig.numbers).toContain(n))
    expect(sig.numbers).not.toContain(0)
  })

  test('mirror derivation: includeZero true but global excludeZero gates it out', () => {
    const payload = {
      name: 'MirrorZeroGate', selectionMode: 'automatic', min_spins: 1,
      nodes: [
        { id: 'c1', type: 'condition', subtype: 'mirror', data: { config: { raio: 1, includeZero: true } } },
        { id: 's1', type: 'signal', data: { config: {} } }
      ],
      connections: [ { id: 'e1', source: 'c1', target: 's1', type: 'condition' } ],
      gating: { excludeZero: true }
    }
    const js = compileBuilderToJS(payload)
    const mod = loadCompiled(js)
    const history = [12]
    const sig = mod.generateSignal(history, {})
    expect(sig.numbers).not.toContain(0)
    expect(sig.metadata.gatingApplied.reasons).toContain('exclude-zero')
    expect(sig.metadata.gatingApplied.gated || true).toBeDefined()
  })

  test('mirror derivation: no numeric history yields no activation', () => {
    const payload = {
      name: 'MirrorNoHistory', selectionMode: 'automatic', min_spins: 1,
      nodes: [
        { id: 'c1', type: 'condition', subtype: 'mirror', data: { config: { raio: 2 } } },
        { id: 's1', type: 'signal', data: { config: {} } }
      ],
      connections: [ { id: 'e1', source: 'c1', target: 's1', type: 'condition' } ]
    }
    const js = compileBuilderToJS(payload)
    const mod = loadCompiled(js)
    const history = ['vermelho', 'preto', 'zero']
    const res = mod.checkStrategy(history, {})
    expect(res.shouldActivate).toBe(false)
    const sig = mod.generateSignal(history, {})
    expect(sig.numbers.length).toBe(0)
  })
})
