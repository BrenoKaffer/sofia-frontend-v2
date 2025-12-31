import { evaluateConditionNode } from '@/app/lib/strategySemantics';

describe('strategySemantics - conditions', () => {
  describe('absence with evento = numero', () => {
    const history = [3, 12, 0, 18, 22, 33];

    it('returns true when numeroAlvo does not appear in last N rounds', () => {
      const node = {
        subtype: 'absence',
        data: { config: { evento: 'numero', numeroAlvo: 7, rodadasSemOcorrer: 6 } }
      };
      expect(evaluateConditionNode(node, history)).toBe(true);
    });

    it('returns false when numeroAlvo appears in last N rounds', () => {
      const node = {
        subtype: 'absence',
        data: { config: { evento: 'numero', numeroAlvo: 12, rodadasSemOcorrer: 6 } }
      };
      expect(evaluateConditionNode(node, history)).toBe(false);
    });

    it('returns false when numeroAlvo is missing/NaN', () => {
      const node = {
        subtype: 'absence',
        data: { config: { evento: 'numero', rodadasSemOcorrer: 6 } }
      };
      expect(evaluateConditionNode(node, history)).toBe(false);
    });
  });

  describe('specific-number', () => {
    const history = [1, 5, 7, 12, 20, 28, 35];

    it("modo = 'ocorreu' returns true when number occurred anywhere", () => {
      const node = {
        subtype: 'specific-number',
        data: { config: { numero: 12, modo: 'ocorreu' } }
      };
      expect(evaluateConditionNode(node, history)).toBe(true);
    });

    it("modo = 'ocorreu' returns false when number never occurred", () => {
      const node = {
        subtype: 'specific-number',
        data: { config: { numero: 36, modo: 'ocorreu' } }
      };
      expect(evaluateConditionNode(node, history)).toBe(false);
    });

    it("modo = 'ausente' returns true when number absent in last N rounds", () => {
      const node = {
        subtype: 'specific-number',
        data: { config: { numero: 36, modo: 'ausente', rodadasSemOcorrer: 5 } }
      };
      expect(evaluateConditionNode(node, history)).toBe(true);
    });

    it("modo = 'ausente' returns false when number appears within last N rounds", () => {
      const node = {
        subtype: 'specific-number',
        data: { config: { numero: 12, modo: 'ausente', rodadasSemOcorrer: 6 } }
      };
      expect(evaluateConditionNode(node, history)).toBe(false);
    });
  });

  describe('hot groups - dozen_hot and column_hot', () => {
    it('dozen_hot returns true when a dozen dominates within window', () => {
      const history = [1,2,3,4,5,6,7,8,9,10,11,12];
      const node = { subtype: 'dozen_hot', data: { config: { janela: 12, frequenciaMinima: 5 } } };
      expect(evaluateConditionNode(node, history)).toBe(true);
    });

    it('dozen_hot returns false when no dozen meets minimum frequency', () => {
      const history = [1,13,25,2,14,26,3,15,27,4,16,28];
      const node = { subtype: 'dozen_hot', data: { config: { janela: 12, frequenciaMinima: 5 } } };
      expect(evaluateConditionNode(node, history)).toBe(false);
    });

    it('column_hot returns true when a column dominates within window', () => {
      const history = [1,4,7,10,13,16,19,22,25,28,31,34];
      const node = { subtype: 'column_hot', data: { config: { janela: 12, frequenciaMinima: 5 } } };
      expect(evaluateConditionNode(node, history)).toBe(true);
    });

    it('column_hot returns false when no column meets minimum frequency', () => {
      const history = [1,2,3,4,5,6,7,8,9,10,11,12];
      const node = { subtype: 'column_hot', data: { config: { janela: 12, frequenciaMinima: 5 } } };
      expect(evaluateConditionNode(node, history)).toBe(false);
    });
  });

  describe('mirror', () => {
    it('returns true when history has at least one numeric token', () => {
      const history = ['vermelho', 15] as any[];
      const node = { subtype: 'mirror', data: { config: {} } };
      expect(evaluateConditionNode(node, history as any)).toBe(true);
    });

    it('returns false when history has no numeric tokens', () => {
      const history = ['vermelho', 'preto'] as any[];
      const node = { subtype: 'mirror', data: { config: {} } };
      expect(evaluateConditionNode(node, history as any)).toBe(false);
    });
  });

  describe('sequence_custom', () => {
    it("modo 'exato' matches the exact tail sequence", () => {
      const history = ['vermelho','preto','vermelho'] as any[];
      const node = { subtype: 'sequence_custom', data: { config: { sequencia: ['vermelho','preto','vermelho'], modo: 'exato' } } };
      expect(evaluateConditionNode(node, history as any)).toBe(true);
    });

    it("modo 'parcial' matches when sequence appears within the recent window", () => {
      const history = ['zero','preto','vermelho','preto','vermelho'] as any[];
      const node = { subtype: 'sequence_custom', data: { config: { sequencia: ['vermelho','preto'], modo: 'parcial' } } };
      expect(evaluateConditionNode(node, history as any)).toBe(true);
    });
  });
});