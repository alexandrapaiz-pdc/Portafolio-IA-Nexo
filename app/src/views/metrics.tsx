import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { quarterOf, type QuarterMetrics } from "@/lib/domain"
import { isNum, nf } from "@/lib/format"
import { useStore } from "@/lib/store"
import { Input, Textarea } from "@/components/ui/input"
import { Section, SectionHead, SecP } from "@/components/shared"

// Quarterly deployment metrics for my FDE work (not the agents' own KPIs).
// Read by everyone; only editors change them, with autosave. Empty = not measured yet.
type Field = Exclude<keyof QuarterMetrics, "id" | "quarter" | "note">
type Card = { id: string; k: string; unit?: string; sub: string; lower?: boolean; fields: [Field, string][]; value: (m: Partial<QuarterMetrics>) => number | null; fmt?: (n: number) => string }

const pct = (m: Partial<QuarterMetrics>) => (isNum(m.pilots) && m.pilots > 0 && isNum(m.pilotsToProduction) ? Math.round((m.pilotsToProduction / m.pilots) * 100) : null)
const val = (f: Field) => (m: Partial<QuarterMetrics>) => (isNum(m[f]) ? (m[f] as number) : null)
const CARDS: Card[] = [
  { id: "ttv", k: "Tiempo al primer valor", unit: "días", lower: true, sub: "Promedio desde la solicitud hasta algo funcionando con datos reales del equipo.", fields: [["daysToValue", "Días (promedio)"]], value: val("daysToValue") },
  { id: "live", k: "Despliegues con usuarios reales", sub: "Apps o agentes que usa su audiencia, no solo yo.", fields: [["liveWithUsers", "Despliegues"]], value: val("liveWithUsers") },
  { id: "conv", k: "Pilotos → producción", unit: "%", sub: "Pilotos que llegaron a producción: suplente, audiencia abierta, checklist y forma de revertir.", fields: [["pilots", "Pilotos"], ["pilotsToProduction", "A producción"]], value: pct },
  { id: "usd", k: "Ahorro verificado", unit: "US$", sub: "Costo evitado, medido contra una línea base tomada antes de construir.", fields: [["savingsUsd", "US$"]], value: val("savingsUsd") },
  { id: "hrs", k: "Horas manuales liberadas", unit: "h", sub: "Medidas después del lanzamiento, no estimadas.", fields: [["hoursSaved", "Horas"]], value: val("hoursSaved") },
  { id: "blk", k: "Días bloqueado por dependencias", unit: "días", lower: true, sub: "Tiempo esperando a TI, accesos o administradores.", fields: [["daysBlocked", "Días"]], value: val("daysBlocked") },
]

const prevQuarter = (q: string) => { const [y, n] = q.split("-Q").map(Number); return n === 1 ? `${y - 1}-Q4` : `${y}-Q${n - 1}` }
const label = (q: string) => q.replace("-", " · ")
type Save = "idle" | "saving" | "saved" | "error" | "invalid"

