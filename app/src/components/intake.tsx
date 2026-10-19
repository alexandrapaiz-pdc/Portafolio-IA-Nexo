import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { intakeHours, type Intake, type IntakeMetric, type IntakeStep, type VsmRow } from "@/lib/domain"
import { fdate, nf } from "@/lib/format"
import { H5 } from "./shared"

// Project cards built from the intake guide (Guía de intake para workflows de IA), section by section.
// Nothing here is typed by hand twice: the flowchart and the value stream map are drawn from the guide's steps.

export const PENDING = "Guía de intake pendiente"
const done = (i?: Intake): i is Intake => i?.status === "completada"
export const mainKpi = (i?: Intake) => i?.metrics?.find((m) => m.kpi && m.current) || i?.metrics?.find((m) => m.kpi)
const enabled = (i: Intake) => { const s = i.sources || [], known = s.filter((x) => x.state !== "sin_estado"); return { ok: s.filter((x) => x.state === "habilitado").length, total: s.length, known: known.length } }
const sourcesLine = (i: Intake) => { const e = enabled(i); return e.known ? `${e.ok} de ${e.total} fuentes habilitadas` : `${e.total} fuentes · acceso por confirmar` }

const Badge = ({ s }: { s: IntakeMetric["state"] }) => (
  <span className={cn("rounded-full px-2 py-px text-[11px] font-medium", s === "medido" ? "bg-strong/10 text-strong" : s === "estimado" ? "bg-accent/10 text-accent-ink" : "bg-group text-faint")}>
    {s === "medido" ? "Medido" : s === "estimado" ? "Estimado" : "Pendiente"}
  </span>
)
const Block = ({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) => (
  <div className="min-w-0"><div className="flex flex-wrap items-baseline justify-between gap-2"><H5>{title}</H5>{aside && <span className="mb-2.5 px-1 text-[13px] text-faint">{aside}</span>}</div>{children}</div>
)
const Pend = () => <div className="group-box px-5 py-4 text-[15px] font-medium text-faint">Pendiente de data</div>

/** Compact summary used in the portfolio list and board. */
export function IntakeSummary({ i, compact }: { i?: Intake; compact?: boolean }) {
  if (!done(i)) return <span className="text-[13px] text-faint">{PENDING}</span>
  const k = mainKpi(i), e = sourcesLine(i)
  if (compact) return <span className="text-xs text-faint">{k ? `${k.name}: ${k.current || "pendiente"}${k.target ? " → " + k.target : ""}` : e}</span>
  return (
    <div className="grid gap-0.5 text-xs text-faint">
      {k && <span><span className="text-sub">{k.name}</span> · {k.current || "pendiente"}{k.target ? <> → <b className="font-medium text-text">{k.target}</b></> : null}</span>}
      <span>{e}{i.tracking?.blocker ? <> · <span className="text-sub">Bloqueo: {i.tracking.blocker}</span></> : null}</span>
    </div>
  )
}

/** The project page body for a project with (or waiting for) its intake guide. */
export function IntakeBody({ i }: { i?: Intake }) {
  if (!done(i)) return <div className="group-box px-5 py-6 text-[17px] font-medium text-faint">{PENDING}</div>
  const kpis = (i.metrics || []).filter((m) => m.kpi), base = (i.metrics || []).filter((m) => !m.kpi && m.key !== "hours")
  const known = base.filter((m) => m.current || m.target), missing = base.filter((m) => !m.current && !m.target)
  const hours = intakeHours(i), w = i.workflow || {}, pr = i.process || {}, tr = i.tracking || {}, rv = i.review || {}
  return (
    <>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-sub">
        {[pr.bu, pr.area, pr.country].filter(Boolean).map((x) => <span key={x}>{x}</span>)}
      </div>
      <div className="-mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-faint">
        {w.owner && <span>Responde: <span className="text-sub">{w.owner}</span></span>}
        {tr.coordinator && <span>Coordina: <span className="text-sub">{tr.coordinator}</span></span>}
        <span className="rounded-full bg-strong/10 px-2 py-px text-[11px] font-medium text-strong">Guía completada{i.date ? " · " + fdate(i.date) : ""}</span>
        {i.url && <a href={i.url} target="_blank" rel="noopener" className="text-accent-ink no-underline hover:underline">Ver guía ›</a>}
      </div>

      <Block title={"El workflow" + (w.name ? " · " + w.name : "")}>
        <div className="group-box">
          {[["Inicia", w.trigger], ["Termina", w.result], ["Problema", w.problem], ["Mejora", w.improve]].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="row grid-cols-[92px_minmax(0,1fr)] items-start gap-3 max-sm:grid-cols-1 max-sm:gap-0.5"><span className="text-[13px] font-medium text-faint">{k}</span><span className="text-[15px]">{v}</span></div>
          ))}
        </div>
      </Block>

      {!!i.parts?.length && <Block title="Partes del workflow"><div className="group-box">{i.parts.map((x) => <div key={x.name} className="row grid-cols-1"><b className="font-medium">{x.name}</b>{x.detail && <span className="text-[13px] text-sub">{x.detail}</span>}</div>)}</div></Block>}

      <Block title="KPIs elegidos">
        {kpis.length ? <div className="grid grid-cols-3 gap-3 max-[760px]:grid-cols-1">
          {kpis.map((m) => (
            <div key={m.key} className="card grid content-start gap-1.5 px-5 py-[18px]">
              <span className="text-[13px] text-sub">{m.name}</span>
              {m.current || m.target ? <>
                <div className="flex flex-wrap items-baseline gap-x-2"><span className="num text-[24px] font-semibold tracking-[-.03em]">{m.current || "Pendiente"}</span>{m.target && <span className="text-[13px] text-faint">meta <b className="font-medium text-text">{m.target}</b></span>}</div>
                <div className="flex flex-wrap items-center gap-2"><Badge s={m.state} />{m.source && <span className="text-xs text-faint">{m.source}</span>}</div>
              </> : <span className="text-[15px] font-medium text-faint">Pendiente de data</span>}
            </div>
          ))}
        </div> : <Pend />}
        {(rv.who || rv.cadence || rv.due) && <p className="mt-2.5 px-1 text-[13px] text-sub">Revisa: {rv.who || "pendiente"}{rv.cadence ? " · " + rv.cadence : ""}{rv.due ? " · meta: " + rv.due : ""}</p>}
      </Block>

      <Block title="Métricas base" aside={rv.period || undefined}>
        <div className="group-box">
          {known.map((m) => (
            <div key={m.key} className="row grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,.8fr)_auto] items-baseline gap-3 max-sm:grid-cols-1 max-sm:gap-1">
              <span className="font-medium">{m.name}</span><span className="num text-sm">{m.current || "Pendiente"}</span><span className="text-sm text-sub">{m.target ? "meta " + m.target : ""}</span><Badge s={m.state} />
            </div>
          ))}
          {!!missing.length && <div className="row grid-cols-1 text-sm text-faint">Pendiente de data: {missing.map((m) => m.name.toLowerCase()).join(", ")}</div>}
        </div>
      </Block>

      <Block title="Horas-persona al mes" aside="casos al mes × min-persona por caso ÷ 60">
        {hours === null ? <Pend /> : <div className="group-box px-5 py-4"><span className="num text-2xl font-semibold">{nf(hours)} h</span></div>}
      </Block>

      {!!i.steps?.length && <Block title="Flujograma" aside={`${i.steps.length} pasos · generado de la guía${i.steps.length > 4 ? " · desliza para ver todos →" : ""}`}><Flowchart steps={i.steps} /></Block>}
      {!!i.vsm?.steps.length && <Block title="Mapa de flujo de valor" aside={[i.vsm.case, i.vsm.period].filter(Boolean).join(" · ")}><ValueStream v={i.vsm} /></Block>}

      {!!i.sources?.length && (
        <Block title="Fuentes y acceso" aside={sourcesLine(i)}>
          <div className="group-box">{i.sources.map((s) => (
            <div key={s.id} className="row grid-cols-[44px_minmax(0,1fr)_auto] items-start gap-3 max-sm:grid-cols-[44px_minmax(0,1fr)]">
              <b className="num pt-px text-[13px] font-semibold text-faint">{s.id}</b>
              <div className="min-w-0"><div className="font-medium">{s.url ? <a href={s.url} target="_blank" rel="noopener" className="text-inherit hover:underline">{s.name}</a> : s.name}</div><div className="mt-0.5 text-[13px] text-sub">{[s.access, s.who, s.contact].filter(Boolean).join(" · ")}</div></div>
              <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] max-sm:col-start-2", s.state === "habilitado" ? "text-strong" : s.state === "pendiente" ? "text-accent-ink" : "text-faint")}>
                <i className={cn("size-2 rounded-full", s.state === "habilitado" ? "bg-strong" : s.state === "pendiente" ? "bg-accent" : "shadow-[inset_0_0_0_1.5px_var(--faint)]")} />{s.state === "habilitado" ? "Habilitado" : s.state === "pendiente" ? "Pendiente" : "Por confirmar"}</span>
            </div>
          ))}</div>
        </Block>
      )}

      <Block title="Seguimiento">
        <div className="group-box">
          {[["Etapa", tr.stage], ["Siguiente", tr.next], ["Bloqueo", tr.blocker]].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="row grid-cols-[92px_minmax(0,1fr)] items-start gap-3 max-sm:grid-cols-1 max-sm:gap-0.5"><span className="text-[13px] font-medium text-faint">{k}</span><span>{v}</span></div>
          ))}
          {!!tr.route?.length && <div className="row grid-cols-[92px_minmax(0,1fr)] items-start gap-3 max-sm:grid-cols-1"><span className="text-[13px] font-medium text-faint">Ruta</span>
            <div className="flex flex-wrap gap-2">{tr.route.map(([a, b, c]) => <span key={a} className="rounded-lg bg-group px-2.5 py-1 text-[13px]"><b className="font-semibold">{a}</b> {b} <span className="text-faint">· {c}</span></span>)}</div></div>}
        </div>
      </Block>

      {!!i.contacts?.length && (
        <Block title="Contactos" aside={i.folder ? "Carpeta: " + i.folder : undefined}>
          <div className="group-box">{i.contacts.map((c) => (
            <div key={c.name} className="row grid-cols-[minmax(0,1fr)_auto] gap-3 max-sm:grid-cols-1 max-sm:gap-0.5">
              <div className="min-w-0"><div className="font-medium">{c.name}</div>{c.role && <div className="text-[13px] text-sub">{c.role}</div>}</div>
              {c.email && <a href={"mailto:" + c.email} className="self-center text-[13px] text-accent-ink no-underline hover:underline">{c.email}</a>}
            </div>
          ))}</div>
        </Block>
      )}
    </>
  )
}

