import { useCallback, useEffect, useRef, useState } from "react"
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
type Save = "idle" | "pending" | "saving" | "saved" | "error" | "invalid"
type Raw = Partial<Record<Field | "note", string>>
const FIELDS = CARDS.flatMap((c) => c.fields.map(([f]) => f))

// Text in the inputs -> the record saved for a quarter (empty = not measured).
function toDoc(q: string, raw: Raw): QuarterMetrics {
  const doc: QuarterMetrics = { id: q, quarter: q, note: raw.note?.trim() || null }
  for (const f of FIELDS) { const t = (raw[f] ?? "").trim(), n = Number(t); doc[f] = t !== "" && Number.isFinite(n) && n >= 0 ? n : null }
  return doc
}
const toRaw = (m?: QuarterMetrics): Raw => {
  const r: Raw = { note: m?.note || "" }
  for (const f of FIELDS) r[f] = isNum(m?.[f]) ? String(m![f]) : ""
  return r
}
const invalid = (d: QuarterMetrics) => isNum(d.pilots) && isNum(d.pilotsToProduction) && d.pilotsToProduction > d.pilots

/* Autosave, per the Nexo backend practices: short wait after typing, one write at a time
   (always the latest edits, never out of order), safe retries with backoff, retry when the
   connection returns, visible status, and a warning before leaving with unsaved changes.
   Edits made while a save is in flight are never overwritten by the saved copy arriving. */
function useAutosave(db: { doc: (p: string) => { set: (d: unknown) => Promise<unknown> } } | null, q: string, saved?: QuarterMetrics) {
  const [raw, setRaw] = useState<Raw>(() => toRaw(saved))
  const [state, setState] = useState<Save>("idle")
  const st = useRef({ q, raw, rev: 0, savedRev: 0, busy: false, timer: 0, retry: 0, tries: 0 })

  const again = useRef<() => void>(() => {})
  const run = useCallback(async () => {
    const s = st.current
    window.clearTimeout(s.timer); window.clearTimeout(s.retry)
    if (!db || s.busy || s.rev === s.savedRev) return
    const doc = toDoc(s.q, s.raw), rev = s.rev, quarter = s.q
    if (invalid(doc)) { setState("invalid"); return }
    s.busy = true; setState("saving")
    try {
      const { id: _id, ...data } = doc
      await db.doc("metricas/" + quarter).set(data)
      s.tries = 0
      if (s.q === quarter && s.rev === rev) s.savedRev = rev
      if (s.q !== quarter || s.rev === rev) setState("saved")
    } catch {
      s.tries++; setState("error")
      s.retry = window.setTimeout(() => { s.busy = false; again.current() }, Math.min(30000, 2000 * 2 ** (s.tries - 1)))
      return
    }
    s.busy = false
    if (s.rev !== s.savedRev) again.current() // edits arrived while saving: save the newest
  }, [db])
  useEffect(() => { again.current = run }, [run])

  const edit = (f: Field | "note", value: string) => {
    if (f !== "note" && value !== "" && !(Number(value) >= 0)) return
    const s = st.current
    s.raw = { ...s.raw, [f]: value }; s.rev++
    setRaw(s.raw); setState("pending")
    window.clearTimeout(s.timer); s.timer = window.setTimeout(run, 800)
  }
  const flush = () => { run() }
  const editing = () => st.current.rev !== st.current.savedRev

  // Switching quarter: save what was pending for the old one first, then load the new one.
  useEffect(() => {
    const s = st.current
    if (s.q === q) return
    if (s.rev !== s.savedRev) run()
    s.q = q; s.rev = 0; s.savedRev = 0; s.tries = 0
    s.raw = toRaw(saved); setRaw(s.raw); setState("idle")
  }, [q, saved, run])
  // A newer saved copy (another tab, another editor) replaces the inputs only when nothing is pending.
  useEffect(() => {
    const s = st.current
    if (s.q !== q || s.busy || s.rev !== s.savedRev) return
    const next = toRaw(saved)
    if (JSON.stringify(toDoc(q, next)) !== JSON.stringify(toDoc(q, s.raw))) { s.raw = next; setRaw(next) }
  }, [saved, q])
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (editing()) { run(); e.preventDefault() } }
    const online = () => { if (editing()) { st.current.tries = 0; st.current.busy = false; run() } }
    const hidden = () => { if (document.hidden && editing()) run() }
    window.addEventListener("beforeunload", warn); window.addEventListener("online", online); document.addEventListener("visibilitychange", hidden)
    return () => { window.removeEventListener("beforeunload", warn); window.removeEventListener("online", online); document.removeEventListener("visibilitychange", hidden); if (editing()) run() }
  }, [run])
  return { raw, edit, state, flush, editing }
}

