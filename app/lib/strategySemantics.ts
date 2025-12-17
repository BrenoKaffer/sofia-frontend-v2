// Semântica e avaliadores para o Builder de Estratégias
// Fornece parsing de histórico simulado e avaliação de nós de condição e lógica

export type Token = 'vermelho' | 'preto' | 'zero' | number

function normalizeToken(raw: string): Token | null {
  const s = raw.trim().toLowerCase()
  if (!s) return null
  if (s === 'vermelho' || s === 'red') return 'vermelho'
  if (s === 'preto' || s === 'black') return 'preto'
  if (s === 'zero' || s === '0') return 'zero'
  const n = Number(s)
  if (!Number.isNaN(n) && n >= 0 && n <= 36) return n
  // par/ímpar serão tratados como eventos no match
  return s as any // permite usar tokens customizados quando necessário
}

export function parseHistoryInput(input: string): Token[] {
  if (!input) return []
  return input
    .split(',')
    .map(t => normalizeToken(t))
    .filter((t): t is Token => t !== null)
}

function isPar(num: number): boolean { return num % 2 === 0 }
function isImpar(num: number): boolean { return num % 2 === 1 }

function tokenMatchesEvent(token: Token, evento: string): boolean {
  const e = (evento || '').trim().toLowerCase()
  if (e === 'vermelho') return token === 'vermelho' || (typeof token === 'number' && [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(token))
  if (e === 'preto') return token === 'preto' || (typeof token === 'number' && [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35].includes(token))
  if (e === 'zero') return token === 'zero' || token === 0
  if (e === 'par') return typeof token === 'number' && isPar(token)
  if (e === 'ímpar' || e === 'impar') return typeof token === 'number' && isImpar(token)
  if (e.startsWith('numero:')) {
    const n = Number(e.split(':')[1])
    return typeof token === 'number' && token === n
  }
  // fallback: string literal matching
  return String(token) === e
}

function matchSequenceExact(history: Token[], seq: Token[]): boolean {
  if (seq.length === 0) return false
  if (history.length < seq.length) return false
  const start = history.length - seq.length
  for (let i = 0; i < seq.length; i++) {
    if (String(history[start + i]) !== String(seq[i])) return false
  }
  return true
}

function matchSequencePartial(history: Token[], seq: Token[]): boolean {
  if (seq.length === 0) return false
  if (history.length < seq.length) return false
  // procura sequência contígua em qualquer posição das últimas N entradas
  const N = Math.min(history.length, seq.length + 10)
  for (let start = history.length - N; start <= history.length - seq.length; start++) {
    let ok = true
    for (let i = 0; i < seq.length; i++) {
      if (String(history[start + i]) !== String(seq[i])) { ok = false; break }
    }
    if (ok) return true
  }
  return false
}

export function evaluateConditionNode(node: any, history: Token[]): boolean {
  const subtype: string = node.subtype || node?.data?.conditionType || ''
  const cfg = node?.data?.config || {}

  switch (subtype) {
    case 'repetition': {
      const evento: string = cfg.evento || 'vermelho'
      const ocorrencias: number = Number(cfg.ocorrencias ?? 3)
      if (history.length < ocorrencias) return false
      for (let i = history.length - ocorrencias; i < history.length; i++) {
        if (!tokenMatchesEvent(history[i], evento)) return false
      }
      return true
    }
    case 'absence': {
      const evento: string = (cfg.evento || 'zero').toLowerCase()
      const rodadas: number = Number(cfg.rodadasSemOcorrer ?? 10)
      const slice = history.slice(-rodadas)
      if (evento === 'numero') {
        const alvo: number = Number(cfg.numeroAlvo ?? cfg.numero ?? NaN)
        if (Number.isNaN(alvo)) return false
        return slice.every(t => t !== alvo)
      }
      return slice.every(t => !tokenMatchesEvent(t, evento))
    }
    case 'trend': {
      const evento: string = cfg.evento || 'vermelho'
      const janela: number = Number(cfg.janela ?? 10)
      const freqMin: number = Number(cfg.frequenciaMinima ?? 0.6)
      const slice = history.slice(-janela)
      if (slice.length === 0) return false
      const matchCount = slice.filter(t => tokenMatchesEvent(t, evento)).length
      const freq = matchCount / slice.length
      return freq >= freqMin
    }
    case 'pattern': {
      const seqRaw: string[] = Array.isArray(cfg.sequencia) ? cfg.sequencia : []
      const modo: string = (cfg.modo || 'exato').toLowerCase()
      const seq: Token[] = seqRaw.map(normalizeToken).filter((t): t is Token => t !== null)
      if (modo === 'exato') return matchSequenceExact(history, seq)
      return matchSequencePartial(history, seq)
    }
    case 'sequence': {
      // alias para pattern.exato
      const seqRaw: string[] = Array.isArray(cfg.sequencia) ? cfg.sequencia : []
      const seq: Token[] = seqRaw.map(normalizeToken).filter((t): t is Token => t !== null)
      return matchSequenceExact(history, seq)
    }
    case 'sequence_custom': {
      const seqRaw: string[] = Array.isArray(cfg.sequencia) ? cfg.sequencia : []
      const modo: string = (cfg.modo || 'exato').toLowerCase()
      const seq: Token[] = seqRaw.map(normalizeToken).filter((t): t is Token => t !== null)
      if (modo === 'exato') return matchSequenceExact(history, seq)
      return matchSequencePartial(history, seq)
    }
    case 'repeat-number': {
      const numero: number = Number(cfg.numero ?? 0)
      const ocorrencias: number = Number(cfg.ocorrencias ?? 2)
      if (history.length < ocorrencias) return false
      for (let i = history.length - ocorrencias; i < history.length; i++) {
        if (history[i] !== numero) return false
      }
      return true
    }
    case 'neighbors': {
      const referencia: number = Number(cfg.numero ?? 0)
      const raio: number = Number(cfg.raio ?? 2)
      const slice = history.slice(-Math.max(raio * 2, 12))
      return slice.some(t => typeof t === 'number' && circularDistance(t, referencia) <= raio)
    }
    case 'break': {
      // interpreta "mínimo" como comprimento mínimo da sequência do evento nas últimas rodadas
      const evento: string = cfg.evento || 'preto'
      const minimo: number = Number(cfg.minimo ?? 3)
      if (history.length === 0) return false
      let run = 0
      for (let i = history.length - 1; i >= 0; i--) {
        if (tokenMatchesEvent(history[i], evento)) run++
        else break
      }
      return run >= minimo
    }
    case 'time-window': {
      const inicio: number = Number(cfg.inicio ?? 0)
      const fim: number = Number(cfg.fim ?? 9999)
      const len = history.length
      return len >= inicio && len <= fim
    }
    case 'sequence': {
      // alias para pattern.exato
      const seqRaw: string[] = Array.isArray(cfg.sequencia) ? cfg.sequencia : []
      const seq: Token[] = seqRaw.map(normalizeToken).filter((t): t is Token => t !== null)
      return matchSequenceExact(history, seq)
    }
    case 'specific-number': {
      const numero: number = Number(cfg.numero ?? -1)
      const modo: string = String(cfg.modo || 'ocorreu').toLowerCase()
      if (numero < 0 || numero > 36) return false
      if (modo === 'ocorreu') {
        // verifica se o número ocorreu em qualquer posição do histórico
        return history.some(t => typeof t === 'number' && t === numero)
      } else if (modo === 'ausente') {
        const rodadas: number = Number(cfg.rodadasSemOcorrer ?? 10)
        const slice = history.slice(-rodadas)
        return slice.every(t => t !== numero)
      }
      return false
    }
    case 'alternation': {
      const eixo: string = String(cfg.eixo || 'cor').toLowerCase()
      const comprimento: number = Number(cfg.comprimento ?? 4)
      if (comprimento <= 1) return false
      if (history.length < comprimento) return false
      const slice = history.slice(-comprimento)
      if (eixo === 'cor') {
        const cats = slice.map(t => (tokenMatchesEvent(t, 'vermelho') ? 'R' : (tokenMatchesEvent(t, 'preto') ? 'P' : null)))
        if (cats.some(c => c === null)) return false
        for (let i = 1; i < cats.length; i++) {
          if (cats[i] === cats[i - 1]) return false
        }
        return true
      } else if (eixo === 'paridade') {
        const cats = slice.map(t => (typeof t === 'number' ? (t === 0 ? null : (isPar(t) ? 'E' : 'O')) : null))
        if (cats.some(c => c === null)) return false
        for (let i = 1; i < cats.length; i++) {
          if (cats[i] === cats[i - 1]) return false
        }
        return true
      }
      return false
    }
    // Novo: setor dominante
    case 'setorDominante': {
      const setor: string = String(cfg.setor || 'Voisins')
      const janela: number = Math.max(1, Number(cfg.janela ?? 6))
      const freqMin: number = Math.max(1, Number(cfg.frequenciaMinima ?? Math.ceil(janela / 2)))
      if (history.length < janela) return false
      const slice = history.slice(-janela)
      const nums = slice.filter((t): t is number => typeof t === 'number')
      if (nums.length < janela) return false
      const VOISINS = [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25]
      const TIERS = [27,13,36,11,30,8,23,10,5,24,16,33]
      const ORPHELINS = [1,20,14,31,9,17,34,6]
      let set: number[] = VOISINS
      if (setor.toLowerCase().startsWith('tiers')) set = TIERS
      else if (setor.toLowerCase().startsWith('orphel')) set = ORPHELINS
      const count = nums.reduce((acc, n) => acc + (set.includes(n) ? 1 : 0), 0)
      return count >= freqMin
    }
    case 'dozen_hot': {
      const janela: number = Math.max(1, Number(cfg.janela ?? 12))
      const freqMin: number = Math.max(1, Number(cfg.frequenciaMinima ?? 5))
      if (history.length < janela) return false
      const nums = history.slice(-janela).filter((t): t is number => typeof t === 'number')
      if (nums.length < Math.min(janela, 1)) return false
      const inDozen = (n: number) => (n>=1&&n<=12) ? 0 : (n>=13&&n<=24) ? 1 : (n>=25&&n<=36) ? 2 : -1
      const counts = [0,0,0]
      nums.forEach(n => { const d = inDozen(n); if (d>=0) counts[d]++ })
      const maxCount = Math.max(...counts)
      return maxCount >= freqMin
    }
    case 'column_hot': {
      const janela: number = Math.max(1, Number(cfg.janela ?? 12))
      const freqMin: number = Math.max(1, Number(cfg.frequenciaMinima ?? 5))
      if (history.length < janela) return false
      const nums = history.slice(-janela).filter((t): t is number => typeof t === 'number')
      const colOf = (n: number) => (n===0? -1 : (n%3===1? 0 : n%3===2? 1 : 2))
      const counts = [0,0,0]
      nums.forEach(n => { const c = colOf(n); if (c>=0) counts[c]++ })
      const maxCount = Math.max(...counts)
      return maxCount >= freqMin
    }
    case 'mirror': {
      const lastNum = [...history].reverse().find(t => typeof t === 'number') as number | undefined
      return typeof lastNum === 'number'
    }
    default:
      // Semântica não definida: retornar falso para segurança
      return false
  }
}

export function evaluateLogicNode(node: any, connections: Array<{ source: string; target: string }>, nodeResult: Record<string, boolean>): boolean {
  const op = (node?.data?.config?.operador || 'AND').toUpperCase()
  const incoming = connections.filter(c => c.target === node.id).map(c => nodeResult[c.source]).filter(v => typeof v === 'boolean')
  if (incoming.length === 0) return false
  if (op === 'NOT') return !incoming[0]
  if (op === 'OR') return incoming.some(Boolean)
  // default AND
  return incoming.every(Boolean)
}

// Ordem da roda europeia (single-zero) para distância circular
const EUROPEAN_WHEEL: number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6,
  27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29,
  7, 28, 12, 35, 3, 26
]
function wheelIndexOf(n: number): number {
  return EUROPEAN_WHEEL.indexOf(n)
}
function circularDistance(a: number, b: number): number {
  const ia = wheelIndexOf(a), ib = wheelIndexOf(b)
  if (ia < 0 || ib < 0) return Infinity
  const N = EUROPEAN_WHEEL.length
  const diff = Math.abs(ia - ib)
  return Math.min(diff, N - diff)
}