export function Metrics() {
  const { metrics, db, canWrite, loaded, noDb } = useStore()
  const now = quarterOf()
  const quarters = [...new Set([now, ...metrics.map((m) => m.quarter || m.id)])].sort().reverse()
  const [q, setQ] = useState(now)
  const byQ = (x: string) => metrics.find((m) => m.id === x)
  const saved = byQ(q)
  const [draft, setDraft] = useState<Partial<QuarterMetrics>>({})
  const [state, setState] = useState<Save>("idle")
  const dirty = useRef(false), timer = useRef(0)

  // Load the saved quarter into the editor, unless there are unsaved edits.
  useEffect(() => { if (!dirty.current) setDraft(saved ? { ...saved } : {}) }, [saved, q])
  useEffect(() => { dirty.current = false; setState("idle") }, [q])
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty.current) e.preventDefault() }
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn)
  }, [])

  const save = (next: Partial<QuarterMetrics>) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(async () => {
      if (!db) return
      const doc: Record<string, unknown> = { quarter: q }
      for (const c of CARDS) for (const [f] of c.fields) doc[f] = isNum(next[f]) ? next[f] : null
      doc.note = next.note?.trim() || null
      if (isNum(doc.pilots) && isNum(doc.pilotsToProduction) && (doc.pilotsToProduction as number) > (doc.pilots as number)) { setState("invalid"); return }
      setState("saving")
      try { await db.doc("metricas/" + q).set(doc); dirty.current = false; setState("saved") } catch { setState("error") }
    }, 800)
  }
  const edit = (f: Field | "note", raw: string) => {
    const v = f === "note" ? raw : raw === "" ? null : Number(raw)
    if (f !== "note" && v !== null && (!Number.isFinite(v) || (v as number) < 0)) return
    const next = { ...draft, [f]: v }
    dirty.current = true; setDraft(next); save(next)
  }

  const shown = canWrite ? draft : saved || {}
  const prev = byQ(prevQuarter(q))
  const history = quarters.map(byQ).filter(Boolean) as QuarterMetrics[]

  return (
    <main className="wrap">
      <section className="grid gap-[18px] pb-6 pt-[88px]">
        <h1 className="h-display">Métricas.<span className="sub">Cómo avanza el trabajo de despliegue, trimestre a trimestre.</span></h1>
        <p className="lead">Seis métricas de mi trabajo como Forward Deployed Engineer: qué tan rápido llega una solicitud a uso real, cuánto se queda ahí y qué valor medido entrega. No son los KPIs de cada agente.</p>
      </section>

      {noDb && <p className="mb-6 rounded-r-sm bg-group px-4 py-3 text-[13px] text-sub">Inicia sesión para ver las métricas.</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
        <div className="seg" role="group" aria-label="Trimestre">
          {quarters.map((x) => <button key={x} type="button" aria-pressed={q === x} onClick={() => setQ(x)}>{label(x)}{x === now ? " · actual" : ""}</button>)}
        </div>
        {canWrite && <span aria-live="polite" className={cn("text-xs", state === "error" || state === "invalid" ? "text-accent-ink" : "text-faint")}>
          {state === "saving" ? "Guardando…" : state === "saved" ? "Guardado" : state === "invalid" ? "Sin guardar: los pilotos en producción no pueden ser más que los pilotos." : state === "error" ? "No se pudo guardar. Revisa tu conexión e intenta de nuevo." : "Los cambios se guardan solos."}
        </span>}
      </div>

      <div className="grid grid-cols-3 gap-3.5 pt-5 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
        {CARDS.map((c) => {
          const v = c.value(shown), p = prev ? c.value(prev) : null
          const d = v !== null && p !== null ? v - p : null
          const good = d !== null && d !== 0 && (c.lower ? d < 0 : d > 0)
          return (
            <div key={c.id} className="card grid min-w-0 content-start gap-2 p-6">
              <span className="text-[13px] font-medium text-sub">{c.k}</span>
              <div className="flex flex-wrap items-baseline gap-1.5">
                {v === null ? <span className="text-[22px] font-medium text-faint">Pendiente</span>
                  : <><span className="num text-[38px] font-semibold leading-none tracking-[-.04em]">{c.unit === "US$" ? "US$" + nf(v) : nf(v)}</span>{c.unit && c.unit !== "US$" && <small className="text-lg font-medium text-faint">{c.unit}</small>}</>}
              </div>
              {c.id === "conv" && isNum(shown.pilots) && <span className="num text-xs text-faint">{shown.pilotsToProduction ?? 0} de {shown.pilots} pilotos</span>}
              {d !== null && d !== 0 && <span className={cn("num text-xs font-medium", good ? "text-strong" : "text-accent-ink")}>{d > 0 ? "+" : "−"}{nf(Math.abs(d))}{c.unit && c.unit !== "US$" ? " " + c.unit : ""} vs. {label(prevQuarter(q))}</span>}
              <p className="text-[13px] leading-snug text-faint">{c.sub}</p>
              {canWrite && (
                <div className={cn("mt-1 grid gap-2 border-t border-line pt-3", c.fields.length > 1 && "grid-cols-2")}>
                  {c.fields.map(([f, l]) => (
                    <label key={f} className="grid gap-1 text-xs text-sub">{l}
                      <Input type="number" inputMode="decimal" min={0} step="any" value={isNum(draft[f]) ? String(draft[f]) : ""} placeholder="Sin medir" onChange={(e) => edit(f, e.target.value)} />
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {canWrite ? (
        <label className="grid gap-1.5 pt-5 text-[13px] font-medium text-sub">Nota del trimestre
          <Textarea value={draft.note || ""} maxLength={2000} placeholder="Qué explica los números de este trimestre: hitos, bloqueos, cambios de alcance." onChange={(e) => edit("note", e.target.value)} />
        </label>
      ) : saved?.note && <p className="mt-5 rounded-r-sm bg-group px-4 py-3 text-sm text-sub">{saved.note}</p>}

      <Section>
        <SectionHead title="Histórico por trimestre"><SecP>Cada trimestre queda guardado; los cambios tienen historial.</SecP></SectionHead>
        <div className="group-box overflow-x-auto">
          {history.length ? (
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead><tr className="text-left text-xs text-faint">{["Trimestre", ...CARDS.map((c) => c.k)].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody>{history.map((m) => (
                <tr key={m.id} className="border-t border-line">
                  <td className="whitespace-nowrap px-5 py-3 font-semibold">{label(m.id)}</td>
                  {CARDS.map((c) => { const v = c.value(m); return <td key={c.id} className={cn("num px-5 py-3", v === null && "text-faint")}>{v === null ? "—" : (c.unit === "US$" ? "US$" : "") + nf(v) + (c.unit && c.unit !== "US$" ? " " + c.unit : "")}</td> })}
                </tr>
              ))}</tbody>
            </table>
          ) : <div className="px-5 py-7 text-center text-faint">{loaded.m ? "Todavía no hay trimestres guardados." : "Cargando…"}</div>}
        </div>
      </Section>
      <div className="pb-11" />
    </main>
  )
}
