# Builder MVP 80/20 — Cortes e Simplificações

Este documento lista todas as simplificações aplicadas ao Builder para focar no essencial (80/20) e acelerar a criação de estratégias que geram sinais. Os testes de estratégia, por decisão de produto, serão realizados apenas com histórico real.

## Objetivo
- Entregar um fluxo simples e funcional: Trigger → Conditions (até 2) → Logic (AND) → Signal (manual).
- Remover opções avançadas que confundem e não são necessárias no MVP.
- Fixar campos que geram ambiguidade (modo de seleção, operadores) para reduzir atrito do usuário.

## Cortes na Toolbox
- Condições mantidas:
  - `Ausência de Evento` (subtype: `absence`)
  - `Tendência/Frequência` (subtype: `trend`)
  - `Repetição de Evento` (subtype: `repetition`)
- Condições removidas:
  - `pattern`, `break`, `neighbors`, `repeat-number`, `time-window`, `sequence`, `sequence_custom`, `specific-number`, `alternation`, `setorDominante`, `dozen_hot`, `column_hot`, `mirror`.

## Lógica
- `Operador Lógico` (subtype: `operator`) fixado em `AND`.
- Removidas opções `OR` e `NOT`.

## Signal
- `Gerar Sinal` (subtype: `emit`) com configuração mínima:
  - `acao: 'emitir_sinal'`
  - `prioridade: 'normal'`
  - `selectionMode: 'manual'` (fixo)
  - `numeros: number[]`
  - `stake: number`
- Campos removidos (MVP):
  - `protecaoTipo`, `protecaoLimite`, `limiteRodadas`, `excludeZero`, `maxNumbersAuto`, `maxNumbersHybrid`, `minManualHybrid`.

## Painel de Propriedades
- Trigger: `janela`.
- Ausência: `evento`, `rodadasSemOcorrer`.
- Tendência: `evento`, `janela`, `frequenciaMinima`.
- Repetição: `evento`, `ocorrencias`.
- Lógica: `operador` com opções apenas `['AND']` (pode ser omitido para fixar).
- Sinal: `acao`, `mensagem`, `prioridade (normal)`, `selectionMode (manual)`, `numeros`, `stake`.

## Fluxo Visual Padrão
- Topo: `Analisar Janela`.
- Meio: 1–2 condições paralelas.
- Depois: `Operador Lógico (AND)` recebendo as condições como entradas.
- Final: `Gerar Sinal (manual)` conectado ao operador lógico.

## Critérios de Aceite
- Usuário só vê 3 condições essenciais.
- Operador lógico sem opção de alterar (sempre AND).
- Signal em modo manual, sem campos avançados.
- Relatório de teste só com histórico real; ao satisfazer condições e preencher `numeros`, deve mostrar “Sinal Gerado”.

## Referências de Código
- Arquivo: `app/config/builderSpec.ts`
  - Toolbox: categorias e nós.
  - Canvas: `exampleFlow` permanece como referência visual.
  - PropertiesPanel: campos por tipo e subtype.

## Próximos Passos (além do MVP)
- Reintroduzir modos `hybrid/automatic` com derivação controlada.
- Adicionar operadores `OR`/`NOT` com UX educativo (tooltips e exemplos).
- Incluir proteção/compounding com limites e validações.
- Suporte a templates prontos para iniciantes.

## Observações sobre Testes
- Testes de estratégia devem usar exclusivamente histórico real.
- Evitar modo manual de origem da janela para testes; preferir leitura do histórico do sistema.

---
Última atualização: MVP inicial focado em gerar sinais simples com confiabilidade e clareza.