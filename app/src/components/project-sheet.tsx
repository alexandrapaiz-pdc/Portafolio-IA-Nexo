import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { agentsOf, discovery, inProgram, PHASES, phaseLabel, PROGRAMS, readiness, savings, STATUS, TAGS, taskStats, type Kpi, type Project } from "@/lib/domain"
import { clone, fdate, fnum, isNum, nf, pct, today } from "@/lib/format"
import { useStore } from "@/lib/store"
import { useRouter } from "@/lib/router"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input, NativeSelect, Textarea } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { H5, StatusPill, UpdateRow, Empty } from "./shared"

function Spark({ p, k }: { p: Project; k: Kpi }) {
  const { updates } = useStore()
  const pts = updates.filter((u) => u.projectId === p.id && u.kpiId === k.id && isNum(u.value)).map((u) => u.value as number).reverse()
  if (isNum(k.baseline)) pts.unshift(k.baseline)
  if (pts.length < 2) return null
  const vs = pts.concat(isNum(k.target) ? [k.target] : []), mn = Math.min(...vs), mx = Math.max(...vs), rg = mx - mn || 1
  const W = 300, H = 34, pd = 4, X = (i: number) => pd + (i * (W - 2 * pd)) / (pts.length - 1), Y = (v: number) => H - pd - ((v - mn) / rg) * (H - 2 * pd)
  const line = pts.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(" "), l = pts.length - 1
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden className="block h-[34px] w-full">
      {isNum(k.target) && <line x1={pd} x2={W - pd} y1={Y(k.target)} y2={Y(k.target)} stroke="var(--faint)" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />}
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
      <circle cx={X(l)} cy={Y(pts[l])} r="2.5" fill="var(--accent)" />
    </svg>
  )
}

// Tasks, blockers, discovery checklists and updates are kept in the data but hidden: the sheet shows only
// what matters once a project runs (phase, hours freed, execution KPIs, value stream).
const SHOW_DETAIL = false

