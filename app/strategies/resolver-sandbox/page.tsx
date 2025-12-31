"use client"
import React, { useMemo, useState } from "react"

type ResolverTelemetry = {
  derivedBy?: Array<{ nodeId: string, subtype?: string, reason?: string, params?: any }>
  gatingApplied?: { gated: boolean, mode?: string, rules?: any, preCount?: number, postCount?: number, reasons?: string[] }
}

export default function ResolverSandboxPage() {
  const [historyInput, setHistoryInput] = useState("vermelho, 17, preto, 32, zero, 8, vermelho")
  const [selectionMode, setSelectionMode] = useState<"auto" | "hybrid">("auto")
  const [manualInput, setManualInput] = useState("17, 8, 22")
  const [excludeZero, setExcludeZero] = useState(false)
  const [maxNumbersAuto, setMaxNumbersAuto] = useState(18)
  const [maxNumbersHybrid, setMaxNumbersHybrid] = useState(24)
  const [minManualHybrid, setMinManualHybrid] = useState(1)

  // Configuradores de nós de condição
  const [useAbsence, setUseAbsence] = useState(true)
  const [absenceEixo, setAbsenceEixo] = useState("cor")
  const [absenceMinSpins, setAbsenceMinSpins] = useState(4)
  const [absenceLastN, setAbsenceLastN] = useState(12)

  const [useRepetition, setUseRepetition] = useState(true)
  const [repetitionMinRun, setRepetitionMinRun] = useState(2)

  const [useRepeatNumber, setUseRepeatNumber] = useState(true)
  const [repeatNumero, setRepeatNumero] = useState(17)
  const [repeatOcorrencias, setRepeatOcorrencias] = useState(2)

  const [response, setResponse] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parseHistory = (src: string): any[] => {
    return src
      .split(/[\,\n]/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(tok => {
        const lower = tok.toLowerCase()
        if (["vermelho", "red"].includes(lower)) return "vermelho"
        if (["preto", "black"].includes(lower)) return "preto"
        if (["zero", "0"].includes(lower)) return "zero"
        const asNum = Number(tok)
        return Number.isFinite(asNum) ? asNum : tok
      })
  }

  const parseManual = (src: string): number[] => {
    return src
      .split(/[\,\n]/)
      .map(s => Number(s.trim()))
      .filter(n => Number.isFinite(n) && n >= 0 && n <= 36)
  }

  const payload = useMemo(() => {
    const numeros = parseManual(manualInput)

    const nodes: any[] = []

    // Nó de sinal conforme esperado pelo resolver
    nodes.push({
      id: "signal",
      type: "signal",
      data: { config: {
        acao: "apostar",
        selectionMode,
        numeros,
        maxNumbersAuto,
        maxNumbersHybrid,
        minManualHybrid,
        excludeZero,
      } },
    })

    // Nós de condição com subtype no nível superior
    if (useAbsence) {
      nodes.push({
        id: "cond-absence",
        type: "condition",
        subtype: "absence",
        data: { config: { eixo: absenceEixo, minSpins: absenceMinSpins, lastN: absenceLastN } },
      })
    }
    if (useRepetition) {
      nodes.push({
        id: "cond-repetition",
        type: "condition",
        subtype: "repetition",
        data: { config: { eixo: "cor", minRun: repetitionMinRun } },
      })
    }
    if (useRepeatNumber) {
      nodes.push({
        id: "cond-repeat-number",
        type: "condition",
        subtype: "repeat-number",
        data: { config: { numero: repeatNumero, ocorrencias: repeatOcorrencias } },
      })
    }

    return {
      selectionMode,
      historyInput, // enviar string para o resolver
      nodes,
      connections: [],
      gating: {
        maxNumbersAuto,
        maxNumbersHybrid,
        minManualHybrid,
        excludeZero,
      },
    }
  }, [historyInput, manualInput, selectionMode, excludeZero, maxNumbersAuto, maxNumbersHybrid, minManualHybrid, useAbsence, absenceEixo, absenceMinSpins, absenceLastN, useRepetition, repetitionMinRun, useRepeatNumber, repeatNumero, repeatOcorrencias])

  const callResolver = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)
    try {
      const res = await fetch("/api/action-resolver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setResponse(json)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  const telemetry: ResolverTelemetry | undefined = response?.telemetry

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto" }}>
      <h1>Resolver Sandbox</h1>
      <p>Teste os avaliadores (absence, repetition, repeat-number) e confira a telemetria e gating.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div>
          <label>
            Histórico (cores ou números)
            <textarea value={historyInput} onChange={e => setHistoryInput(e.target.value)} rows={6} style={{ width: "100%" }} />
          </label>
          <div style={{ marginTop: 12 }}>
            <label>
              Selection Mode
              <select value={selectionMode} onChange={e => setSelectionMode(e.target.value as any)} style={{ width: "100%" }}>
                <option value="auto">auto</option>
                <option value="hybrid">hybrid</option>
              </select>
            </label>
          </div>
          <div style={{ marginTop: 12 }}>
            <label>
              Numeros manuais (0-36, separados por vírgula)
              <input value={manualInput} onChange={e => setManualInput(e.target.value)} style={{ width: "100%" }} />
            </label>
          </div>
          <fieldset style={{ marginTop: 12 }}>
            <legend>Gating</legend>
            <label style={{ display: "block", marginBottom: 8 }}>
              <input type="checkbox" checked={excludeZero} onChange={e => setExcludeZero(e.target.checked)} /> Excluir zero
            </label>
            <label style={{ display: "block", marginBottom: 8 }}>
              Max Numbers Auto
              <input type="number" value={maxNumbersAuto} onChange={e => setMaxNumbersAuto(Number(e.target.value))} />
            </label>
            <label style={{ display: "block", marginBottom: 8 }}>
              Max Numbers Hybrid
              <input type="number" value={maxNumbersHybrid} onChange={e => setMaxNumbersHybrid(Number(e.target.value))} />
            </label>
            <label style={{ display: "block", marginBottom: 8 }}>
              Min Manual Hybrid
              <input type="number" value={minManualHybrid} onChange={e => setMinManualHybrid(Number(e.target.value))} />
            </label>
          </fieldset>
        </div>

        <div>
          <fieldset>
            <legend>Avaliadores</legend>
            <label style={{ display: "block", marginBottom: 8 }}>
              <input type="checkbox" checked={useAbsence} onChange={e => setUseAbsence(e.target.checked)} /> Absence
            </label>
            <div style={{ paddingLeft: 16 }}>
              <label style={{ display: "block", marginBottom: 8 }}>
                Eixo
                <select value={absenceEixo} onChange={e => setAbsenceEixo(e.target.value)}>
                  <option value="cor">cor</option>
                </select>
              </label>
              <label style={{ display: "block", marginBottom: 8 }}>
                minSpins
                <input type="number" value={absenceMinSpins} onChange={e => setAbsenceMinSpins(Number(e.target.value))} />
              </label>
              <label style={{ display: "block", marginBottom: 8 }}>
                lastN
                <input type="number" value={absenceLastN} onChange={e => setAbsenceLastN(Number(e.target.value))} />
              </label>
            </div>

            <label style={{ display: "block", marginBottom: 8 }}>
              <input type="checkbox" checked={useRepetition} onChange={e => setUseRepetition(e.target.checked)} /> Repetition (cor)
            </label>
            <div style={{ paddingLeft: 16 }}>
              <label style={{ display: "block", marginBottom: 8 }}>
                minRun
                <input type="number" value={repetitionMinRun} onChange={e => setRepetitionMinRun(Number(e.target.value))} />
              </label>
            </div>

            <label style={{ display: "block", marginBottom: 8 }}>
              <input type="checkbox" checked={useRepeatNumber} onChange={e => setUseRepeatNumber(e.target.checked)} /> Repeat-number
            </label>
            <div style={{ paddingLeft: 16 }}>
              <label style={{ display: "block", marginBottom: 8 }}>
                numero
                <input type="number" value={repeatNumero} onChange={e => setRepeatNumero(Number(e.target.value))} />
              </label>
              <label style={{ display: "block", marginBottom: 8 }}>
                ocorrencias
                <input type="number" value={repeatOcorrencias} onChange={e => setRepeatOcorrencias(Number(e.target.value))} />
              </label>
            </div>
          </fieldset>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button onClick={callResolver} disabled={loading}>
          {loading ? "Processando..." : "Chamar resolver"}
        </button>
      </div>

      {error && (<div style={{ marginTop: 16, color: "#b00" }}>Erro: {error}</div>)}

      {response && (
        <div style={{ marginTop: 24 }}>
          <h2>Resultado</h2>
          <div>
            <b>success:</b> {String(response.success)}
          </div>
          <div>
            <b>mode:</b> {String(response.mode)}
          </div>
          <div>
            <b>derivedNumbers:</b> {Array.isArray(response.derivedNumbers) ? response.derivedNumbers.join(", ") : ""}
          </div>
          <div>
            <b>gated:</b> {String(response.gated)}
          </div>
          <div>
            <b>gateReasons:</b> {Array.isArray(response.gateReasons) ? response.gateReasons.join(", ") : ""}
          </div>

          <h3 style={{ marginTop: 16 }}>Telemetry</h3>
          {telemetry?.derivedBy && telemetry.derivedBy.length > 0 ? (
            <ul>
              {telemetry.derivedBy.map((d, i) => (
                <li key={i}>
                  nodeId={d.nodeId} subtype={String(d.subtype || "-")} reason={String(d.reason || "-")}
                </li>
              ))}
            </ul>
          ) : (<div>Sem derivedBy</div>)}
          {/* Novos blocos: mostrar conditionResults e logicResults se presentes */}
          {Array.isArray((response?.telemetry as any)?.conditionResults) ? (
            <div style={{ marginTop: 8 }}>
              <div><b>conditionResults:</b></div>
              <ul>
                {((response?.telemetry as any).conditionResults || [])
                  .sort((a: any, b: any) => String(a.nodeId).localeCompare(String(b.nodeId)))
                  .map((c: any, idx: number) => (
                    <li key={idx}>
                      <span>nodeId={String(c.nodeId)} subtype={String(c.subtype || "-")}</span>{" "}
                      <b>pass:</b>{" "}
                      <span style={{ color: c.pass ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{String(c.pass)}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
          {Array.isArray((response?.telemetry as any)?.logicResults) ? (
            <div style={{ marginTop: 8 }}>
              <div><b>logicResults:</b></div>
              <ul>
                {((response?.telemetry as any).logicResults || [])
                  .sort((a: any, b: any) => String(a.nodeId).localeCompare(String(b.nodeId)))
                  .map((l: any, idx: number) => (
                    <li key={idx}>
                      <span>nodeId={String(l.nodeId)}</span>{" "}
                      <b>pass:</b>{" "}
                      <span style={{ color: l.pass ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{String(l.pass)}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
          {telemetry?.gatingApplied ? (
            <div style={{ marginTop: 8 }}>
              <div><b>gated:</b> {String(telemetry.gatingApplied.gated)}</div>
              <div><b>preCount:</b> {String(telemetry.gatingApplied.preCount)}</div>
              <div><b>postCount:</b> {String(telemetry.gatingApplied.postCount)}</div>
              <div><b>reasons:</b> {(telemetry.gatingApplied.reasons || []).join(", ")}</div>
            </div>
          ) : (<div>Sem gatingApplied</div>)}

          <h3 style={{ marginTop: 16 }}>Payload enviados</h3>
          <pre style={{ background: "#f5f5f5", padding: 12, borderRadius: 4 }}>
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}