export function Metrics() {
  const { metrics, db, canWrite, loaded, noDb } = useStore()
  const now = quarterOf()
  const quarters = [...new Set([now, ...metrics.map((m) => m.quarter || m.id)])].sort().reverse()
  const [q, setQ] = useState(now)
  const byQ = (x: string) => metrics.find((m) => m.id === x)
  const saved = byQ(q)
  const { raw, edit, state, flush } = useAutosave(db, q, saved)
  const draft = toDoc(q, raw)
  const pick = (x: string) => { if (x !== q) { flush(); setQ(x) } }

  const shown: Partial<QuarterMetrics> = canWrite ? draft : saved || {}
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
          {quarters.map((x) => <button key={x} type="button" aria-pressed={q === x} onClick={() => pick(x)}>{label(x)}{x === now ? " · actual" : ""}</button>)}
        </div>
        {canWrite && <span aria-live="polite" className={cn("text-xs", state === "error" || state === "invalid" ? "text-accent-ink" : "text-faint")} data-state={state}>
          {state === "saving" ? "Guardando…" : state === "pending" ? "Cambios sin guardar…" : state === "saved" ? "Guardado" : state === "invalid" ? "Sin guardar: los pilotos en producción no pueden ser más que los pilotos." : state === "error" ? "No se pudo guardar. Reintentando…" : "Los cambios se guardan solos."}
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
                      <Input type="number" inputMode="decimal" min={0} step="any" value={raw[f] ?? ""} placeholder="Sin medir" onChange={(e) => edit(f, e.target.value)} />
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
          <Textarea value={raw.note ?? ""} maxLength={2000} placeholder="Qué explica los números de este trimestre: hitos, bloqueos, cambios de alcance." onChange={(e) => edit("note", e.target.value)} />
        </label>
      ) : saved?.note && <p className="mt-5 rounded-r-sm bg-group px-4 py-3 text-sm text-sub">{saved.note}</p>}

      <Section>
        <SectionHead title="Tendencia por métrica"><SecP>Cada métrica trimestre a trimestre. La gráfica aparece cuando hay datos de al menos dos trimestres.</SecP></SectionHead>
        {(() => {
          const asc = [...history].sort((a, b) => a.id.localeCompare(b.id))
          const ready = CARDS.map((c) => ({ c, pts: asc.map((m) => ({ q: m.id, v: c.value(m) })).filter((x): x is { q: string; v: number } => x.v !== null) })).filter((x) => x.pts.length >= 2)
          return ready.length ? (
            <div className="grid grid-cols-3 gap-3.5 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
              {ready.map(({ c, pts }) => <Trend key={c.id} card={c} pts={pts} />)}
            </div>
          ) : <div className="group-box px-5 py-7 text-center text-faint">Pendiente de data: todavía no hay dos trimestres con la misma métrica medida.</div>
        })()}
      </Section>

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

const fmtV = (c: Card, v: number) => (c.unit === "US$" ? "US$" + nf(v) : nf(v) + (c.unit ? (c.unit === "%" ? "%" : " " + c.unit) : ""))
const niceMax = (v: number) => { if (v <= 0) return 1; const e = 10 ** Math.floor(Math.log10(v)), f = v / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e }

// One metric over quarters: 2px line on a zero baseline, end value labelled, hover/focus tooltip per quarter.
function Trend({ card, pts }: { card: Card; pts: { q: string; v: number }[] }) {
  const [hot, setHot] = useState<number | null>(null)
  const W = 320, H = 132, L = 36, R = 16, T = 18, B = 26
  const max = card.unit === "%" ? 100 : Math.max(2, niceMax(Math.max(...pts.map((p) => p.v)))) // >= 2 keeps ticks whole for counts
  const x = (i: number) => L + (pts.length === 1 ? 0 : (i * (W - L - R)) / (pts.length - 1))
  const y = (v: number) => T + (1 - v / max) * (H - T - B)
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ")
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`
  const last = pts[pts.length - 1], h = hot === null ? null : pts[hot]
  return (
    <figure className="card relative m-0 grid min-w-0 content-start gap-1 p-5">
      <figcaption className="grid gap-0.5"><span className="text-[13px] font-medium text-sub">{card.k}</span><span className="text-[11px] text-faint">{card.lower ? "Menos es mejor" : "Más es mejor"}</span></figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img"
        aria-label={`${card.k}: ${pts.map((p) => `${label(p.q)} ${fmtV(card, p.v)}`).join(", ")}`} onMouseLeave={() => setHot(null)}>
        {[0, max / 2, max].map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
            <text x={L - 6} y={y(t)} dy="0.32em" textAnchor="end" className="num" fontSize={10} fill="var(--faint)">{nf(t)}</text>
          </g>
        ))}
        <path d={area} fill="var(--accent)" opacity={0.1} />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {h && <line x1={x(hot!)} x2={x(hot!)} y1={T} y2={y(0)} stroke="var(--line-2)" strokeWidth={1} />}
        {pts.map((p, i) => (
          <g key={p.q}>
            <circle cx={x(i)} cy={y(p.v)} r={hot === i ? 5.5 : 4} fill="var(--accent)" stroke="var(--raise)" strokeWidth={2} />
            <text x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"} fontSize={10} fill="var(--faint)">{p.q.slice(5)} {p.q.slice(2, 4)}</text>
            <circle cx={x(i)} cy={y(p.v)} r={14} fill="transparent" tabIndex={0} role="img" aria-label={`${label(p.q)}: ${fmtV(card, p.v)}`}
              onMouseEnter={() => setHot(i)} onFocus={() => setHot(i)} onBlur={() => setHot(null)} className="cursor-default outline-none" />
          </g>
        ))}
        {hot === null && <text x={x(pts.length - 1)} y={y(last.v) - 10} textAnchor="end" className="num" fontSize={11} fontWeight={600} fill="var(--text)">{fmtV(card, last.v)}</text>}
      </svg>
      {h && (
        <div role="status" className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-line bg-raise px-2.5 py-1.5 text-xs shadow-[0_6px_20px_-8px_rgba(15,23,42,.35)]"
          style={{ left: `calc(20px + (100% - 40px) * ${(x(hot!) / W).toFixed(4)})`, top: 34 }}>
          <div className="text-faint">{label(h.q)}</div><div className="num font-semibold text-text">{fmtV(card, h.v)}</div>
        </div>
      )}
    </figure>
  )
}