export function ProjectSheet() {
  const { project: id, closeProject } = useRouter()
  const store = useStore()
  const { projects, components, updates, asana, canWrite, db, write } = store
  const p = projects.find((x) => x.id === id)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<{ blocker: string; kpis: Kpi[]; savings: NonNullable<Project["savings"]> } | null>(null)
  useEffect(() => { setEditing(false); setDraft(null) }, [id])
  if (!id) return null
  if (!p) return <Dialog open onOpenChange={(o) => !o && closeProject()}><DialogContent title="Proyecto"><Empty>Cargando proyecto…</Empty></DialogContent></Dialog>

  const pdoc = () => db.doc("projects/" + p.id)
  const r = readiness(p, components), s = savings(p), d = discovery(p), pi = PHASES.findIndex((x) => x[0] === p.phase)
  const ups = updates.filter((u) => u.projectId === p.id)
  const at = asana[p.id]?.tasks, ats = at ? taskStats(at) : null
  const isAg = inProgram(p, "agentes"), ag = agentsOf(projects), prog = PROGRAMS.find((g) => g.lead === p.id || (!isAg && inProgram(p, g.id)))
  const title = isAg ? `AI Agent Projects · Prioridad ${ag.indexOf(p) + 1}` : prog?.name || "Proyecto"

  const startEdit = () => { setDraft({ blocker: p.blocker || "", kpis: clone(p.kpis || []), savings: { ...(p.savings || {}), unit: s.unit } }); setEditing(true) }
  const save = async () => {
    if (!draft) return
    const kpis = draft.kpis.map((k, i) => {
      const o = (p.kpis || [])[i] || ({} as Kpi)
      const changed = (k.baseline ?? null) !== (o.baseline ?? null) || (k.current ?? null) !== (o.current ?? null) || (k.target ?? null) !== (o.target ?? null)
      return changed ? { ...k, updated: today() } : k
    })
    const patch: Record<string, unknown> = { kpis, blocker: draft.blocker.trim() }
    if (!p.enabler) patch.savings = draft.savings
    setEditing(false)
    await write(() => pdoc().update(patch), "Cambios guardados")
  }
  const n = (v: string) => (v === "" ? null : Number(v))

  return (
    <Dialog open onOpenChange={(o) => !o && closeProject()}>
      <DialogContent title={title}>
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-3.5 text-[13px] text-faint">
            {isAg ? <><b className="font-semibold text-accent-ink">Prioridad {ag.indexOf(p) + 1}</b><span>Ola {p.wave}</span></> : <b className="font-semibold text-accent-ink">{prog?.name}</b>}
            <span>{p.bu}</span>{p.noAzure && <span>Avanza sin Azure</span>}
          </div>
          <h2 className="text-[clamp(30px,5vw,40px)] leading-[1.05] tracking-[-.04em]">{p.name}</h2>
          <p className="max-w-[36em] text-[17px] tracking-[-.015em] text-sub">{p.summary || p.tagline}</p>
          <p className="text-sm text-sub">{p.sponsor}</p>
          {canWrite && <div className="flex justify-end gap-2">{editing ? <><Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button><Button onClick={save}>Guardar</Button></> : <Button variant="ghost" onClick={startEdit}>Editar</Button>}</div>}
        </div>

        <div>
          <H5>Fase · {phaseLabel(p)}</H5>
          <div className="group-box grid grid-cols-5 gap-1.5 px-5 py-[18px]">
            {PHASES.map(([pid, l], i) => {
              const cls = cn("grid gap-2 border-0 bg-transparent p-0 text-left text-xs text-faint", i === pi && "font-semibold text-text")
              const bar = <i className={cn("block h-1 rounded-sm bg-line-2", i < pi && "bg-strong", i === pi && "bg-accent")} />
              return canWrite
                ? <button key={pid} type="button" className={cls} onClick={() => pid !== p.phase && write(() => pdoc().update({ phase: pid, paused: false }), "Fase: " + l)}>{bar}<span className="max-sm:text-xs">{l}</span></button>
                : <div key={pid} className={cls}>{bar}<span className="max-sm:text-xs">{l}</span></div>
            })}
          </div>
        </div>

{SHOW_DETAIL && (<>
        {editing && draft
          ? <div><H5>Bloqueo actual</H5><Input value={draft.blocker} placeholder="Sin bloqueo" onChange={(e) => setDraft({ ...draft, blocker: e.target.value })} /></div>
          : p.blocker && <div><H5>Bloqueo actual</H5><div className="group-box px-5 py-4">{p.blocker}</div></div>}

        {!!p.pains?.length && <div><H5>Dolores de negocio</H5><div className="group-box">{p.pains.map((x, i) => <div key={i} className="row grid-cols-1">{x}</div>)}</div></div>}

        <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
          <div><H5>Stack requerido</H5><div className="group-box">
            <div className="grid gap-2 px-5 pb-1.5 pt-4"><div className="flex justify-between text-[13px] text-sub"><span>Componentes listos</span><b className="num font-semibold text-text">{r.ready} de {r.total}</b></div><div className="bar"><i style={{ width: pct(r.ready, r.total) + "%" }} /></div></div>
            {r.list.length ? r.list.map((c) => <div key={c.id} className="row grid-cols-[minmax(0,1fr)_auto] px-5 py-[11px] text-sm"><span>{c.name}</span><StatusPill status={c.status} label={STATUS[c.status]} /></div>) : <div className="row text-sm text-sub">No depende de componentes.</div>}
          </div></div>
          <div><H5>{p.enabler ? "Hitos" : "Descubrimiento"}</H5><div className="group-box">
            <div className="grid gap-2 px-5 pb-1.5 pt-4"><div className="flex justify-between text-[13px] text-sub"><span>Cerrados</span><b className="num font-semibold text-text">{d.done} de {d.total}</b></div><div className="bar"><i style={{ width: pct(d.done, d.total) + "%" }} /></div></div>
            {(p.discovery || []).map((x, i) => (
              <label key={i} className="row grid-cols-[auto_minmax(0,1fr)_auto] px-5 py-[11px] text-sm">
                <input type="checkbox" className="size-4 accent-[var(--navy)]" checked={!!x.done} disabled={!canWrite}
                  onChange={(e) => { const disc = clone(p.discovery || []); disc[i].done = e.target.checked; write(() => pdoc().update({ discovery: disc })) }} />
                <span className={cn(x.done && "text-faint line-through decoration-line-2")}>{x.label}</span>
                <span className="num whitespace-nowrap text-xs text-faint">{x.due ? fdate(x.due) : ""}</span>
              </label>
            ))}
          </div></div>
        </div>

        {at && at.length > 0 && ats && (
          <div className="group-box flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <span className="num text-sm text-sub">Asana: {ats.total - ats.done} tareas abiertas{ats.late ? ` · ${ats.late} vencidas` : ""} · {ats.done} cerradas</span>
          </div>
        )}
</>)}

        {!p.enabler && (
          <div><H5>Horas de trabajo manual</H5><div className="group-box">
            {editing && draft ? (
              <div className="grid gap-2.5 px-5 py-4">
                <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
                  {(["baseline", "current", "target"] as const).map((f) => <Label key={f}>{{ baseline: "Hoy", current: "Actual", target: "Meta" }[f]}<Input type="number" step="any" value={draft.savings[f] ?? ""} onChange={(e) => setDraft({ ...draft, savings: { ...draft.savings, [f]: n(e.target.value) } })} /></Label>)}
                </div>
                <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
                  <Label>Unidad<Input value={draft.savings.unit || ""} onChange={(e) => setDraft({ ...draft, savings: { ...draft.savings, unit: e.target.value } })} /></Label>
                  <Label className="col-span-2 max-sm:col-span-1">Nota<Input value={draft.savings.note || ""} onChange={(e) => setDraft({ ...draft, savings: { ...draft.savings, note: e.target.value } })} /></Label>
                </div>
              </div>
            ) : (
              <>
                <div className="num grid grid-cols-3 gap-3 px-5 py-[18px]">
                  {[["Manual hoy", isNum(s.baseline) ? nf(s.baseline) : "—", ""], ["Liberadas", s.saved != null ? nf(s.saved) : "—", "text-accent"], ["Potencial", s.pot != null ? nf(s.pot) : "—", ""]].map(([k, v, c]) => (
                    <div key={k} className="grid gap-0.5"><span className="text-xs text-faint">{k}</span><span className={cn("text-2xl font-semibold tracking-[-.03em]", c)}>{v}</span></div>
                  ))}
                </div>
                <p className="px-5 pb-4 text-[13px] text-sub">{isNum(s.baseline) ? s.unit + ". " : ""}{s.note || (isNum(s.baseline) ? "" : "Línea base pendiente de medir.")}</p>
              </>
            )}
          </div></div>
        )}

        {!!p.kpis?.length && (
          <div><H5>KPIs de ejecución</H5><div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
            {(editing && draft ? draft.kpis : p.kpis).map((k, i) => editing && draft ? (
              <div key={k.id} className="grid content-start gap-2 card px-5 py-[18px]">
                <div className="text-[13px] text-sub">{k.name}</div>
                <div className="grid grid-cols-3 gap-2">
                  {(["baseline", "current", "target"] as const).map((f) => <Label key={f}>{{ baseline: "Línea base", current: "Actual", target: "Meta" }[f]}<Input type="number" step="any" value={k[f] ?? ""}
                    onChange={(e) => { const kpis = [...draft.kpis]; kpis[i] = { ...k, [f]: n(e.target.value) }; setDraft({ ...draft, kpis }) }} /></Label>)}
                </div>
                <Label>Nota<Input value={k.note || ""} onChange={(e) => { const kpis = [...draft.kpis]; kpis[i] = { ...k, note: e.target.value }; setDraft({ ...draft, kpis }) }} /></Label>
              </div>
            ) : (
              <div key={k.id} className="grid min-w-0 content-start gap-2 card px-5 py-[18px]">
                <div className="text-[13px] text-sub">{k.name}</div>
                {(() => { const cur = isNum(k.current) ? k.current : isNum(k.baseline) ? k.baseline : null; return <div className={cn("num text-[30px] font-semibold leading-[1.05] tracking-[-.04em]", cur == null ? "text-[15px] font-medium tracking-normal text-faint" : "text-accent")}>{cur == null ? "Línea base pendiente" : fnum(cur, k.unit)}</div> })()}
                <Spark p={p} k={k} />
                <div className="num flex flex-wrap gap-4 text-[13px] text-faint"><span>Base <b className="font-medium text-text">{fnum(k.baseline, k.unit)}</b></span><span>Meta <b className="font-medium text-text">{fnum(k.target, k.unit)}</b></span>{k.updated && <span>{fdate(k.updated)}</span>}</div>
                {k.note && <div className="text-[13px] text-sub">{k.note}</div>}
              </div>
            ))}
          </div></div>
        )}

        {(isAg || p.vsm) && <div><H5>Mapa de flujo de valor</H5><div className="group-box flex items-center gap-3 px-5 py-4 text-[15px] text-sub"><span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium tracking-[.08em] text-accent">PRÓXIMAMENTE</span>El mapa de este proceso se publicará pronto.</div></div>}

{SHOW_DETAIL && (<>
        {p.next && <div><H5>Próximo hito</H5><div className="group-box px-5 py-4">{p.next}</div></div>}

        <div><H5>Actualizaciones</H5>
          {canWrite && <Composer p={p} />}
          <div className="group-box">{ups.length ? ups.map((u) => <UpdateRow key={u.id} u={u} />) : <Empty>Sin actualizaciones todavía.</Empty>}</div>
        </div>
</>)}
      </DialogContent>
    </Dialog>
  )
}

function Composer({ p }: { p: Project }) {
  const { db, write } = useStore()
  const [text, setText] = useState(""), [tag, setTag] = useState(TAGS[0]), [kpiId, setKpiId] = useState(""), [val, setVal] = useState(""), [date, setDate] = useState(today()), [busy, setBusy] = useState(false)
  return (
    <form className="mb-3.5 grid gap-2.5 card px-5 py-4" onSubmit={async (e) => {
      e.preventDefault(); if (!text.trim()) return; setBusy(true)
      const value = val === "" ? null : Number(val)
      const ok = await write(async () => {
        await db.collection("updates").add({ projectId: p.id, date: date || today(), tag, text: text.trim(), kpiId: kpiId || null, value, createdAt: new Date().toISOString() })
        if (kpiId && isNum(value)) await db.doc("projects/" + p.id).update({ kpis: (p.kpis || []).map((k) => (k.id === kpiId ? { ...k, current: value, updated: date } : k)) })
      }, "Publicado")
      setBusy(false); if (ok) { setText(""); setVal(""); setKpiId("") }
    }}>
      <Label>Qué pasó<Textarea required value={text} onChange={(e) => setText(e.target.value)} placeholder="Ej. Se recibió acceso a la carpeta de Tráfico; 40 documentos siguen sin ubicar." /></Label>
      <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
        <Label>Tipo<NativeSelect value={tag} onChange={(e) => setTag(e.target.value)}>{TAGS.map((t) => <option key={t}>{t}</option>)}</NativeSelect></Label>
        <Label>KPI medido (opcional)<NativeSelect value={kpiId} onChange={(e) => setKpiId(e.target.value)}><option value="">Ninguno</option>{(p.kpis || []).map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</NativeSelect></Label>
        <Label>Valor<Input type="number" step="any" value={val} onChange={(e) => setVal(e.target.value)} /></Label>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Label className="flex items-center gap-2">Fecha<Input type="date" className="w-auto" value={date} onChange={(e) => setDate(e.target.value)} /></Label>
        <Button variant="accent" type="submit" disabled={busy}>Publicar</Button>
      </div>
    </form>
  )
}
