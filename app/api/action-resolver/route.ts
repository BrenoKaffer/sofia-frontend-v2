import { NextResponse } from 'next/server'
import { evaluateConditionNode, parseHistoryInput, evaluateLogicNode } from '../../lib/strategySemantics'

// Constantes de apoio
const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
const BLACK_NUMBERS = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]
const GREEN_NUMBERS = [0]

// Ordem da roda europeia (single-zero) para distância circular
const EUROPEAN_WHEEL: number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6,
  27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29,
  7, 28, 12, 35, 3, 26
]
function wheelIndexOf(n: number): number { return EUROPEAN_WHEEL.indexOf(n) }
function circularDistance(a: number, b: number): number {
  const ia = wheelIndexOf(a), ib = wheelIndexOf(b)
  if (ia < 0 || ib < 0) return Infinity
  const N = EUROPEAN_WHEEL.length
  const diff = Math.abs(ia - ib)
  return Math.min(diff, N - diff)
}

// Setores clássicos (compatível com backend)
const VOISINS = new Set([22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25])
const TIERS = new Set([27,13,36,11,30,8,23,10,5,24,16,33])
const ORPHELINS = new Set([1,20,14,31,9,6,34,17])
function sectorNameOf(n: number): 'Voisins de Zero' | 'Tiers du Cylindre' | 'Orphelins' | 'None' {
  if (!Number.isFinite(n)) return 'None'
  if (VOISINS.has(n)) return 'Voisins de Zero'
  if (TIERS.has(n)) return 'Tiers du Cylindre'
  if (ORPHELINS.has(n)) return 'Orphelins'
  return 'None'
}
function sectorSetOf(name: string): number[] {
  const s = String(name)
  if (s === 'Voisins de Zero') return Array.from(VOISINS)
  if (s === 'Tiers du Cylindre') return Array.from(TIERS)
  if (s === 'Orphelins') return Array.from(ORPHELINS)
  return []
}
function deriveDominantSector(history: Array<string|number>, window = 18, minRatio = 0): { numbers: number[], name?: string, ratio?: number, total?: number } {
  const nums = (history as any[]).filter(t => typeof t === 'number') as number[]
  const last = nums.slice(-Math.max(3, window))
  if (!last.length) return { numbers: [] }
  const counts: Record<string, number> = { 'Voisins de Zero': 0, 'Tiers du Cylindre': 0, 'Orphelins': 0, 'None': 0 }
  last.forEach(n => { counts[sectorNameOf(n)] += 1 })
  const total = last.length
  const entries = Object.entries(counts).filter(([k]) => k !== 'None').sort((a,b) => b[1]-a[1])
  const [bestName, bestCount] = entries[0]
  const ratio = total > 0 ? bestCount/total : 0
  if (ratio < minRatio) return { numbers: [], name: bestName, ratio, total }
  return { numbers: sectorSetOf(bestName), name: bestName, ratio, total }
}
function lastTokenColor(history: Array<string | number>): 'vermelho' | 'preto' | 'zero' | null {
  if (!history.length) return null
  const last = history[history.length - 1]
  if (typeof last === 'number') {
    if (last === 0) return 'zero'
    return RED_NUMBERS.includes(last) ? 'vermelho' : 'preto'
  }
  const s = String(last).toLowerCase()
  if (s === 'vermelho' || s === 'red') return 'vermelho'
  if (s === 'preto' || s === 'black') return 'preto'
  if (s === 'zero' || s === '0') return 'zero'
  return null
}

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}))
    const nodes: any[] = Array.isArray(payload?.nodes) ? payload.nodes : []
    const connections: any[] = Array.isArray(payload?.connections) ? payload.connections : []
    const historyInput: string = String(payload?.historyInput || '')

    if (!nodes.length) return NextResponse.json({ success: false, error: 'nodes required' }, { status: 400 })

    const history = parseHistoryInput(historyInput)

    // Encontrar nó de sinal (onde a ação é apostar e o selectionMode não é manual)
    const signal = nodes.find(n => n?.type === 'signal')
    const cfg = (signal?.data?.config || {})
    const selectionMode: string = String(payload?.selectionMode ?? cfg.selectionMode ?? 'manual').toLowerCase()
    const acao: string = String(cfg.acao || 'emitir_sinal').toLowerCase()

    const telemetry: any = {
      selectionModeEvaluated: selectionMode,
      derivedBy: [] as Array<{ nodeId: string; subtype?: string; reason: string; params?: any }>,
      inputs: { historyLength: history.length, lastToken: history[history.length - 1] ?? null },
      conditionResults: [] as Array<{ nodeId: string; subtype: string; pass: boolean }>,
      logicResults: [] as Array<{ nodeId: string; operator?: string; pass: boolean }>,
    }

    if (acao !== 'apostar') {
      return NextResponse.json({ success: true, mode: selectionMode, derivedNumbers: [], telemetry })
    }

    if (selectionMode === 'manual') {
      const manualNums: number[] = Array.isArray(cfg.numeros) ? cfg.numeros.filter((n: any) => Number.isFinite(n) && n >= 0 && n <= 36) : []
      telemetry.derivedBy.push({ nodeId: signal?.id || 'signal', reason: 'manual-selection', params: { count: manualNums.length } })
      return NextResponse.json({ success: true, mode: selectionMode, derivedNumbers: manualNums, telemetry })
    }

    // Derivação automática/híbrida com base nas condições que passam
    const derived = new Set<number>()
    const nodeResult: Record<string, boolean> = {}

    // Passo 1: avaliar nós de condição e agregar sugestões
    const conditionNodes = nodes.filter(n => n?.type === 'condition')
    for (const node of conditionNodes) {
      const subtype = String(node?.subtype || '')
      const pass = evaluateConditionNode({ subtype: node?.subtype, data: { config: node?.data?.config || {} }, type: 'condition', id: node?.id }, history as any)
      nodeResult[node.id] = pass
      telemetry.conditionResults.push({ nodeId: node.id, subtype, pass })
      if (!pass) continue

      // neighbors: adicionar referência e vizinhos dentro do raio
      if (subtype === 'neighbors') {
        const ref = Number((node?.data?.config || {}).numero ?? -1)
        const raio = Math.max(0, Number((node?.data?.config || {}).raio ?? 2))
        const includeZero = Boolean((node?.data?.config || {}).includeZero ?? true)
        if (ref >= 0 && ref <= 36) {
          const contrib: number[] = []
          EUROPEAN_WHEEL.forEach(n => {
            if (circularDistance(n, ref) <= raio && (includeZero || n !== 0)) { derived.add(n); contrib.push(n) }
          })
          telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'neighbors-window', params: { referencia: ref, raio, includeZero, numbers: contrib } })
        }
      }

      // specific-number: incluir número específico
      if (subtype === 'specific-number') {
        const numero = Number((node?.data?.config || {}).numero ?? -1)
        if (numero >= 0 && numero <= 36) {
          const contrib = [numero]
          derived.add(numero)
          telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'specific-number', params: { numero, numbers: contrib } })
        }
      }

      // setorDominante: incluir todos números do setor
      if (subtype === 'setorDominante' || subtype === 'sector') {
        const cfgLocal = (node?.data?.config || {})
        const setor = String(cfgLocal.setor || cfgLocal.sector || '').trim()
        const win = Number(cfgLocal.window ?? cfgLocal.janela ?? NaN)
        const minRatio = Number(cfgLocal.minRatio ?? cfgLocal.frequenciaMinima ?? NaN)
        const autoMode = Boolean(cfgLocal.auto ?? false) || (Number.isFinite(win) || Number.isFinite(minRatio))

        if (autoMode) {
          const w = Number.isFinite(win) ? win : 18
          const r = Number.isFinite(minRatio) ? minRatio : 0
          const res = deriveDominantSector(history as any, w, r)
          const contrib = res.numbers.slice()
          contrib.forEach(n => derived.add(n))
          telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'sector-dominant-auto', params: { window: w, minRatio: r, sectorName: res.name, ratio: res.ratio, total: res.total, numbers: contrib } })
        } else {
          // Modo estático por nome
          const VOISINS_ARR = Array.from(VOISINS)
          const TIERS_ARR = Array.from(TIERS)
          const ORPHELINS_ARR = Array.from(ORPHELINS)
          let set: number[] = VOISINS_ARR
          if (setor.toLowerCase().startsWith('tiers')) set = TIERS_ARR
          else if (setor.toLowerCase().startsWith('orphel')) set = ORPHELINS_ARR
          const contrib = set.slice()
          set.forEach(n => derived.add(n))
          telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'sector-selection', params: { setor, numbers: contrib } })
        }
      }

      // alternation: prever próxima categoria e incluir números da categoria
      if (subtype === 'alternation') {
        const eixo = String((node?.data?.config || {}).eixo || 'cor').toLowerCase()
        const last = lastTokenColor(history as any)
        if (eixo === 'cor' && last && last !== 'zero') {
          const nextCat = last === 'vermelho' ? 'preto' : 'vermelho'
          const set = nextCat === 'vermelho' ? RED_NUMBERS : BLACK_NUMBERS
          const contrib = set.slice()
          set.forEach(n => derived.add(n))
          telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'alternation-next-color', params: { prev: last, next: nextCat, numbers: contrib } })
        } else if (eixo === 'paridade') {
          const lastNum = (history as any[]).slice().reverse().find(t => typeof t === 'number') as number | undefined
          if (typeof lastNum === 'number') {
            const nextCat = (lastNum % 2 === 0) ? 'ímpar' : 'par'
            const set = nextCat === 'par' ? BLACK_NUMBERS.filter(n => n % 2 === 0).concat(RED_NUMBERS.filter(n => n % 2 === 0)) : BLACK_NUMBERS.filter(n => n % 2 === 1).concat(RED_NUMBERS.filter(n => n % 2 === 1))
            const contrib = set.slice()
            set.forEach(n => derived.add(n))
            telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'alternation-next-parity', params: { prev: (lastNum % 2 === 0) ? 'par' : 'ímpar', next: nextCat, numbers: contrib } })
          }
        }
      }

      // sequence_custom: se condição for satisfeita, prever próximo token e derivar números
      if (subtype === 'sequence_custom') {
        const cfg = (node?.data?.config || {}) as any
        const seqRaw: any[] = Array.isArray(cfg.sequencia) ? cfg.sequencia : []
        const modo: string = String(cfg.modo || 'exato').toLowerCase()
        // Verifica a condição usando semântica padrão
        const condPass = evaluateConditionNode(node, history as any)
        if (condPass && seqRaw.length > 0) {
          // Normaliza próximo token esperado: aqui assumimos repetição do último token
          const nextRaw = seqRaw[seqRaw.length - 1]
          const normalized = String(nextRaw).toLowerCase()
          const localSet = new Set<number>()
          if (normalized === 'vermelho' || normalized === 'red') {
            RED_NUMBERS.forEach(n => { derived.add(n); localSet.add(n) })
          } else if (normalized === 'preto' || normalized === 'black') {
            BLACK_NUMBERS.forEach(n => { derived.add(n); localSet.add(n) })
          } else if (normalized === 'zero' || normalized === '0') {
            derived.add(0); localSet.add(0)
          } else {
            const num = Number(nextRaw)
            if (Number.isFinite(num) && num >= 0 && num <= 36) {
              derived.add(num); localSet.add(num)
            }
          }
          telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'sequence-custom-next-token', params: { modo, sequencia: seqRaw, numbers: Array.from(localSet) } })
        }
      }

      // mirror: incluir oposto diametral do último número e vizinhos pelo raio
      if (subtype === 'mirror') {
        const lastNum = (history as any[]).slice().reverse().find(t => typeof t === 'number') as number | undefined
        if (typeof lastNum === 'number') {
          const idx = wheelIndexOf(lastNum)
          const raio = Math.max(0, Number((node?.data?.config || {}).raio ?? 0))
          const includeZero = Boolean((node?.data?.config || {}).includeZero ?? true)
          if (idx >= 0) {
            const oppIdx = (idx + 18) % EUROPEAN_WHEEL.length
            const opposite = EUROPEAN_WHEEL[oppIdx]
            const localSet = new Set<number>()
            if (includeZero || opposite !== 0) { derived.add(opposite); localSet.add(opposite) }
            if (raio > 0) {
              EUROPEAN_WHEEL.forEach(n => {
                if (circularDistance(n, opposite) <= raio && (includeZero || n !== 0)) { derived.add(n); localSet.add(n) }
              })
            }
            telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'mirror-opposite-with-neighbors', params: { last: lastNum, opposite, raio, includeZero, numbers: Array.from(localSet) } })
          }
        }
      }

      // dozen_hot: incluir números da(s) dezena(s) mais quentes na janela
      if (subtype === 'dozen_hot') {
        const janela = Math.max(1, Number((node?.data?.config || {}).janela ?? 12))
        const freqMin = Math.max(1, Number((node?.data?.config || {}).frequenciaMinima ?? 5))
        const nums = (history as any[]).slice(-janela).filter(t => typeof t === 'number') as number[]
        const DOZENS: number[][] = [
          Array.from({ length: 12 }, (_, i) => i + 1),
          Array.from({ length: 12 }, (_, i) => i + 13),
          Array.from({ length: 12 }, (_, i) => i + 25)
        ]
        const counts = [0, 0, 0]
        nums.forEach(n => {
          if (n >= 1 && n <= 12) counts[0]++
          else if (n >= 13 && n <= 24) counts[1]++
          else if (n >= 25 && n <= 36) counts[2]++
        })
        const hotIdxs = counts.map((c, i) => ({ c, i })).filter(({ c }) => c >= freqMin).map(({ i }) => i)
        if (hotIdxs.length) {
          const localSet = new Set<number>()
          hotIdxs.forEach(i => DOZENS[i].forEach(n => { derived.add(n); localSet.add(n) }))
          telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'hot-dozens', params: { janela, freqMin, counts, numbers: Array.from(localSet) } })
        }
      }

      // column_hot: incluir números da(s) coluna(s) mais quentes na janela
      if (subtype === 'column_hot') {
        const janela = Math.max(1, Number((node?.data?.config || {}).janela ?? 12))
        const freqMin = Math.max(1, Number((node?.data?.config || {}).frequenciaMinima ?? 5))
        const nums = (history as any[]).slice(-janela).filter(t => typeof t === 'number') as number[]
        const COL1 = [1,4,7,10,13,16,19,22,25,28,31,34]
        const COL2 = [2,5,8,11,14,17,20,23,26,29,32,35]
        const COL3 = [3,6,9,12,15,18,21,24,27,30,33,36]
        const counts = [0, 0, 0]
        nums.forEach(n => {
          if (COL1.includes(n)) counts[0]++
          else if (COL2.includes(n)) counts[1]++
          else if (COL3.includes(n)) counts[2]++
        })
        const hotIdxs = counts.map((c, i) => ({ c, i })).filter(({ c }) => c >= freqMin).map(({ i }) => i)
        if (hotIdxs.length) {
          const localSet = new Set<number>()
          if (hotIdxs.includes(0)) COL1.forEach(n => { derived.add(n); localSet.add(n) })
          if (hotIdxs.includes(1)) COL2.forEach(n => { derived.add(n); localSet.add(n) })
          if (hotIdxs.includes(2)) COL3.forEach(n => { derived.add(n); localSet.add(n) })
          telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'hot-columns', params: { janela, freqMin, counts, numbers: Array.from(localSet) } })
        }
      }

      // absence: incluir números da categoria que está ausente nas últimas N rodadas
      if (subtype === 'absence') {
        const alvo = String((node?.data?.config || {}).alvo || 'vermelho').toLowerCase()
        const spins = Math.max(1, Number((node?.data?.config || {}).spins ?? 3))
        const recent = (history as any[]).slice(-spins)
        const hasAlvo = recent.some(t => {
          if (typeof t === 'number') {
            if (alvo === 'zero') return t === 0
            if (alvo === 'vermelho') return RED_NUMBERS.includes(t)
            if (alvo === 'preto') return BLACK_NUMBERS.includes(t)
            return false
          }
          const s = String(t).toLowerCase()
          if (alvo === 'vermelho') return (s === 'vermelho' || s === 'red')
          if (alvo === 'preto') return (s === 'preto' || s === 'black')
          if (alvo === 'zero') return (s === 'zero' || s === '0')
          return false
        })
        if (!hasAlvo) {
          let contrib: number[] = []
          if (alvo === 'vermelho') { RED_NUMBERS.forEach(n => derived.add(n)); contrib = RED_NUMBERS.slice() }
          else if (alvo === 'preto') { BLACK_NUMBERS.forEach(n => derived.add(n)); contrib = BLACK_NUMBERS.slice() }
          else if (alvo === 'zero') { derived.add(0); contrib = [0] }
          telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'absence-window', params: { alvo, spins, numbers: contrib } })
        }
      }
    }

    // Passo 2: avaliar nós de lógica e registrar telemetria
    const logicNodes = nodes.filter(n => n?.type === 'logic')
    for (const node of logicNodes) {
      const pass = evaluateLogicNode(node, connections as any, nodeResult)
      nodeResult[node.id] = pass
      telemetry.logicResults.push({ nodeId: node.id, operator: node?.data?.config?.operador || 'AND', pass })
    }

    let derivedNumbers = Array.from(derived).filter(n => Number.isFinite(n) && n >= 0 && n <= 36).sort((a, b) => a - b)

    // Modo híbrido: unir com seleção manual (se houver)
    const manualNums: number[] = Array.isArray(cfg.numeros) ? cfg.numeros.filter((n: any) => Number.isFinite(n) && n >= 0 && n <= 36) : []
    if (selectionMode === 'hybrid') {
      manualNums.forEach(n => derived.add(n))
      derivedNumbers = Array.from(derived).sort((a, b) => a - b)
      telemetry.derivedBy.push({ nodeId: signal?.id || 'signal', reason: 'hybrid-merge', params: { manualCount: manualNums.length, derivedCount: derivedNumbers.length, manualNumbers: manualNums } })
    }

    // Gating e telemetria
    const topGating = (payload?.gating || {}) as any
    const gatingCfg = {
      maxNumbersAuto: topGating.maxNumbersAuto ?? cfg?.maxNumbersAuto,
      maxNumbersHybrid: topGating.maxNumbersHybrid ?? cfg?.maxNumbersHybrid,
      minManualHybrid: topGating.minManualHybrid ?? cfg?.minManualHybrid,
      excludeZero: topGating.excludeZero ?? cfg?.excludeZero
    }
    const maxNumbersAuto = Number.isFinite(Number(gatingCfg.maxNumbersAuto)) ? Number(gatingCfg.maxNumbersAuto) : 18
    const maxNumbersHybrid = Number.isFinite(Number(gatingCfg.maxNumbersHybrid)) ? Number(gatingCfg.maxNumbersHybrid) : 24
    const minManualHybrid = Number.isFinite(Number(gatingCfg.minManualHybrid)) ? Number(gatingCfg.minManualHybrid) : 1
    const excludeZero = Boolean(gatingCfg.excludeZero ?? false)

    const lastNumFromHistory = (history as any[]).slice().reverse().find(t => typeof t === 'number') as number | undefined
    const rankByProximity = (nums: number[], ref?: number) => {
      if (typeof ref !== 'number' || wheelIndexOf(ref) < 0) return nums.slice()
      return nums.slice().sort((a, b) => circularDistance(a, ref) - circularDistance(b, ref))
    }

    const gatingApplied: any = {
      gated: false,
      mode: selectionMode,
      rules: { maxNumbersAuto, maxNumbersHybrid, minManualHybrid, excludeZero },
      preCount: derivedNumbers.length,
      postCount: 0,
      reasons: [] as string[],
    }

    // Regra: híbrido requer mínimo de números manuais
    if (selectionMode === 'hybrid' && manualNums.length < minManualHybrid) {
      gatingApplied.gated = true
      gatingApplied.reasons.push('hybrid-min-manual-not-met')
      derivedNumbers = []
    }

    // Regra: excluir zero se pedido
    if (!gatingApplied.gated && excludeZero) {
      const before = derivedNumbers.length
      derivedNumbers = derivedNumbers.filter(n => n !== 0)
      if (derivedNumbers.length < before) gatingApplied.reasons.push('exclude-zero')
    }

    // Regra: limitar quantidade máxima
    if (!gatingApplied.gated) {
      const maxAllowed = selectionMode === 'hybrid' ? maxNumbersHybrid : maxNumbersAuto
      if (derivedNumbers.length > maxAllowed) {
        gatingApplied.gated = true
        gatingApplied.reasons.push('max-numbers-limit')
        // Heurística: priorizar proximidade ao último número da roleta, se houver
        const ranked = rankByProximity(derivedNumbers, lastNumFromHistory)
        derivedNumbers = ranked.slice(0, maxAllowed)
      }
    }

    // Regra: lógica conectada ao sinal deve passar
    if (!gatingApplied.gated) {
      const logicConnectedToSignal = logicNodes.filter(l => connections.some(c => c.source === l.id && c.target === (signal?.id || 'signal')))
      const anyLogicPass = logicConnectedToSignal.some(l => nodeResult[l.id])
      if (logicConnectedToSignal.length > 0 && !anyLogicPass) {
        gatingApplied.gated = true
        gatingApplied.reasons.push('logic-no-pass')
        derivedNumbers = []
      }
    }

    gatingApplied.postCount = derivedNumbers.length
    telemetry.gatingApplied = gatingApplied

    return NextResponse.json({ success: true, mode: selectionMode, derivedNumbers, telemetry, gated: gatingApplied.gated, gateReasons: gatingApplied.reasons })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || String(e) }, { status: 500 })
  }
}