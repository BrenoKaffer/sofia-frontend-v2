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

const TERMINALS_PULL_DIRECT_MAP = {
  0: [5, 6, 9, 0],
  1: [1, 4, 7, 5],
  2: [2, 5, 6, 4],
  3: [3, 6, 8, 9],
  4: [1, 4, 7, 8],
  5: [0, 5, 7, 2],
  6: [0, 3, 6, 9, 2],
  7: [1, 4, 7, 3],
  8: [3, 4, 8],
  9: [0, 3, 6, 9, 4]
};

const TERMINALS_PULL_TERMINAL_MAP = {
  3: 2,
  5: 2,
  6: 4,
  7: 7,
  8: 5,
  9: 3
};

function digitSum(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  if (n === 0) return 0;
  const s = String(Math.abs(Math.trunc(n)));
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += Number(s[i] || 0);
  return sum;
}

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
  schemaVersion: ${JSON.stringify(payload?.schemaVersion || '1.0.0')}
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
    if (subtype === 'hotnumbers' || subtype === 'hot_numbers') {
      const janela = Math.max(10, Number(c?.janela ?? c?.window ?? 200));
      const ratioMin = Math.max(1, Number(c?.hotThreshold ?? c?.threshold ?? 1.4));
      const minOccurrences = Math.max(1, Number(c?.minOccurrences ?? c?.min_occur ?? 3));
      const maxNumbers = Math.max(1, Math.min(36, Number(c?.maxNumbers ?? c?.max_numbers ?? 8)));
      const includeDue = Boolean(c?.includeDue ?? c?.include_due ?? false);
      const dueGapMin = Math.max(1, Number(c?.dueGapMin ?? c?.due_gap_min ?? 50));
      const excludeZero = Boolean(c?.excludeZero ?? c?.exclude_zero ?? false);
      const dueMaxNumbers = Math.max(0, Math.min(36, Number(c?.dueMaxNumbers ?? c?.due_max_numbers ?? 0)));
      const nums = history.slice(-janela).filter(t => typeof t === 'number');
      if (nums.length >= 10) {
        const freq = {};
        const lastPos = {};
        for (let n = 0; n <= 36; n++) { freq[n] = 0; lastPos[n] = -1; }
        nums.forEach((n, i) => { if (n >= 0 && n <= 36) { freq[n]++; lastPos[n] = i; } });
        const expected = nums.length / 37;
        const hot = [];
        const due = [];
        for (let n = 0; n <= 36; n++) {
          if (excludeZero && n === 0) continue;
          const f = freq[n] || 0;
          const ratio = expected > 0 ? (f / expected) : 0;
          const gap = lastPos[n] === -1 ? nums.length : (nums.length - lastPos[n] - 1);
          if (f >= minOccurrences && ratio >= ratioMin) hot.push({ n, f, ratio, gap });
          if (includeDue && gap >= dueGapMin) due.push({ n, f, ratio, gap });
        }
        hot.sort((a, b) => (b.ratio - a.ratio) || (b.f - a.f) || (b.gap - a.gap));
        const selectedHot = hot.slice(0, maxNumbers);
        selectedHot.forEach(x => { derived.add(x.n); produced++; });
        if (selectedHot.length) {
          telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'hotnumbers', params: { janela, ratioMin, minOccurrences, selected: selectedHot.map(x => ({ n: x.n, ratio: Number(x.ratio.toFixed(2)), f: x.f, gap: x.gap })) } });
        }
        if (includeDue && dueMaxNumbers > 0) {
          due.sort((a, b) => (b.gap - a.gap) || (a.ratio - b.ratio));
          const selectedDue = due.slice(0, dueMaxNumbers);
          selectedDue.forEach(x => { derived.add(x.n); produced++; });
          if (selectedDue.length) {
            telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'hotnumbers-due', params: { dueGapMin, dueMaxNumbers, selected: selectedDue.map(x => ({ n: x.n, gap: x.gap, ratio: Number(x.ratio.toFixed(2)), f: x.f })) } });
          }
        }
      }
    }
    if (subtype === 'mlpattern' || subtype === 'ml_pattern') {
      const mode = String(c?.mode ?? c?.tipo ?? 'auto').toLowerCase();
      const minConfidence = Math.max(0, Math.min(1, Number(c?.minConfidence ?? c?.min_confidence ?? 0.45)));
      const colors = history.map(t => {
        if (typeof t === 'number') return t === 0 ? 'G' : (RED_NUMBERS.includes(t) ? 'R' : 'B');
        const s = String(t).toLowerCase();
        if (s === 'vermelho' || s === 'red') return 'R';
        if (s === 'preto' || s === 'black') return 'B';
        if (s === 'zero' || s === '0' || s === 'green' || s === 'verde') return 'G';
        return null;
      }).filter(Boolean);
      const tryColorSequence = () => {
        const janela = Math.max(20, Number(c?.janelaSeq ?? c?.janela ?? c?.window ?? 200));
        const slice = colors.slice(-janela);
        const minLen = Math.max(3, Math.min(6, Number(c?.minLength ?? c?.min_length ?? 3)));
        const maxLen = Math.max(minLen, Math.min(6, Number(c?.maxLength ?? c?.max_length ?? 6)));
        const minOccurrencesPattern = Math.max(1, Number(c?.minOccurrencesPattern ?? c?.min_occurrences_pattern ?? 3));
        const fixedPattern = String(c?.pattern ?? c?.sequencia ?? '').toUpperCase().replace(/[^RBG]/g, '');
        const fixedPredRaw = String(c?.predicted ?? c?.previsto ?? c?.predictedColor ?? c?.corPrevista ?? '').toUpperCase().trim();
        const fixedPred = fixedPredRaw === 'R' || fixedPredRaw === 'B' || fixedPredRaw === 'G' ? fixedPredRaw : null;
        if (slice.length < minLen + 1) return false;

        const stats = {};
        for (let len = minLen; len <= maxLen; len++) {
          for (let i = 0; i <= slice.length - len - 1; i++) {
            const seq = slice.slice(i, i + len).join('');
            const next = slice[i + len];
            if (!seq || !next) continue;
            if (!stats[seq]) stats[seq] = { R: 0, B: 0, G: 0, total: 0, len };
            stats[seq][next] = (stats[seq][next] || 0) + 1;
            stats[seq].total++;
          }
        }

        const selectPrediction = (seq) => {
          const st = stats[seq];
          if (!st || st.total < minOccurrencesPattern) return null;
          const pR = st.R / st.total;
          const pB = st.B / st.total;
          const pG = st.G / st.total;
          const bestProb = Math.max(pR, pB, pG);
          if (bestProb < minConfidence) return null;
          const predicted = pR === bestProb ? 'R' : (pB === bestProb ? 'B' : 'G');
          return { predicted, confidence: bestProb, occurrences: st.total, len: st.len };
        };

        let pattern = fixedPattern || '';
        let predicted = fixedPred;
        let confidence = 0;
        let occurrences = 0;
        if (pattern) {
          if (slice.length < pattern.length) return false;
          const recent = slice.slice(-pattern.length).join('');
          if (recent !== pattern) return false;
          const auto = selectPrediction(pattern);
          if (!predicted) predicted = auto?.predicted || null;
          confidence = auto?.confidence || Math.max(minConfidence, 0.5);
          occurrences = auto?.occurrences || 0;
        } else {
          let best = null;
          for (let len = maxLen; len >= minLen; len--) {
            const seq = slice.slice(-len).join('');
            const auto = selectPrediction(seq);
            if (!auto) continue;
            if (!best) { best = { seq, ...auto }; continue; }
            if (auto.confidence > best.confidence) { best = { seq, ...auto }; continue; }
            if (auto.confidence === best.confidence && auto.occurrences > best.occurrences) { best = { seq, ...auto }; continue; }
          }
          if (!best) return false;
          pattern = best.seq;
          predicted = best.predicted;
          confidence = best.confidence;
          occurrences = best.occurrences;
        }

        if (!predicted) return false;
        const set = predicted === 'R' ? RED_NUMBERS : predicted === 'B' ? BLACK_NUMBERS : GREEN_NUMBERS;
        set.forEach(n => { derived.add(n); produced++; });
        telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'mlpattern-color-sequence', params: { pattern, predicted, minConfidence, confidence: Number(confidence.toFixed(2)), occurrences } });
        return true;
      };
      const tryHotNumbers = () => {
        const janela = Math.max(10, Number(c?.janela ?? c?.window ?? 200));
        const ratioMin = Math.max(1, Number(c?.hotThreshold ?? c?.threshold ?? 1.3));
        const minOccurrences = Math.max(1, Number(c?.minOccurrences ?? c?.min_occur ?? 3));
        const maxNumbers = Math.max(1, Math.min(36, Number(c?.maxNumbers ?? c?.max_numbers ?? 8)));
        const excludeZero = Boolean(c?.excludeZero ?? c?.exclude_zero ?? false);
        const nums = history.slice(-janela).filter(t => typeof t === 'number');
        if (nums.length < 10) return false;
        const freq = {};
        for (let n = 0; n <= 36; n++) freq[n] = 0;
        nums.forEach(n => { if (n >= 0 && n <= 36) freq[n]++; });
        const expected = nums.length / 37;
        const hot = [];
        for (let n = 0; n <= 36; n++) {
          if (excludeZero && n === 0) continue;
          const f = freq[n] || 0;
          const ratio = expected > 0 ? (f / expected) : 0;
          if (f >= minOccurrences && ratio >= ratioMin) hot.push({ n, f, ratio });
        }
        hot.sort((a, b) => (b.ratio - a.ratio) || (b.f - a.f));
        const selected = hot.slice(0, maxNumbers);
        if (!selected.length) return false;
        selected.forEach(x => { derived.add(x.n); produced++; });
        const confidence = Math.max(minConfidence, Math.min(0.75, selected[0].ratio / 3));
        telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'mlpattern-hot-numbers', params: { janela, ratioMin, minOccurrences, confidence: Number(confidence.toFixed(2)), selected: selected.map(x => ({ n: x.n, ratio: Number(x.ratio.toFixed(2)), f: x.f })) } });
        return true;
      };
      const tryTiming = () => {
        const hours = Array.isArray(c?.hours) ? c.hours.map(h => Number(h)).filter(h => Number.isFinite(h) && h >= 0 && h <= 23) : [];
        const hour = Number(c?.hour);
        const effectiveHours = hours.length ? hours : (Number.isFinite(hour) ? [hour] : []);
        const predictedRaw = String(c?.predicted ?? c?.dominantColor ?? c?.corDominante ?? '').toUpperCase().trim();
        const predicted = predictedRaw === 'R' || predictedRaw === 'B' || predictedRaw === 'G' ? predictedRaw : null;
        if (!effectiveHours.length || !predicted) return false;
        const nowHour = new Date().getHours();
        if (!effectiveHours.includes(nowHour)) return false;
        const set = predicted === 'R' ? RED_NUMBERS : predicted === 'B' ? BLACK_NUMBERS : GREEN_NUMBERS;
        set.forEach(n => { derived.add(n); produced++; });
        telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'mlpattern-timing', params: { hours: effectiveHours, nowHour, predicted, confidence: Math.max(minConfidence, 0.5) } });
        return true;
      };
      let ok = false;
      if (mode === 'color_sequence') ok = tryColorSequence();
      else if (mode === 'hot_numbers') ok = tryHotNumbers();
      else if (mode === 'timing') ok = tryTiming();
      else {
        ok = tryColorSequence() || tryHotNumbers() || tryTiming();
      }
      if (!ok) {
        const outputNumbers = Array.isArray(c?.outputNumbers) ? c.outputNumbers.filter(n => typeof n === 'number' && n >= 0 && n <= 36) : [];
        if (outputNumbers.length) {
          outputNumbers.forEach(n => { derived.add(n); produced++; });
          telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'mlpattern-fallback-outputNumbers', params: { added: outputNumbers.length } });
        }
      }
    }
    if (subtype === 'ensemble') {
      const janela = Math.max(10, Number(c?.janela ?? c?.window ?? 60));
      const maxNumbers = Math.max(1, Math.min(36, Number(c?.maxNumbers ?? 12)));
      const minStrategies = Math.max(1, Number(c?.minStrategies ?? 2));
      const consensusThreshold = Math.max(0, Math.min(1, Number(c?.consensusThreshold ?? c?.threshold ?? 0.4)));
      const includeNeighbors = Boolean(c?.includeNeighbors ?? true);
      const neighborRadius = Math.max(0, Number(c?.neighborRadius ?? c?.raio ?? 2));
      const includeZero = Boolean(c?.includeZero ?? true);
      const excludeZero = Boolean(c?.excludeZero ?? false);

      const microSignals = [];
      const pushSignal = (name, weight, bets, meta = {}) => {
        const clean = Array.isArray(bets) ? bets.filter(n => typeof n === 'number' && n >= 0 && n <= 36) : [];
        const uniq = Array.from(new Set(clean));
        if (uniq.length) microSignals.push({ name, weight, bets: uniq, meta });
      };

      if (Boolean(c?.useTerminalPull ?? true)) {
        const minSpins = Math.max(1, Number(c?.minSpins ?? 1));
        const require3ForTerminalToTerminal = Boolean(c?.require3ForTerminalToTerminal ?? true);
        if (history.length >= minSpins) {
          const lastNum = history.slice().reverse().find(t => typeof t === 'number');
          if (typeof lastNum === 'number') {
            const lastTerminal = numberTerminal(lastNum);
            const directMap = (c?.pullMap && typeof c.pullMap === 'object') ? c.pullMap : TERMINALS_PULL_DIRECT_MAP;
            const terminalToTerminal = (c?.terminalToTerminalMap && typeof c.terminalToTerminalMap === 'object') ? c.terminalToTerminalMap : TERMINALS_PULL_TERMINAL_MAP;
            const allowT2T = !require3ForTerminalToTerminal || history.length >= 3;
            const mappedTerminal = allowT2T ? Number(terminalToTerminal[lastTerminal]) : NaN;
            if (Number.isFinite(mappedTerminal)) {
              const base = TERMINAL_NUMBERS_MAP[mappedTerminal] || [];
              pushSignal('terminal-pull-terminal', 0.3, base, { lastTerminal, mappedTerminal, added: base.length });
            } else {
              const list = Array.isArray(directMap[lastTerminal]) ? directMap[lastTerminal] : [];
              pushSignal('terminal-pull-direct', 0.3, list, { lastTerminal, added: list.length });
            }
          }
        }
      }

      if (Boolean(c?.useTerminalPattern ?? true)) {
        const nums = history.slice(-Math.max(2, Math.min(janela, 200))).filter(t => typeof t === 'number');
        const best = analyzeTerminalPattern(nums, c);
        if (best && typeof best.terminal === 'number') {
          const base = TERMINAL_NUMBERS_MAP[best.terminal] || [];
          let out = base.slice();
          if (includeNeighbors && neighborRadius > 0) {
            base.forEach(ref => {
              EUROPEAN_WHEEL.forEach(n => { if (circularDistance(n, ref) <= neighborRadius) out.push(n); });
            });
          }
          if (includeZero) out.push(0);
          if (excludeZero) out = out.filter(n => n !== 0);
          pushSignal('terminal-pattern', 0.25, out, { best, includeNeighbors, neighborRadius, includeZero, excludeZero });
        }
      }

      if (Boolean(c?.useColdNumbers ?? true)) {
        const ratioMax = Math.max(0, Math.min(1, Number(c?.ratioMax ?? c?.coldThreshold ?? 0.4)));
        const maxLocal = Math.max(1, Math.min(36, Number(c?.coldMaxNumbers ?? c?.maxNumbersCold ?? 10)));
        const slice = history.slice(-janela).filter(t => typeof t === 'number');
        if (slice.length >= Math.min(janela, 10)) {
          const freq = {};
          const lastPos = {};
          for (let n = 0; n <= 36; n++) { freq[n] = 0; lastPos[n] = -1; }
          slice.forEach((n, i) => { if (n >= 0 && n <= 36) { freq[n]++; lastPos[n] = i; } });
          const expected = slice.length / (excludeZero ? 36 : 37);
          const candidates = [];
          for (let n = 0; n <= 36; n++) {
            if (excludeZero && n === 0) continue;
            const f = freq[n] || 0;
            const ratio = expected > 0 ? f / expected : 1;
            if (ratio <= ratioMax) {
              const gap = lastPos[n] === -1 ? slice.length : (slice.length - lastPos[n] - 1);
              const score = gap + (expected - f) * 2;
              candidates.push({ n, f, ratio, gap, score });
            }
          }
          candidates.sort((a, b) => (b.score - a.score) || (a.ratio - b.ratio) || (a.f - b.f));
          const selected = candidates.slice(0, maxLocal).map(x => x.n);
          pushSignal('coldnumbers', 0.25, selected, { janela, ratioMax, selectedCount: selected.length });
        }
      }

      if (Boolean(c?.useTerminalFrequency ?? true)) {
        const imbalanceMin = Math.max(1, Number(c?.imbalanceMin ?? 3));
        const topTerminals = Math.max(1, Math.min(5, Number(c?.topTerminals ?? 3)));
        const hotContinuityMin = Math.max(1, Math.min(5, Number(c?.hotContinuityMin ?? 3)));
        const slice = history.slice(-Math.max(5, Math.min(janela, 500))).filter(t => typeof t === 'number');
        if (slice.length >= 5) {
          const freq = {};
          for (let t = 0; t <= 9; t++) freq[t] = 0;
          slice.forEach(n => { freq[numberTerminal(n)] = (freq[numberTerminal(n)] || 0) + 1; });
          const values = Object.values(freq);
          const maxFreq = Math.max(...values);
          const minFreq = Math.min(...values);
          if ((maxFreq - minFreq) >= imbalanceMin) {
            const sorted = Object.entries(freq).map(([t, f]) => ({ t: Number(t), f: Number(f) })).sort((a, b) => b.f - a.f);
            const last5 = slice.slice(-5).map(n => numberTerminal(n));
            let hotContinuity = 0;
            last5.forEach(t => { if ((freq[t] || 0) >= 3) hotContinuity++; });
            const mode = String(c?.mode ?? 'auto').toLowerCase();
            const useHot = mode === 'hot' ? true : mode === 'cold' ? false : hotContinuity >= hotContinuityMin;
            const selectedTerminals = useHot ? sorted.slice(0, topTerminals) : sorted.slice(-topTerminals);
            const bets = [];
            selectedTerminals.forEach(({ t }) => {
              const base = TERMINAL_NUMBERS_MAP[t] || [];
              base.forEach(n => bets.push(n));
            });
            if (excludeZero) {
              pushSignal('terminal-frequency', 0.2, bets.filter(n => n !== 0), { janela, imbalanceMin, topTerminals, mode, useHot, hotContinuity, selectedTerminals });
            } else {
              pushSignal('terminal-frequency', 0.2, bets, { janela, imbalanceMin, topTerminals, mode, useHot, hotContinuity, selectedTerminals });
            }
          }
        }
      }

      if (microSignals.length >= minStrategies) {
        const totalWeight = microSignals.reduce((sum, s) => sum + (Number(s.weight) || 0), 0) || 1;
        const betWeight = {};
        microSignals.forEach(s => {
          s.bets.forEach(b => {
            betWeight[b] = (betWeight[b] || 0) + (Number(s.weight) || 0);
          });
        });
        const consensusBets = Object.entries(betWeight)
          .filter(([, w]) => (Number(w) / totalWeight) >= consensusThreshold)
          .map(([b]) => Number(b))
          .filter(n => Number.isFinite(n) && n >= 0 && n <= 36)
          .sort((a, b) => a - b);
        const selected = consensusBets.slice(0, maxNumbers);
        if (selected.length) {
          selected.forEach(n => { derived.add(n); produced++; });
          telemetry.derivedBy.push({
            nodeId: node.id,
            subtype,
            reason: 'ensemble-consensus',
            params: {
              janela,
              maxNumbers,
              minStrategies,
              consensusThreshold,
              signals: microSignals.map(s => ({ name: s.name, weight: s.weight, betsCount: s.bets.length })),
              selected
            }
          });
        }
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

    if (subtype === 'terminal-pull') {
      const minSpins = Math.max(1, Number(c?.minSpins ?? 1));
      const require3ForTerminalToTerminal = Boolean(c?.require3ForTerminalToTerminal ?? true);
      if (history.length >= minSpins) {
        const lastNum = history.slice().reverse().find(t => typeof t === 'number');
        if (typeof lastNum === 'number') {
          const lastTerminal = numberTerminal(lastNum);
          const directMap = (c?.pullMap && typeof c.pullMap === 'object') ? c.pullMap : TERMINALS_PULL_DIRECT_MAP;
          const terminalToTerminal = (c?.terminalToTerminalMap && typeof c.terminalToTerminalMap === 'object') ? c.terminalToTerminalMap : TERMINALS_PULL_TERMINAL_MAP;
          const allowT2T = !require3ForTerminalToTerminal || history.length >= 3;
          const mappedTerminal = allowT2T ? Number(terminalToTerminal[lastTerminal]) : NaN;
          if (Number.isFinite(mappedTerminal)) {
            const base = TERMINAL_NUMBERS_MAP[mappedTerminal] || [];
            base.forEach(n => { derived.add(n); produced++; });
            telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'terminal-pull-terminal', params: { lastTerminal, mappedTerminal, added: base.length } });
          } else {
            const list = Array.isArray(directMap[lastTerminal]) ? directMap[lastTerminal] : [];
            list.filter(n => typeof n === 'number' && n >= 0 && n <= 36).forEach(n => { derived.add(n); produced++; });
            telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'terminal-pull-direct', params: { lastTerminal, added: list.length } });
          }
        }
      }
    }

    if (subtype === 'terminal-frequency') {
      const janela = Math.max(5, Number(c?.janela ?? 15));
      const imbalanceMin = Math.max(1, Number(c?.imbalanceMin ?? 3));
      const topTerminals = Math.max(1, Math.min(5, Number(c?.topTerminals ?? 3)));
      const hotContinuityMin = Math.max(1, Math.min(5, Number(c?.hotContinuityMin ?? 3)));
      const slice = history.slice(-janela).filter(t => typeof t === 'number');
      if (slice.length >= janela) {
        const freq = {};
        for (let t = 0; t <= 9; t++) freq[t] = 0;
        slice.forEach(n => { freq[numberTerminal(n)] = (freq[numberTerminal(n)] || 0) + 1; });
        const values = Object.values(freq);
        const maxFreq = Math.max(...values);
        const minFreq = Math.min(...values);
        if ((maxFreq - minFreq) >= imbalanceMin) {
          const sorted = Object.entries(freq).map(([t, f]) => ({ t: Number(t), f: Number(f) })).sort((a, b) => b.f - a.f);
          const last5 = slice.slice(-5).map(n => numberTerminal(n));
          let hotContinuity = 0;
          last5.forEach(t => { if ((freq[t] || 0) >= 3) hotContinuity++; });
          const mode = String(c?.mode ?? 'auto').toLowerCase();
          const useHot = mode === 'hot' ? true : mode === 'cold' ? false : hotContinuity >= hotContinuityMin;
          const selectedTerminals = useHot ? sorted.slice(0, topTerminals) : sorted.slice(-topTerminals);
          selectedTerminals.forEach(({ t }) => {
            const base = TERMINAL_NUMBERS_MAP[t] || [];
            base.forEach(n => { derived.add(n); produced++; });
          });
          telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'terminal-frequency', params: { janela, imbalanceMin, topTerminals, mode, useHot, hotContinuity, selectedTerminals } });
        }
      }
    }

    if (subtype === 'fixed-frequency-set') {
      const janela = Math.max(1, Number(c?.janela ?? 50));
      const minCount = Math.max(1, Number(c?.minCount ?? 2));
      const maxNumbers = Math.max(1, Math.min(36, Number(c?.maxNumbers ?? 6)));
      const set = Array.isArray(c?.set) ? c.set.filter(n => typeof n === 'number' && n >= 0 && n <= 36) : [];
      const slice = history.slice(-janela).filter(t => typeof t === 'number');
      if (set.length && slice.length >= Math.min(janela, 1)) {
        const counts = {};
        set.forEach(n => { counts[n] = 0; });
        slice.forEach(n => { if (counts[n] !== undefined) counts[n]++; });
        const selected = Object.entries(counts)
          .map(([n, c]) => ({ n: Number(n), c: Number(c) }))
          .filter(x => x.c >= minCount)
          .sort((a, b) => (b.c - a.c) || (a.n - b.n))
          .slice(0, maxNumbers);
        selected.forEach(x => { derived.add(x.n); produced++; });
        if (selected.length) telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'fixed-frequency-set', params: { janela, minCount, maxNumbers, selected } });
      }
    }

    if (subtype === 'fixed-underfrequency-set') {
      const janela = Math.max(10, Number(c?.janela ?? 100));
      const multiplier = Math.max(0, Math.min(1, Number(c?.multiplier ?? 0.5)));
      const maxNumbers = Math.max(1, Math.min(36, Number(c?.maxNumbers ?? 8)));
      const set = Array.isArray(c?.set) ? c.set.filter(n => typeof n === 'number' && n >= 0 && n <= 36) : [];
      const slice = history.slice(-janela).filter(t => typeof t === 'number');
      if (set.length && slice.length >= Math.min(janela, 10)) {
        const counts = {};
        set.forEach(n => { counts[n] = 0; });
        slice.forEach(n => { if (counts[n] !== undefined) counts[n]++; });
        const expected = slice.length / (excludeZero ? 36 : 37);
        const threshold = expected * multiplier;
        const selected = Object.entries(counts)
          .map(([n, c]) => ({ n: Number(n), c: Number(c) }))
          .filter(x => x.c <= threshold)
          .sort((a, b) => (a.c - b.c) || (a.n - b.n))
          .slice(0, maxNumbers);
        selected.forEach(x => { derived.add(x.n); produced++; });
        if (selected.length) telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'fixed-underfrequency-set', params: { janela, multiplier, threshold: Number(threshold.toFixed(2)), maxNumbers, selected } });
      }
    }

    if (subtype === 'gap-tracking') {
      const janela = Math.max(5, Number(c?.janela ?? 25));
      const gapMin = Math.max(1, Number(c?.gapMin ?? 15));
      const maxNumbers = Math.max(1, Math.min(36, Number(c?.maxNumbers ?? 2)));
      const targets = Array.isArray(c?.targets) ? c.targets.filter(n => typeof n === 'number' && n >= 0 && n <= 36) : [];
      const slice = history.slice(-janela).filter(t => typeof t === 'number');
      if (targets.length && slice.length >= Math.min(janela, 5)) {
        const gaps = targets.map(target => {
          let gap = 0;
          for (let i = slice.length - 1; i >= 0; i--) {
            if (slice[i] === target) break;
            gap++;
          }
          return { n: target, gap };
        });
        const dormant = gaps.filter(x => x.gap >= gapMin).sort((a, b) => b.gap - a.gap);
        if (dormant.length) {
          const selected = dormant.slice(0, maxNumbers);
          selected.forEach(x => { derived.add(x.n); produced++; });
          telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'gap-tracking', params: { janela, gapMin, maxNumbers, gaps, selected } });
        }
      }
    }

    if (subtype === 'coldnumbers' || subtype === 'cold_numbers') {
      const janela = Math.max(10, Number(c?.janela ?? c?.window ?? 100));
      const ratioMax = Math.max(0, Math.min(1, Number(c?.ratioMax ?? c?.coldThreshold ?? 0.4)));
      const maxNumbers = Math.max(1, Math.min(36, Number(c?.maxNumbers ?? c?.max_numbers ?? 8)));
      const excludeZero = Boolean(c?.excludeZero ?? c?.exclude_zero ?? false);
      const slice = history.slice(-janela).filter(t => typeof t === 'number');
      if (slice.length >= Math.min(janela, 10)) {
        const freq = {};
        const lastPos = {};
        for (let n = 0; n <= 36; n++) { freq[n] = 0; lastPos[n] = -1; }
        slice.forEach((n, i) => { if (n >= 0 && n <= 36) { freq[n]++; lastPos[n] = i; } });
        const expected = slice.length / 37;
        const candidates = [];
        for (let n = 0; n <= 36; n++) {
          if (excludeZero && n === 0) continue;
          const f = freq[n] || 0;
          const ratio = expected > 0 ? f / expected : 1;
          if (ratio <= ratioMax) {
            const gap = lastPos[n] === -1 ? slice.length : (slice.length - lastPos[n] - 1);
            const score = gap + (expected - f) * 2;
            candidates.push({ n, f, ratio: Number(ratio.toFixed(3)), gap, score: Number(score.toFixed(2)) });
          }
        }
        candidates.sort((a, b) => (b.score - a.score) || (a.ratio - b.ratio) || (a.f - b.f));
        const selected = candidates.slice(0, maxNumbers);
        selected.forEach(x => { derived.add(x.n); produced++; });
        if (selected.length) telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'coldnumbers', params: { janela, ratioMax, maxNumbers, selected } });
      }
    }

    if (subtype === 'fibonacci') {
      const fibNumbers = Array.isArray(c?.fibonacciNumbers) ? c.fibonacciNumbers.filter(n => typeof n === 'number' && n >= 0 && n <= 36) : [1, 2, 3, 5, 8, 13, 21, 34];
      const minSpins = Math.max(1, Number(c?.minSpins ?? 30));
      const window = Math.max(10, Number(c?.janela ?? c?.window ?? 50));
      const maxNumbers = Math.max(1, Math.min(fibNumbers.length, Number(c?.maxNumbers ?? 4)));
      if (history.length >= minSpins) {
        const recent = history.slice(-window).filter(t => typeof t === 'number');
        const counts = {};
        fibNumbers.forEach(n => { counts[n] = 0; });
        recent.forEach(n => { if (counts[n] !== undefined) counts[n]++; });
        let fibStreak = 0;
        for (let i = history.length - 1; i >= 0 && fibStreak < 10; i--) {
          const t = history[i];
          if (typeof t === 'number' && fibNumbers.includes(t)) fibStreak++; else break;
        }
        const dormancy = (target) => {
          for (let i = history.length - 1; i >= 0; i--) {
            if (history[i] === target) return history.length - 1 - i;
          }
          return history.length;
        };
        const analysis = fibNumbers.map((n) => {
          const f = counts[n] || 0;
          const d = dormancy(n);
          const pos = fibNumbers.indexOf(n);
          const score = (5 - f) * 2 + Math.min(d / 5, 10) + (fibNumbers.length - pos);
          return { n, f, d, pos, score: Number(score.toFixed(2)) };
        }).sort((a, b) => (b.score - a.score) || (b.d - a.d));
        const selected = analysis.slice(0, maxNumbers);
        selected.forEach(x => { derived.add(x.n); produced++; });
        if (selected.length) telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'fibonacci', params: { minSpins, window, maxNumbers, fibStreak, selected } });
      }
    }

    if (subtype === 'digit-sum' || subtype === 'digitsum' || subtype === 'digit_sum') {
      const minSpins = Math.max(1, Number(c?.minSpins ?? 40));
      const window = Math.max(10, Number(c?.janela ?? c?.window ?? 30));
      const underMultiplier = Math.max(0, Math.min(1, Number(c?.underMultiplier ?? 0.7)));
      const maxNumbers = Math.max(1, Math.min(36, Number(c?.maxNumbers ?? 6)));
      if (history.length >= minSpins) {
        const recent = history.slice(-window).filter(t => typeof t === 'number');
        const counts = {};
        for (let s = 0; s <= 18; s++) counts[s] = 0;
        recent.forEach(n => {
          const sum = digitSum(n);
          if (typeof sum === 'number' && counts[sum] !== undefined) counts[sum]++;
        });
        const avg = recent.length / 19;
        const under = [];
        for (let s = 1; s <= 18; s++) {
          if (counts[s] < avg * underMultiplier) under.push(s);
        }
        if (under.length) {
          const selected = [];
          for (let i = 1; i <= 36 && selected.length < maxNumbers; i++) {
            const s = digitSum(i);
            if (typeof s === 'number' && under.includes(s)) selected.push(i);
          }
          selected.slice(0, maxNumbers).forEach(n => { derived.add(n); produced++; });
          if (selected.length) telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'digit-sum', params: { minSpins, window, underMultiplier, under, maxNumbers, added: Math.min(selected.length, maxNumbers) } });
        }
      }
    }

    if (subtype === 'wheel-neighbors-hot' || subtype === 'wheelneighborshot') {
      const minSpins = Math.max(1, Number(c?.minSpins ?? 40));
      const window = Math.max(10, Number(c?.janela ?? c?.window ?? 25));
      const topN = Math.max(1, Math.min(10, Number(c?.topN ?? 5)));
      const radius = Math.max(1, Math.min(6, Number(c?.radius ?? 2)));
      const maxNumbers = Math.max(1, Math.min(36, Number(c?.maxNumbers ?? 7)));
      if (history.length >= minSpins) {
        const recent = history.slice(-window).filter(t => typeof t === 'number');
        const numberCounts = {};
        for (let i = 0; i <= 36; i++) numberCounts[i] = 0;
        recent.forEach(n => { if (n >= 0 && n <= 36) numberCounts[n]++; });
        const top = Object.entries(numberCounts)
          .map(([n, c]) => ({ n: Number(n), c: Number(c) }))
          .sort((a, b) => (b.c - a.c) || (a.n - b.n))
          .slice(0, topN);
        const neighbors = new Set();
        top.forEach(({ n, c }) => {
          if (c <= 0) return;
          const idx = EUROPEAN_WHEEL.indexOf(n);
          if (idx < 0) return;
          for (let off = -radius; off <= radius; off++) {
            if (off === 0) continue;
            const pos = (idx + off + EUROPEAN_WHEEL.length) % EUROPEAN_WHEEL.length;
            const neigh = EUROPEAN_WHEEL[pos];
            if ((numberCounts[neigh] || 0) <= 1) neighbors.add(neigh);
          }
        });
        const selected = Array.from(neighbors).slice(0, maxNumbers);
        selected.forEach(n => { derived.add(n); produced++; });
        if (selected.length) telemetry.derivedBy.push({ nodeId: node.id, subtype, reason: 'wheel-neighbors-hot', params: { minSpins, window, topN, radius, maxNumbers, top, selected } });
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