// Wrap a label into lines of at most n characters, on word boundaries.
function wrap(t: string, n: number, max = 3) {
  const out: string[] = []; let cur = ""
  for (const w of t.split(" ")) { if ((cur + " " + w).trim().length > n && cur) { out.push(cur); cur = w } else cur = (cur + " " + w).trim() }
  if (cur) out.push(cur)
  return out.length > max ? [...out.slice(0, max - 1), out.slice(max - 1).join(" ").slice(0, n - 1) + "…"] : out
}

/** Swimlane flowchart: one lane per role, one box per step, a diamond where the guide names a correction or approval. */
export function Flowchart({ steps }: { steps: IntakeStep[] }) {
  const [hot, setHot] = useState<number | null>(null)
  const lanes = [...new Set(steps.map((s) => s.who))]
  const LW = 128, BW = 148, BH = 60, GX = 30, LH = 96, PT = 14
  const W = LW + steps.length * (BW + GX) + 10, H = PT + lanes.length * LH + 8
  const bx = (i: number) => LW + 12 + i * (BW + GX), by = (s: IntakeStep) => PT + lanes.indexOf(s.who) * LH + (LH - BH) / 2
  const branches = steps.map((s, i) => ({ s, i })).filter((x) => x.s.branch)
  return (
    <div className="group-box min-w-0 overflow-hidden p-0">
      <div className="max-w-full overflow-x-auto">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Flujograma: ${steps.map((s) => `${s.n} ${s.name} (${s.who})`).join("; ")}`} className="block">
          <defs><marker id="fc-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="var(--faint)" /></marker></defs>
          {lanes.map((l, li) => (
            <g key={l}>
              {li > 0 && <line x1={0} x2={W} y1={PT + li * LH} y2={PT + li * LH} stroke="var(--line)" />}
              {wrap(l, 16, 2).map((t, k, a) => <text key={k} x={14} y={PT + li * LH + LH / 2 + (k - (a.length - 1) / 2) * 15} dy="0.32em" fontSize={12} fontWeight={600} fill="var(--sub)">{t}</text>)}
            </g>
          ))}
          <line x1={LW} x2={LW} y1={PT} y2={H - 8} stroke="var(--line)" />
          {steps.slice(1).map((s, k) => {
            const a = steps[k], x1 = bx(k) + BW, y1 = by(a) + BH / 2, x2 = bx(k + 1), y2 = by(s) + BH / 2, mx = x1 + GX / 2
            return <path key={s.n} d={y1 === y2 ? `M${x1},${y1} H${x2 - 1}` : `M${x1},${y1} H${mx} V${y2} H${x2 - 1}`} fill="none" stroke="var(--faint)" strokeWidth={1.25} markerEnd="url(#fc-arrow)" />
          })}
          {steps.map((s, i) => {
            const x = bx(i), y = by(s), lines = wrap(s.name, 21), on = hot === i
            return (
              <g key={s.n} tabIndex={0} role="img" aria-label={`${s.n}. ${s.name} · ${s.who}${s.out ? " · resultado: " + s.out : ""}${s.branch ? " · " + s.branch : ""}`}
                onMouseEnter={() => setHot(i)} onMouseLeave={() => setHot(null)} onFocus={() => setHot(i)} onBlur={() => setHot(null)} className="outline-none">
                <rect x={x} y={y} width={BW} height={BH} rx={10} fill="var(--raise)" stroke={on ? "var(--accent)" : "var(--line-2)"} strokeWidth={on ? 1.5 : 1} />
                <text x={x + 10} y={y + 15} fontSize={10} fontWeight={700} fill="var(--accent)">{s.n}{s.src?.length ? <tspan fill="var(--faint)" fontWeight={500}>{"  " + s.src.join(" · ")}</tspan> : null}</text>
                {lines.map((t, k) => <text key={k} x={x + 10} y={y + 31 + k * 13} fontSize={11.5} fill="var(--text)">{t}</text>)}
                {s.branch && <g transform={`translate(${x + BW - 13},${y + BH})`}><rect x={-7} y={-7} width={14} height={14} transform="rotate(45)" fill="var(--accent)" stroke="var(--raise)" strokeWidth={2} /></g>}
              </g>
            )
          })}
        </svg>
      </div>
      <div className="border-t border-line px-5 py-3 text-[13px] text-sub" aria-live="polite">
        {hot !== null ? <><b className="font-semibold text-text">{steps[hot].n}. {steps[hot].name}</b> · {steps[hot].who}{steps[hot].uses ? " · usa: " + steps[hot].uses : ""}{steps[hot].out ? " · queda en: " + steps[hot].out : ""}</> : "Pasa el cursor por un paso para ver qué usa y dónde queda."}
      </div>
      {!!branches.length && (
        <div className="grid gap-1.5 border-t border-line px-5 py-3">
          <span className="text-xs font-medium text-faint">Correcciones y aprobaciones</span>
          {branches.map(({ s }) => <span key={s.n} className="grid grid-cols-[18px_34px_minmax(0,1fr)] items-baseline gap-1 text-[13px]"><i className="mt-1 size-2 rotate-45 bg-accent" aria-hidden /><b className="num font-semibold text-accent-ink">{s.n}</b><span className="text-sub">{s.branch}</span></span>)}
        </div>
      )}
    </div>
  )
}

/** Value stream map: active time per step on one scale, with what gets stuck. Unmeasured steps say so; nothing is guessed. */
export function ValueStream({ v }: { v: { unit: string; steps: VsmRow[] } }) {
  const max = Math.max(...v.steps.map((s) => s.hi ?? s.lo ?? 0), 0)
  const measured = v.steps.filter((s) => s.lo != null), lo = measured.reduce((a, s) => a + (s.lo || 0), 0), hi = measured.reduce((a, s) => a + (s.hi ?? s.lo ?? 0), 0)
  const pending = v.steps.length - measured.length
  const fmt = (n: number) => nf(n) + " " + v.unit
  return (
    <div className="group-box">
      {v.steps.map((s) => (
        <div key={s.n} className="row grid-cols-[48px_minmax(0,1fr)_minmax(0,1.1fr)] items-start gap-3 max-[720px]:grid-cols-[48px_minmax(0,1fr)]">
          <b className="num pt-px text-[13px] font-semibold text-accent">{s.n}</b>
          <div className="grid min-w-0 gap-1.5">
            <span className="font-medium leading-snug">{s.name}</span>
            {s.lo != null && max > 0 ? (
              <div className="flex items-center gap-2">
                <div className="relative h-2 flex-1 rounded-full bg-group" aria-hidden>
                  <i className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `max(4px, ${((s.lo || 0) / max) * 100}%)` }} />
                  {s.hi != null && s.hi > (s.lo || 0) && <i className="absolute inset-y-0 rounded-r-full bg-accent/35" style={{ left: `${((s.lo || 0) / max) * 100}%`, width: `${((s.hi - (s.lo || 0)) / max) * 100}%` }} />}
                </div>
              </div>
            ) : null}
            <span className="text-xs text-faint">{s.active || "Tiempo activo: pendiente de data"}{s.wait && s.wait !== "0" ? " · espera: " + s.wait : ""}</span>
          </div>
          <span className="text-[13px] text-sub max-[720px]:col-start-2">{s.stuck ? <><span className="mr-1.5 inline-block size-1.5 -translate-y-px rounded-full bg-accent align-middle" aria-hidden />{s.stuck}</> : <span className="text-faint">Sin atascos reportados</span>}</span>
        </div>
      ))}
      <div className="row grid-cols-1 gap-1 text-[13px] text-sub">
        <span><b className="font-semibold text-text">Tiempo activo medido:</b> {measured.length ? (lo === hi ? fmt(lo) : `${fmt(lo)} a ${fmt(hi)}`) : "pendiente de data"}{pending ? ` · ${pending} de ${v.steps.length} pasos sin medir` : ""}</span>
        <span>Eficiencia de flujo (activo ÷ total): pendiente de data, faltan las esperas.</span>
      </div>
    </div>
  )
}
