function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function clampInt(val: any, min: number, max: number, fallback: number) {
  const n = Number(val)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, Math.round(n)))
}

export function compileBuilderToJS(payload: any): string {
  const name = payload?.name || 'Estrategia_Sem_Nome'
  const description = payload?.description || 'Estratégia criada via Builder'
  const version = payload?.version || '1.0.0'
  const author = payload?.author || 'SOFIA Builder'
  const category = payload?.category || 'dynamic'
  const min_spins = payload?.min_spins || 10
  const max_numbers = payload?.max_numbers || 6
  const confidence_threshold = payload?.confidence_threshold || 0.6
  const priority = payload?.priority || 1
  const rawSelection = String(payload?.selectionMode || 'automatic').toLowerCase()
  const selectionModeAllowed = ['automatic', 'hybrid']
  const selectionMode = selectionModeAllowed.includes(rawSelection) ? rawSelection : 'automatic'
  const rawGating = payload?.gating || {}
  const gating = {
    maxNumbersAuto: clampInt(rawGating.maxNumbersAuto, 1, 36, 18),
    maxNumbersHybrid: clampInt(rawGating.maxNumbersHybrid, 1, 36, 24),
    minManualHybrid: clampInt(rawGating.minManualHybrid, 1, 36, 1),
    excludeZero: Boolean(rawGating.excludeZero ?? false)
  }
  const graph = { nodes: payload?.nodes || [], connections: payload?.connections || [] }

  const js = `// Estratégia gerada automaticamente pelo SOFIA Strategy Builder

// Constantes e utilitários locais (evitam dependências externas)
const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const BLACK_NUMBERS = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];
const GREEN_NUMBERS = [0];
const EUROPEAN_WHEEL = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6,
  27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29,
  7, 28, 12, 35, 3, 26
];
function wheelIndexOf(n) { return EUROPEAN_WHEEL.indexOf(n) }
function circularDistance(a, b) {
  const ia = wheelIndexOf(a), ib = wheelIndexOf(b);
  if (ia < 0 || ib < 0) return Infinity;
  const N = EUROPEAN_WHEEL.length;
  const diff = Math.abs(ia - ib);
  return Math.min(diff, N - diff);
}
function mirrorOf(n) {
  const idx = wheelIndexOf(n);
  if (idx < 0) return null;
  const N = EUROPEAN_WHEEL.length;
  const oppIdx = (idx + Math.floor(N / 2)) % N;
  return EUROPEAN_WHEEL[oppIdx];
}
function normalizeToken(t) {
  if (typeof t === 'number') return t;
  if (typeof t === 'string') {
    const s = t.trim();
    if (/^\d+$/.test(s)) return Number(s);
    return s;
  }
  if (!t || typeof t !== 'object') return null;
  const n = t.number ?? t.spin_number ?? t.spinNumber ?? t.result ?? t.value ?? t.spin?.number ?? t.spin?.spin_number;
  if (typeof n === 'number') return n;
  if (typeof n === 'string') {
    const s = n.trim();
    if (/^\d+$/.test(s)) return Number(s);
    return s;
  }
  return null;
}
function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.map(normalizeToken).filter((v) => v !== null && v !== undefined);
}
function lastTokenColor(history) {
  if (!history.length) return null;
  const last = history[history.length - 1];
  if (typeof last === 'number') {
    if (last === 0) return 'zero';
    return RED_NUMBERS.includes(last) ? 'vermelho' : 'preto';
  }
  const s = String(last).toLowerCase();
  if (s === 'vermelho' || s === 'red') return 'vermelho';
  if (s === 'preto' || s === 'black') return 'preto';
  if (s === 'zero' || s === '0') return 'zero';
  return null;
}

function numberTerminal(n) {
  return Math.abs(n) % 10;
}

const TERMINAL_NUMBERS_MAP = {
  0: [0, 10, 20, 30],
  1: [1, 11, 21, 31],
  2: [2, 12, 22, 32],
  3: [3, 13, 23, 33],
  4: [4, 14, 24, 34],
  5: [5, 15, 25, 35],
  6: [6, 16, 26, 36],
  7: [7, 17, 27],
  8: [8, 18, 28],
  9: [9, 19, 29]
};

function analyzeTerminalPattern(numbers, cfg = {}) {
  const janela = Math.max(2, Number(cfg.janela ?? cfg.window ?? 6));
  const padrao = String(cfg.padrao ?? 'any').toLowerCase();
  const minStrength = Math.max(1, Number(cfg.minStrength ?? 1));

  const recentNums = numbers.slice(-janela).filter(n => typeof n === 'number');
  if (recentNums.length < 2) return null;
  const terminals = recentNums.map(numberTerminal);

  let best = null;
  const consider = (type, terminal, strength, idx) => {
    if (strength < minStrength) return;
    if (padrao !== 'any' && padrao !== String(type).toLowerCase()) return;
    if (!best) { best = { type, terminal, strength, idx }; return; }
    if (strength > best.strength) { best = { type, terminal, strength, idx }; return; }
    if (strength === best.strength && idx > best.idx) { best = { type, terminal, strength, idx }; return; }
  };

  for (let i = 1; i < terminals.length; i++) {
    if (terminals[i] === terminals[i-1]) consider('consecutive', terminals[i], 2, i);
  }
  for (let i = 2; i < terminals.length; i++) {
    if (terminals[i] === terminals[i-2] && terminals[i] !== terminals[i-1]) consider('alternating', terminals[i], 3, i);
  }
  for (let i = 3; i < terminals.length; i++) {
    if (terminals[i] === terminals[i-3] && terminals[i] !== terminals[i-1] && terminals[i] !== terminals[i-2]) consider('gap_2', terminals[i], 2, i);
  }
  for (let i = 4; i < terminals.length; i++) {
    if (terminals[i] === terminals[i-4] && terminals[i] !== terminals[i-1] && terminals[i] !== terminals[i-2] && terminals[i] !== terminals[i-3]) consider('gap_3', terminals[i], 1, i);
  }

  return best;
}

const METADATA = {
  name: ${JSON.stringify(name)},
  description: ${JSON.stringify(description)},
  version: ${JSON.stringify(version)},
  author: ${JSON.stringify(author)},
  category: ${JSON.stringify(category)},
  created_at: new Date().toISOString(),
  min_spins: ${JSON.stringify(min_spins)},
  max_numbers: ${JSON.stringify(max_numbers)},
  confidence_threshold: ${JSON.stringify(confidence_threshold)},
  priority: ${JSON.stringify(priority)},
  selectionMode: ${JSON.stringify(selectionMode)},
  gating: ${JSON.stringify(gating)},
  schemaVersion: ${JSON.stringify(payload?.schemaVersion || 'v1')}
};

// Grafo do Builder
const STRATEGY_GRAPH = ${JSON.stringify(graph, null, 2)};

function deriveFromGraph(historyRaw, ctx = {}) {
  const history = normalizeHistory(historyRaw);
  const selectionMode = String(ctx.selectionMode || METADATA.selectionMode || 'automatic').toLowerCase();
  const nodes = Array.isArray(STRATEGY_GRAPH?.nodes) ? STRATEGY_GRAPH.nodes : [];
  const signal = nodes.find(n => n?.type === 'signal') || { data: { config: {} }, id: 'signal' };
  const cfg = signal?.data?.config || {};
  const derived = new Set();
  const telemetry = { selectionModeEvaluated: selectionMode, derivedBy: [], logicTrace: [], graphWiring: {}, inputs: { historyLength: history.length, lastToken: history[history.length-1] ?? null } };

  // Helpers de grafo
  const edges = Array.isArray(STRATEGY_GRAPH?.connections) ? STRATEGY_GRAPH.connections : [];
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const incomingEdgesTo = (id) => edges.filter(e => e.target === id);
  const outgoingEdgesFrom = (id) => edges.filter(e => e.source === id);

  telemetry.graphWiring = { nodes: nodes.length, connections: edges.length };

  // Função para avaliar operador lógico
  const evalLogicOp = (op, inputs) => {
    const IN = inputs.filter(v => typeof v === 'boolean');
    if (IN.length === 0) return false;
    const O = String(op || 'AND').toUpperCase();
    if (O === 'NOT') return !IN[0];
    if (O === 'OR') return IN.some(Boolean);
    return IN.every(Boolean); // AND
  };

  // Derivar conjuntos por condições e marcar booleans (true se produzir algo)
  const conditionNodes = nodes.filter(n => n?.type === 'condition');
  const condBool = {};
  for (const node of conditionNodes) {
    const subtype = String(node?.subtype || '').toLowerCase();
    const c = (node?.data?.config || {});
    let produced = 0;
    if (subtype === 'trend') {
      const evento = String(c?.evento ?? c?.event ?? 'vermelho').toLowerCase()
      const janela = Math.max(1, Number(c?.janela ?? c?.window ?? 10))
      const freqMin = Math.max(0, Math.min(1, Number(c?.frequenciaMinima ?? c?.minFrequency ?? 0.7)))
      const recent = history.slice(-janela)

      const isEvento = (t) => {
        if (evento === 'vermelho' || evento === 'red') {
          if (typeof t === 'number') return t !== 0 && RED_NUMBERS.includes(t)
          const s = String(t).toLowerCase()
          return s === 'vermelho' || s === 'red'
        }
        if (evento === 'preto' || evento === 'black') {
          if (typeof t === 'number') return t !== 0 && BLACK_NUMBERS.includes(t)
          const s = String(t).toLowerCase()
          return s === 'preto' || s === 'black'
        }
        if (evento === 'zero' || evento === '0') {
          if (typeof t === 'number') return t === 0
          const s = String(t).toLowerCase()
          return s === 'zero' || s === '0'
        }
        if (evento === 'par' || evento === 'even') {
          if (typeof t !== 'number') return false
          return t !== 0 && t % 2 === 0
        }
        if (evento === 'impar' || evento === 'ímpar' || evento === 'odd') {
          if (typeof t !== 'number') return false
          return t % 2 === 1
        }
        return false
      }

      const total = recent.length
      if (total > 0) {
        const count = recent.reduce((acc, t) => acc + (isEvento(t) ? 1 : 0), 0)
        const freq = count / total
        if (freq >= freqMin) {
          if (evento === 'vermelho' || evento === 'red') RED_NUMBERS.forEach(n => { derived.add(n); produced++; })
          else if (evento === 'preto' || evento === 'black') BLACK_NUMBERS.forEach(n => { derived.add(n); produced++; })
          else if (evento === 'zero' || evento === '0') { derived.add(0); produced++; }
          else if (evento === 'par' || evento === 'even') { for (let n = 2; n <= 36; n += 2) { derived.add(n); produced++; } }
          else if (evento === 'impar' || evento === 'ímpar' || evento === 'odd') { for (let n = 1; n <= 36; n += 2) { derived.add(n); produced++; } }
          telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'trend-frequency', params: { evento, janela, freqMin, count, total } })
        }
      }
    }
    // neighbors
    if (subtype === 'neighbors') {
      const ref = Number(c?.numero ?? -1);
      const raio = Math.max(0, Number(c?.raio ?? 2));
      if (ref >= 0 && ref <= 36) {
        EUROPEAN_WHEEL.forEach(n => { if (circularDistance(n, ref) <= raio) { derived.add(n); produced++; } });
        telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'neighbors-window', params: { referencia: ref, raio } });
      }
    }
    // mirror
    if (subtype === 'mirror') {
      const lastNum = history.slice().reverse().find(t => typeof t === 'number');
      const raio = Math.max(0, Number(c?.raio ?? 2));
      const includeZero = Boolean(c?.includeZero ?? false);
      if (typeof lastNum === 'number') {
        const m = mirrorOf(lastNum);
        if (typeof m === 'number') {
          EUROPEAN_WHEEL.forEach(n => { if (circularDistance(n, m) <= raio) { derived.add(n); produced++; } });
          if (includeZero) { derived.add(0); produced++; }
          telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'mirror-window', params: { last: lastNum, mirror: m, raio, includeZero } });
        }
      }
    }
    // specific-number
    if (subtype === 'specific-number') {
      const numero = Number(c?.numero ?? -1);
      if (numero >= 0 && numero <= 36) {
        derived.add(numero); produced++;
        telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'specific-number', params: { numero } });
      }
    }
    // setorDominante
    if (subtype === 'setorDominante') {
      const setor = String(c?.setor || 'Voisins');
      const VOISINS = [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25];
      const TIERS = [27,13,36,11,30,8,23,10,5,24,16,33];
      const ORPHELINS = [1,20,14,31,9,17,34,6];
      let set = VOISINS;
      if (setor.toLowerCase().startsWith('tiers')) set = TIERS; else if (setor.toLowerCase().startsWith('orphel')) set = ORPHELINS;
      set.forEach(n => { derived.add(n); produced++; });
      telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'dominant-sector', params: { setor } });
    }
    // alternation
    if (subtype === 'alternation') {
      const eixo = String(c?.eixo || 'cor').toLowerCase();
      const last = lastTokenColor(history);
      if (eixo === 'cor' && last && last !== 'zero') {
        const nextCat = last === 'vermelho' ? 'preto' : 'vermelho';
        const set = nextCat === 'vermelho' ? RED_NUMBERS : BLACK_NUMBERS;
        set.forEach(n => { derived.add(n); produced++; });
        telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'alternation-next-color', params: { prev: last, next: nextCat } });
      } else if (eixo === 'paridade') {
        const lastNum = history.slice().reverse().find(t => typeof t === 'number');
        if (typeof lastNum === 'number') {
          const nextParity = lastNum % 2 === 0 ? 'impar' : 'par';
          for (let n = 1; n <= 36; n++) {
            if ((nextParity === 'par' && n % 2 === 0) || (nextParity === 'impar' && n % 2 === 1)) {
              derived.add(n); produced++;
            }
          }
          telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'alternation-next-parity', params: { prev: lastNum, next: nextParity } });
        }
      }
    }
    // absence
    if (subtype === 'absence') {
      const alvo = String(c?.alvo || 'vermelho').toLowerCase();
      const spins = Math.max(1, Number(c?.spins ?? 3));
      const recent = history.slice(-spins);
      const hasAlvo = recent.some(t => {
        if (typeof t === 'number') {
          if (alvo === 'zero') return t === 0;
          if (alvo === 'vermelho') return RED_NUMBERS.includes(t);
          if (alvo === 'preto') return BLACK_NUMBERS.includes(t);
          return false;
        }
        const s = String(t).toLowerCase();
        if (alvo === 'vermelho') return (s === 'vermelho' || s === 'red');
        if (alvo === 'preto') return (s === 'preto' || s === 'black');
        if (alvo === 'zero') return (s === 'zero' || s === '0');
        return false;
      });
      if (!hasAlvo) {
        let set = [];
        if (alvo === 'vermelho') set = BLACK_NUMBERS;
        else if (alvo === 'preto') set = RED_NUMBERS;
        else if (alvo === 'zero') set = Array.from({length: 36}, (_, i) => i + 1);
        set.forEach(n => { derived.add(n); produced++; });
        telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'absence-of', params: { alvo, spins } });
      }
    }
    // repetition
    if (subtype === 'repetition') {
      const eixo = String(c?.eixo || 'cor').toLowerCase();
      const minRun = Math.max(1, Number(c?.minRun ?? 2));
      if (eixo === 'cor') {
        const colors = history.map(t => {
          if (typeof t === 'number') return t === 0 ? 'zero' : (RED_NUMBERS.includes(t) ? 'vermelho' : 'preto');
          const s = String(t).toLowerCase();
          if (s === 'vermelho' || s === 'red') return 'vermelho';
          if (s === 'preto' || s === 'black') return 'preto';
          if (s === 'zero' || s === '0') return 'zero';
          return null;
        }).filter(Boolean);
        let run = 1;
        for (let i = colors.length - 1; i > 0; i--) {
          if (colors[i] && colors[i] === colors[i - 1]) run++; else break;
        }
        if (run >= minRun && colors.length > 0 && colors[colors.length - 1] !== 'zero') {
          const target = colors[colors.length - 1];
          const set = target === 'vermelho' ? RED_NUMBERS : BLACK_NUMBERS;
          set.forEach(n => { derived.add(n); produced++; });
          telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'repetition-of-color', params: { minRun, target } });
        }
      }
    }
    // dozen_hot
    if (subtype === 'dozen_hot') {
      const janela = Math.max(1, Number(c?.janela ?? 12));
      const freqMin = Math.max(1, Number(c?.frequenciaMinima ?? 5));
      const nums = history.slice(-janela).filter(t => typeof t === 'number');
      const DOZENS = [
        Array.from({ length: 12 }, (_, i) => i + 1),
        Array.from({ length: 12 }, (_, i) => i + 13),
        Array.from({ length: 12 }, (_, i) => i + 25)
      ];
      const counts = [0, 0, 0];
      nums.forEach(n => {
        if (n >= 1 && n <= 12) counts[0]++;
        else if (n >= 13 && n <= 24) counts[1]++;
        else if (n >= 25 && n <= 36) counts[2]++;
      });
      const hotIdxs = counts.map((c, i) => ({ c, i })).filter(({ c }) => c >= freqMin).map(({ i }) => i);
      if (hotIdxs.length) {
        hotIdxs.forEach(i => DOZENS[i].forEach(n => { derived.add(n); produced++; }));
        telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'hot-dozens', params: { janela, freqMin, counts } });
      }
    }
    // column_hot
    if (subtype === 'column_hot') {
      const janela = Math.max(1, Number(c?.janela ?? 12));
      const freqMin = Math.max(1, Number(c?.frequenciaMinima ?? 5));
      const nums = history.slice(-janela).filter(t => typeof t === 'number');
      const COL1 = [1,4,7,10,13,16,19,22,25,28,31,34];
      const COL2 = [2,5,8,11,14,17,20,23,26,29,32,35];
      const COL3 = [3,6,9,12,15,18,21,24,27,30,33,36];
      const counts = [0, 0, 0];
      nums.forEach(n => {
        if (COL1.includes(n)) counts[0]++;
        else if (COL2.includes(n)) counts[1]++;
        else if (COL3.includes(n)) counts[2]++;
      });
      const hotIdxs = counts.map((c, i) => ({ c, i })).filter(({ c }) => c >= freqMin).map(({ i }) => i);
      if (hotIdxs.length) {
        if (hotIdxs.includes(0)) COL1.forEach(n => { derived.add(n); produced++; });
        if (hotIdxs.includes(1)) COL2.forEach(n => { derived.add(n); produced++; });
        if (hotIdxs.includes(2)) COL3.forEach(n => { derived.add(n); produced++; });
        telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'hot-columns', params: { janela, freqMin, counts } });
      }
    }
    // sequence_custom
    if (subtype === 'sequence_custom') {
      const sequencia = Array.isArray(c?.sequencia) ? c.sequencia : [];
      const tolerancia = Math.max(0, Number(c?.tolerancia ?? 0));
      if (sequencia.length > 0) {
        const recentNums = history.slice(-sequencia.length).filter(t => typeof t === 'number');
        if (recentNums.length === sequencia.length) {
          let matches = 0;
          for (let i = 0; i < sequencia.length; i++) {
            if (recentNums[i] === sequencia[i]) matches++;
          }
          const matchRate = matches / sequencia.length;
          const requiredRate = Math.max(0, Math.min(1, (sequencia.length - tolerancia) / sequencia.length));
          if (matchRate >= requiredRate) {
            const nextIdx = sequencia.length % sequencia.length;
            const nextNum = sequencia[nextIdx];
            if (typeof nextNum === 'number' && nextNum >= 0 && nextNum <= 36) {
              derived.add(nextNum); produced++;
              telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'sequence-pattern', params: { sequencia, matches, tolerancia } });
            }
          }
        }
      }
    }
    if (subtype === 'recent-in-set') {
      const janela = Math.max(1, Number(c?.janela ?? c?.window ?? 5));
      const set = Array.isArray(c?.set) ? c.set.filter(n => typeof n === 'number') : [];
      const outputNumbers = Array.isArray(c?.outputNumbers) ? c.outputNumbers.filter(n => typeof n === 'number') : [];
      const slice = history.slice(-janela).filter(t => typeof t === 'number');
      const hit = set.length > 0 && slice.some(n => set.includes(n));
      if (hit) {
        const toAdd = (outputNumbers.length ? outputNumbers : set).filter(n => typeof n === 'number' && n >= 0 && n <= 36);
        toAdd.forEach(n => { derived.add(n); produced++; });
        telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'recent-in-set', params: { janela, setSize: set.length, added: toAdd.length } });
      }
    }
    if (subtype === 'adjacent-in-list') {
      const janela = Math.max(2, Number(c?.janela ?? c?.window ?? 6));
      const list = Array.isArray(c?.list) ? c.list.filter(n => typeof n === 'number') : [];
      const circular = Boolean(c?.circular ?? false);
      const outputNumbers = Array.isArray(c?.outputNumbers) ? c.outputNumbers.filter(n => typeof n === 'number') : [];
      const slice = history.slice(-janela).filter(t => typeof t === 'number');
      let hitPair = null;
      if (list.length >= 2 && slice.length >= 2) {
        for (let i = 0; i < slice.length - 1; i++) {
          const a = slice[i];
          const b = slice[i + 1];
          const ia = list.indexOf(a);
          const ib = list.indexOf(b);
          if (ia === -1 || ib === -1) continue;
          const diff = Math.abs(ia - ib);
          const adjacent = diff === 1 || (circular && list.length > 2 && diff === list.length - 1);
          if (adjacent) { hitPair = { a, b, ia, ib }; break; }
        }
      }
      if (hitPair) {
        const toAdd = (outputNumbers.length ? outputNumbers : [hitPair.a, hitPair.b]).filter(n => typeof n === 'number' && n >= 0 && n <= 36);
        toAdd.forEach(n => { derived.add(n); produced++; });
        telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'adjacent-in-list', params: { janela, listSize: list.length, circular, hit: hitPair, added: toAdd.length } });
      }
    }
    if (subtype === 'terminal-pattern') {
      const janela = Math.max(2, Number(c?.janela ?? c?.window ?? 6));
      const includeNeighbors = Boolean(c?.includeNeighbors ?? false);
      const neighborRadius = Math.max(0, Number(c?.neighborRadius ?? c?.raio ?? 0));
      const includeZero = Boolean(c?.includeZero ?? false);
      const nums = history.slice(-janela).filter(t => typeof t === 'number');
      const best = analyzeTerminalPattern(nums, c);
      if (best && typeof best.terminal === 'number') {
        const base = TERMINAL_NUMBERS_MAP[best.terminal] || [];
        base.forEach(n => { derived.add(n); produced++; });
        if (includeNeighbors && neighborRadius > 0) {
          base.forEach(ref => {
            EUROPEAN_WHEEL.forEach(n => { if (circularDistance(n, ref) <= neighborRadius) { derived.add(n); produced++; } });
          });
        }
        if (includeZero) { derived.add(0); produced++; }
        telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'terminal-pattern', params: { janela, best, includeNeighbors, neighborRadius, includeZero } });
      }
    }
    condBool[node.id] = produced > 0;
  }

  // Avaliar nós lógicos
  const logicNodes = nodes.filter(n => n?.type === 'logic');
  const logicBool = {};
  for (const node of logicNodes) {
    const opCfg = node?.data?.config || {};
    const op = String(opCfg.operador ?? opCfg.operator ?? 'AND').toUpperCase();
    const inputs = incomingEdgesTo(node.id)
      .filter(e => byId[e.source]?.type === 'condition')
      .map(e => condBool[e.source] ?? false);
    const hasNestedLogicIncoming = incomingEdgesTo(node.id).some(e => byId[e.source]?.type === 'logic');
    let result = false;
    if (hasNestedLogicIncoming) {
      result = false;
      telemetry.logicTrace.push({ nodeId: node.id, operator: op, inputs, nestedLogic: true, result });
    } else {
      result = evalLogicOp(op, inputs);
      telemetry.logicTrace.push({ nodeId: node.id, operator: op, inputs, result });
    }
    logicBool[node.id] = result;
  }

  // Avaliar sinal
  const signalNodes = nodes.filter(n => n?.type === 'signal');
  let signalActive = false;
  for (const node of signalNodes) {
    const incoming = incomingEdgesTo(node.id);
    const inputs = incoming.map(e => {
      const srcType = byId[e.source]?.type;
      if (srcType === 'condition') return condBool[e.source] ?? false;
      if (srcType === 'logic') return logicBool[e.source] ?? false;
      return false;
    });
    if (inputs.some(Boolean)) {
      signalActive = true;
      telemetry.logicTrace.push({ nodeId: node.id, type: 'signal', inputs, result: true });
      break;
    }
  }

  return { derived: Array.from(derived), signalActive, telemetry };
}

function checkStrategy(history, ctx = {}) {
  const { derived, signalActive, telemetry } = deriveFromGraph(history, ctx);
  const selectionMode = String(ctx.selectionMode || METADATA.selectionMode || 'automatic').toLowerCase();
  const nodes = Array.isArray(STRATEGY_GRAPH?.nodes) ? STRATEGY_GRAPH.nodes : [];
  const signalNode = nodes.find(n => n?.type === 'signal');
  const manualNumbers = Array.isArray(signalNode?.data?.config?.numeros) ? signalNode.data.config.numeros.filter((n) => typeof n === 'number') : [];
  const gating = METADATA.gating || {};

  let shouldActivate = signalActive && derived.length > 0;

  // Para modo híbrido, bloquear ativação se abaixo do mínimo manual
  if (selectionMode === 'hybrid') {
    const minManual = gating.minManualHybrid || 1;
    if (manualNumbers.length < minManual) {
      shouldActivate = false;
      // Marcar gating básico na telemetria para o decisionTrace
      telemetry.gatingApplied = { gated: true, reasons: ['hybrid-min-manual-not-met'] };
    }
  }

  const confidence = shouldActivate ? 0.8 : 0.1;
  const reason = shouldActivate ? 'Lógica satisfeita' : 'Lógica não satisfeita';
  
  return {
    shouldActivate,
    confidence,
    reason,
    telemetry: {
      ...telemetry,
      derivedCount: derived.length,
      signalActive,
      decisionTrace: {
        signalActive,
        producedCount: derived.length,
        gating: telemetry.gatingApplied ? { gated: true, reasons: telemetry.gatingApplied.reasons || [] } : { gated: false, reasons: [] }
      }
    }
  };
}

function generateSignal(history, ctx = {}) {
  const { derived, signalActive, telemetry } = deriveFromGraph(history, ctx);
  const selectionMode = String(ctx.selectionMode || METADATA.selectionMode || 'automatic').toLowerCase();
  const gating = METADATA.gating || {};
  
  let finalNumbers = [...derived];
  const nodes = Array.isArray(STRATEGY_GRAPH?.nodes) ? STRATEGY_GRAPH.nodes : [];
  const signalNode = nodes.find(n => n?.type === 'signal');
  const manualNumbers = Array.isArray(signalNode?.data?.config?.numeros) ? signalNode.data.config.numeros.filter((n) => typeof n === 'number') : [];
  const gatingApplied = { gated: false, reasons: [], originalCount: derived.length, finalCount: 0, excludeZero: Boolean(gating.excludeZero) };

  // Se sinal inativo, bloquear emissão
  if (!signalActive) {
    finalNumbers = [];
    gatingApplied.gated = true;
    gatingApplied.reasons.push('signal-inactive');
  }

  // Híbrido: exigir mínimo de números manuais
  if (selectionMode === 'hybrid' && !gatingApplied.gated) {
    const minManual = gating.minManualHybrid || 1;
    if (manualNumbers.length < minManual) {
      finalNumbers = [];
      gatingApplied.gated = true;
      gatingApplied.reasons.push('hybrid-min-manual-not-met');
    }
  }

  // Aplicar limites de quantidade
  if (!gatingApplied.gated) {
    if (selectionMode === 'automatic') {
      const maxAuto = gating.maxNumbersAuto || 18;
      if (finalNumbers.length > maxAuto) {
        finalNumbers = finalNumbers.slice(0, maxAuto);
        gatingApplied.reasons.push('limit-applied-auto');
      }
    } else if (selectionMode === 'hybrid') {
      const maxHybrid = gating.maxNumbersHybrid || 24;
      if (finalNumbers.length > maxHybrid) {
        finalNumbers = finalNumbers.slice(0, maxHybrid);
        gatingApplied.reasons.push('limit-applied-hybrid');
      }
    }

    // Excluir zero se configurado
    if (gating.excludeZero) {
      const before = finalNumbers.length;
      finalNumbers = finalNumbers.filter(n => n !== 0);
      if (finalNumbers.length < before) gatingApplied.reasons.push('exclude-zero');
    }
  }

  gatingApplied.finalCount = finalNumbers.length;

  return {
    numbers: finalNumbers,
    confidence: signalActive && finalNumbers.length > 0 ? 0.8 : 0.1,
    metadata: {
      selectionMode,
      gatingApplied,
      telemetry: {
        ...telemetry,
        gatingApplied,
        decisionTrace: {
          signalActive,
          producedCount: derived.length,
          gating: { gated: gatingApplied.gated, reasons: gatingApplied.reasons }
        }
      }
    }
  };
}

export { METADATA, checkStrategy, generateSignal }`

  return js
}
