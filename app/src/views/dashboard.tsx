import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { agentsOf, defaultPhase, FASES, type Board, type Dependency, type Project, type ProjectLink } from "@/lib/domain"
import { fdate, isNum, nf, today } from "@/lib/format"
import { useStore } from "@/lib/store"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input, NativeSelect, Textarea } from "@/components/ui/input"
import { Section, SectionHead, SecP, Stat, StatsRow, H5, Empty } from "@/components/shared"
import { Flowchart, ValueStream } from "@/components/intake"
import { VsmDiagram } from "@/components/vsm"
import { DocReader } from "@/components/doc-reader"
import { hasDocs } from "@/lib/metodologia"

// Agent projects dashboard: triage (phase, urgency, risk, go/no-go), value stream and links per project.
// Rows come from the portfolio snapshot; triage, links and notes live in the "tablero" collection,
// one document per project, written by editors (the owner and the bosses she makes editors).

const URG = [["alta", "Alta"], ["media", "Media"], ["baja", "Baja"]] as const
const RISK = [["alto", "Alto"], ["medio", "Medio"], ["bajo", "Bajo"]] as const
const DEC = [["agente", "Sí, agente"], ["pendiente", "Por decidir"], ["no", "No es agente"]] as const
const KINDS: [NonNullable<ProjectLink["kind"]>, string][] = [["repo", "GitHub"], ["doc", "Documento"], ["notas", "Notas"], ["app", "App"], ["carpeta", "Carpeta"], ["otro", "Otro"]]
const label = <T extends string>(opts: readonly (readonly [T, string])[], v?: T | null) => opts.find((o) => o[0] === v)?.[1]
const tone: Record<string, string> = { alta: "bg-accent/12 text-accent-ink", alto: "bg-accent/12 text-accent-ink", media: "bg-group text-text", medio: "bg-group text-text", baja: "bg-group text-sub", bajo: "bg-group text-sub", agente: "bg-strong/10 text-strong", no: "bg-group text-sub", pendiente: "bg-group text-sub" }

// Table order: urgency first (alta, media, baja, then untriaged), then priority, unset last.
const urgRank = (b?: Board) => ({ alta: 0, media: 1, baja: 2 } as Record<string, number>)[b?.urgency || ""] ?? 3
const prRank = (p: Project, b?: Board) => { const v = b?.priority ?? p.priority; return isNum(v) ? v : 999 }
const days = (a: string, b?: string | null) => Math.round((Date.parse(b || today()) - Date.parse(a)) / 864e5)
const phaseOf = (p: Project, b?: Board) => (b && b.phase !== undefined ? b.phase : defaultPhase(p))
const linksOf = (p: Project, b?: Board) => (b?.links ? b.links : p.links || [])

function useBoard() {
  const { board, db, write, canWrite, me, names } = useStore()
  const save = (p: Project, patch: Partial<Board>, what: string) => {
    const cur = board[p.id] || {}
    const entry = { at: new Date().toISOString(), by: (me && names[me]) || null, what }
    const next: Board = { ...cur, ...patch, log: [entry, ...(cur.log || [])].slice(0, 40) }
    return write(() => db.doc("tablero/" + p.id).set(next), "Guardado")
  }
  return { board, canWrite, save }
}

function Chip({ v, children }: { v?: string | null; children: React.ReactNode }) {
  return <span className={cn("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", v ? tone[v] || "bg-group text-text" : "bg-transparent text-faint")}>{children}</span>
}

// Inline select for editors, chip for everyone else.
function Pick<T extends string>({ value, opts, edit, onPick, empty = "Sin triage" }: { value?: T | null; opts: readonly (readonly [T, string])[]; edit: boolean; onPick: (v: T | null) => void; empty?: string }) {
  if (!edit) return <Chip v={value}>{label(opts, value) || empty}</Chip>
  return (
    <NativeSelect aria-label={empty} value={value || ""} onClick={(e) => e.stopPropagation()} onChange={(e) => onPick((e.target.value || null) as T | null)} className="h-8 w-[112px] py-0 pl-3 pr-8 text-xs">
      <option value="">{empty}</option>
      {opts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
    </NativeSelect>
  )
}

function PhasePick({ value, edit, onPick }: { value: number | null; edit: boolean; onPick: (v: number | null) => void }) {
  if (!edit) return <Chip v={value == null ? null : "fase"}>{value == null ? "Por confirmar" : `${value} · ${FASES[value]}`}</Chip>
  return (
    <NativeSelect aria-label="Fase" value={value ?? ""} onClick={(e) => e.stopPropagation()} onChange={(e) => onPick(e.target.value === "" ? null : Number(e.target.value))} className="h-8 w-[146px] py-0 pl-3 pr-8 text-xs">
      <option value="">Por confirmar</option>
      {FASES.map((f, i) => <option key={f} value={i}>{i} · {f}</option>)}
    </NativeSelect>
  )
}

export function Dashboard() {
  const { projects, updates, dependencies, loaded } = useStore()
  const { board, canWrite, save } = useBoard()
  const [phase, setPhase] = useState<number | "none" | null>(null)
  const [q, setQ] = useState("")
  const [open, setOpen] = useState<string | null>(null)
  const [tab, setTab] = useState<"proyectos" | "metodologia">("proyectos")
  const agents = agentsOf(projects)
  const last = useMemo(() => { const m: Record<string, string> = {}; updates.forEach((u) => { if (!m[u.projectId] || u.date > m[u.projectId]) m[u.projectId] = u.date }); return m }, [updates])

  const rows = agents.filter((p) => {
    const ph = phaseOf(p, board[p.id])
    if (phase === "none" ? ph != null : phase != null && ph !== phase) return false
    return !q || (p.name + " " + (p.sponsor || "") + " " + (p.bu || "")).toLowerCase().includes(q.toLowerCase())
  }).sort((a, b) => urgRank(board[a.id]) - urgRank(board[b.id]) || prRank(a, board[a.id]) - prRank(b, board[b.id]))
  const counts = FASES.map((_, i) => agents.filter((p) => phaseOf(p, board[p.id]) === i).length)
  const unset = agents.filter((p) => phaseOf(p, board[p.id]) == null).length
  const untriaged = agents.filter((p) => !board[p.id]?.urgency || !board[p.id]?.risk).length
  const openDeps = dependencies.filter((d) => !d.granted)
  const p = agents.find((x) => x.id === open)

  return (
    <main className="wrap">
      <section className="grid gap-[18px] pb-6 pt-[88px]">
        <h1 className="h-display">Tablero.<span className="sub">Los proyectos de agentes, de la solicitud a producción.</span></h1>
        <p className="lead">Triage, fase de la metodología, flujo de valor, dependencias y enlaces de cada proyecto en un solo lugar. {canWrite ? "Los cambios se guardan al instante y quedan en el historial del proyecto." : "Solo los editores cambian el triage."}</p>
      </section>

      <div className="seg mb-6" role="group" aria-label="Vista del tablero">
        <button type="button" aria-pressed={tab === "proyectos"} onClick={() => setTab("proyectos")}>Proyectos</button>
        <button type="button" aria-pressed={tab === "metodologia"} onClick={() => setTab("metodologia")}>Metodología</button>
      </div>

      {tab === "metodologia" ? (
        <Section>
          <SectionHead title="Metodología de AI Forward Deployment"><SecP>Cómo llevamos un caso de uso desde la solicitud de la BU hasta un agente autónomo, medido y con soporte, en siete fases. Tomada del documento de MegaMás Regulatorio, el primer proyecto que la sigue completa.</SecP></SectionHead>
          <DocReader project="regulatorio" only={["metodologia"]} />
        </Section>
      ) : <>
      <StatsRow>
        <Stat k="Proyectos de agentes" v={agents.length} sub={`${unset} sin fase confirmada`} />
        <Stat k="Sin triage completo" v={untriaged} sub="Falta urgencia o riesgo" accent={untriaged > 0} />
        <Stat k="Dependencias abiertas" v={openDeps.length} sub={openDeps.length ? `La más antigua: ${Math.max(...openDeps.map((d) => days(d.asked)))} días` : "Ninguna"} />
        <Stat k="En autonomía o más" v={agents.filter((x) => (phaseOf(x, board[x.id]) ?? -1) >= 4).length} sub="Fase 4 a 6: shadow, aprobaciones o autónomo" />
      </StatsRow>

      <Section>
        <SectionHead title="Por fase"><SecP>Las siete fases de la metodología de AI Forward Deployment. Toca una fase para filtrar la tabla.</SecP></SectionHead>
        <div className="grid grid-cols-8 gap-2 max-[900px]:grid-cols-4">
          {FASES.map((f, i) => (
            <button key={f} type="button" aria-pressed={phase === i} onClick={() => setPhase(phase === i ? null : i)}
              className={cn("card grid min-w-0 gap-1 border-0 p-3.5 text-left", phase === i && "shadow-[0_0_0_2px_var(--accent)]", !counts[i] && "opacity-60")}>
              <span className="text-[11px] font-medium text-faint">Fase {i}</span>
              <b className="num text-[26px] font-semibold leading-none tracking-[-.03em]">{counts[i]}</b>
              <span className="truncate text-xs text-sub">{f}</span>
            </button>
          ))}
          <button type="button" aria-pressed={phase === "none"} onClick={() => setPhase(phase === "none" ? null : "none")}
            className={cn("card grid min-w-0 gap-1 border-0 p-3.5 text-left", phase === "none" && "shadow-[0_0_0_2px_var(--accent)]", !unset && "opacity-60")}>
            <span className="text-[11px] font-medium text-faint">Sin fase</span>
            <b className="num text-[26px] font-semibold leading-none tracking-[-.03em]">{unset}</b>
            <span className="truncate text-xs text-sub">Por confirmar</span>
          </button>
        </div>
      </Section>

      <Section>
        <SectionHead title="Proyectos"><SecP>Ordenados por urgencia y, dentro de cada urgencia, por prioridad. Abre un proyecto para ver su flujo de valor, enlaces y bitácora.</SecP></SectionHead>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar proyecto, BU o patrocinador" className="h-9 max-w-[320px]" />
          {(phase !== null || q) && <Button variant="ghost" onClick={() => { setPhase(null); setQ("") }}>Quitar filtros</Button>}
          <span className="ml-auto text-xs text-faint">{rows.length} de {agents.length}</span>
        </div>
        <div className="group-box overflow-x-auto">
          {rows.length ? (
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead><tr className="text-left text-xs text-faint">{["#", "Proyecto · siguiente paso", "Fase", "Urgencia", "Riesgo", "¿Agente?", "Enlaces", "Último avance"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody>{rows.map((r) => {
                const b = board[r.id], lk = linksOf(r, b), pr = b?.priority ?? r.priority
                return (
                  <tr key={r.id} onClick={() => setOpen(r.id)} className="cursor-pointer border-t border-line align-top hover:bg-group/60">
                    <td className="num px-4 py-3 font-semibold">{isNum(pr) ? nf(pr) : "—"}</td>
                    <td className="w-[36%] px-4 py-3"><div className="font-semibold">{r.name}{hasDocs(r.id) && <span className="ml-2 rounded-full bg-strong/10 px-2 py-0.5 align-[2px] text-[11px] font-medium text-strong">Metodología</span>}</div><div className="text-xs text-faint">{r.sponsor || "Patrocinador por definir"}</div><div className="mt-1.5 line-clamp-2 text-[13px] text-sub">{r.next || "—"}</div>{r.blocker && <div className="mt-1 line-clamp-1 text-xs text-accent-ink" title={r.blocker}>Bloqueo: {r.blocker}</div>}</td>
                    <td className="px-3 py-3"><PhasePick value={phaseOf(r, b)} edit={canWrite} onPick={(v) => save(r, { phase: v }, `Fase: ${v == null ? "por confirmar" : `${v} · ${FASES[v]}`}`)} /></td>
                    <td className="px-4 py-3"><Pick value={b?.urgency} opts={URG} edit={canWrite} empty="Urgencia" onPick={(v) => save(r, { urgency: v }, `Urgencia: ${label(URG, v) || "sin definir"}`)} /></td>
                    <td className="px-4 py-3"><Pick value={b?.risk} opts={RISK} edit={canWrite} empty="Riesgo" onPick={(v) => save(r, { risk: v }, `Riesgo: ${label(RISK, v) || "sin definir"}`)} /></td>
                    <td className="px-4 py-3"><Pick value={b?.decision} opts={DEC} edit={canWrite} empty="Por decidir" onPick={(v) => save(r, { decision: v }, `¿Agente?: ${label(DEC, v) || "por decidir"}`)} /></td>
                    <td className="px-4 py-3">{lk.length ? <div className="flex max-w-[120px] flex-wrap gap-1">{KINDS.filter(([k]) => lk.some((l) => (l.kind || "otro") === k)).map(([k, l]) => <Chip key={k} v="media">{l} {lk.filter((x) => (x.kind || "otro") === k).length}</Chip>)}</div> : <span className="text-faint">—</span>}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sub">{last[r.id] ? fdate(last[r.id]) : "—"}</td>
                  </tr>
                )
              })}</tbody>
            </table>
          ) : <Empty>{loaded.p ? "Ningún proyecto coincide con el filtro." : "Cargando…"}</Empty>}
        </div>
      </Section>

      <Section>
        <SectionHead title="Dependencias"><SecP>Accesos de los que depende el trabajo. Días calendario desde el pedido; las abiertas siguen contando.</SecP></SectionHead>
        <Deps deps={dependencies} projects={projects} />
      </Section>
      </>}
      <div className="pb-11" />

      {p && <Detail p={p} onClose={() => setOpen(null)} />}
    </main>
  )
}

function Deps({ deps, projects, only }: { deps: Dependency[]; projects: Project[]; only?: string }) {
  const list = [...deps].filter((d) => !only || d.projects.includes(only)).sort((a, b) => Number(!!a.granted) - Number(!!b.granted) || days(b.asked, b.granted) - days(a.asked, a.granted))
  if (!list.length) return <Empty>Sin dependencias registradas.</Empty>
  const name = (id: string) => projects.find((p) => p.id === id)?.name || id
  return (
    <div className="group-box overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead><tr className="text-left text-xs text-faint">{["Dependencia", "Pedido", "Acceso", "Días", "Con quién", only ? "Nota" : "Proyectos"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
        <tbody>{list.map((d) => (
          <tr key={d.id} className="border-t border-line align-top">
            <td className="px-4 py-3 font-semibold">{d.name}</td>
            <td className="whitespace-nowrap px-4 py-3 text-sub">{fdate(d.asked)}</td>
            <td className="whitespace-nowrap px-4 py-3">{d.granted ? fdate(d.granted) : <span className="font-medium text-accent-ink">Sin acceso</span>}</td>
            <td className="num whitespace-nowrap px-4 py-3 font-semibold">{days(d.asked, d.granted)}{!d.granted && <span className="font-normal text-faint"> y contando</span>}</td>
            <td className="px-4 py-3 text-sub">{d.with || "—"}</td>
            <td className="px-4 py-3 text-sub">{only ? d.note || "—" : d.projects.map(name).join(", ") || "Todo el stack"}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}

function Detail({ p, onClose }: { p: Project; onClose: () => void }) {
  const { updates, dependencies, projects } = useStore()
  const { board, canWrite, save } = useBoard()
  const b = board[p.id], lk = linksOf(p, b), ph = phaseOf(p, b)
  const [notes, setNotes] = useState<string | null>(null)
  const [nl, setNl] = useState<ProjectLink>({ label: "", url: "", kind: "repo" })
  const ups = updates.filter((u) => u.projectId === p.id)
  const iv = p.intake?.vsm, asis = p.vsm?.asis || [], tobe = p.vsm?.tobe || []
  const addLink = () => {
    const url = nl.url.trim()
    if (!/^https?:\/\//.test(url)) return
    save(p, { links: [...lk, { ...nl, label: nl.label.trim() || url, url }] }, `Enlace agregado: ${nl.label.trim() || url}`)
    setNl({ label: "", url: "", kind: nl.kind })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={`Tablero · ${p.name}`} className="sm:max-w-[1040px]">
        <div className="grid min-w-0 gap-[34px] [&>*]:min-w-0">
        <div className="grid gap-2">
          <h2 className="text-[28px] font-semibold leading-tight tracking-[-.03em]">{p.name}</h2>
          <p className="text-sub">{p.summary || p.tagline}</p>
          <p className="text-xs text-faint">{[p.bu, p.sponsor && `Patrocinador: ${p.sponsor}`].filter(Boolean).join(" · ")}</p>
        </div>

        <div>
          <H5>Triage</H5>
          <div className="group-box grid grid-cols-5 gap-4 p-5 max-md:grid-cols-2">
            <Field l="Fase"><PhasePick value={ph} edit={canWrite} onPick={(v) => save(p, { phase: v }, `Fase: ${v == null ? "por confirmar" : `${v} · ${FASES[v]}`}`)} /></Field>
            <Field l="Urgencia"><Pick value={b?.urgency} opts={URG} edit={canWrite} empty="Sin definir" onPick={(v) => save(p, { urgency: v }, `Urgencia: ${label(URG, v) || "sin definir"}`)} /></Field>
            <Field l="Riesgo"><Pick value={b?.risk} opts={RISK} edit={canWrite} empty="Sin definir" onPick={(v) => save(p, { risk: v }, `Riesgo: ${label(RISK, v) || "sin definir"}`)} /></Field>
            <Field l="¿Es caso para agente?"><Pick value={b?.decision} opts={DEC} edit={canWrite} empty="Por decidir" onPick={(v) => save(p, { decision: v }, `¿Agente?: ${label(DEC, v) || "por decidir"}`)} /></Field>
            <Field l="Prioridad">{canWrite
              ? <Input type="number" min={0} step="1" defaultValue={b?.priority ?? p.priority ?? ""} className="h-8 w-24 text-xs" onBlur={(e) => { const v = e.target.value === "" ? null : Number(e.target.value); if (v !== (b?.priority ?? p.priority ?? null)) save(p, { priority: v }, `Prioridad: ${v ?? "por acordar"}`) }} />
              : <span className="num font-semibold">{b?.priority ?? p.priority ?? "Por acordar"}</span>}</Field>
          </div>
          <p className="mt-2 px-1 text-xs text-faint">La urgencia la asignan el Líder de IA y la jefatura, no la BU: qué pasa si no se atiende, si hay una fecha que lo exige y cuántos casos afecta. El riesgo define el rigor de las fases siguientes.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <div className="group-box p-5"><H5>Siguiente paso</H5><p>{p.next || "—"}</p></div>
          <div className="group-box p-5"><H5>Bloqueo</H5><p className={p.blocker ? "text-accent-ink" : ""}>{p.blocker || "Sin bloqueo"}</p></div>
        </div>

        {hasDocs(p.id) && (
          <div>
            <H5>Documentos de la metodología</H5>
            <DocReader project={p.id} start="vap" />
          </div>
        )}

        <div>
          <H5>Mapa de flujo de valor</H5>
          {iv?.steps.length ? <ValueStream v={iv} />
            : asis.length ? (
              <div className="grid gap-4">
                <Vsm title="Hoy (as-is)" steps={asis} note={p.vsm?.asisNote} />
                {tobe.length > 0 && <Vsm title="Propuesta (to-be)" steps={tobe} note={p.vsm?.tobeNote} />}
              </div>
            ) : <div className="group-box px-5 py-4 text-sub">Pendiente: se dibuja con los pasos y tiempos del VAP y el Task Register.</div>}
        </div>
        {!!p.intake?.steps?.length && <div><H5>Flujograma</H5><div className="max-w-full overflow-x-auto"><Flowchart steps={p.intake.steps} /></div></div>}

        <div>
          <H5>Enlaces</H5>
          <div className="group-box">
            {lk.length ? lk.map((l, i) => (
              <div key={l.url + i} className="flex items-center gap-3 border-t border-line px-5 py-3 first:border-t-0">
                <Chip v="media">{KINDS.find((k) => k[0] === (l.kind || "otro"))?.[1]}</Chip>
                <a href={l.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-medium text-accent-ink hover:underline">{l.label}</a>
                {canWrite && <button type="button" aria-label={`Quitar ${l.label}`} onClick={() => save(p, { links: lk.filter((_, j) => j !== i) }, `Enlace quitado: ${l.label}`)} className="rounded border-0 bg-transparent px-1 text-faint hover:text-text">×</button>}
              </div>
            )) : <Empty>Sin enlaces todavía.</Empty>}
            {canWrite && (
              <form className="flex flex-wrap items-end gap-2 border-t border-line px-5 py-3" onSubmit={(e) => { e.preventDefault(); addLink() }}>
                <NativeSelect aria-label="Tipo" value={nl.kind} onChange={(e) => setNl({ ...nl, kind: e.target.value as ProjectLink["kind"] })} className="h-9 w-[130px] text-xs">{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</NativeSelect>
                <Input value={nl.label} onChange={(e) => setNl({ ...nl, label: e.target.value })} placeholder="Nombre, p. ej. GitHub · repo" className="h-9 min-w-[160px] flex-1" />
                <Input value={nl.url} onChange={(e) => setNl({ ...nl, url: e.target.value })} placeholder="https://…" className="h-9 min-w-[200px] flex-[2]" />
                <Button type="submit" variant="ghost" disabled={!/^https?:\/\//.test(nl.url.trim())}>Agregar</Button>
              </form>
            )}
          </div>
        </div>

        <div><H5>Dependencias</H5><Deps deps={dependencies} projects={projects} only={p.id} /></div>

        {!!p.kpis?.length && (
          <div>
            <H5>KPIs</H5>
            <div className="group-box overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead><tr className="text-left text-xs text-faint">{["KPI", "Línea base", "Actual", "Meta"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
                <tbody>{p.kpis.map((k) => { const f = (v?: number | null) => (isNum(v) ? nf(v) + (k.unit ? " " + k.unit : "") : <span className="text-faint">Por medir</span>); return (
                  <tr key={k.id} className="border-t border-line"><td className="px-4 py-3 font-medium">{k.name}</td><td className="num px-4 py-3">{f(k.baseline)}</td><td className="num px-4 py-3">{f(k.current)}</td><td className="num px-4 py-3">{f(k.target)}</td></tr>
                ) })}</tbody>
              </table>
            </div>
          </div>
        )}

        <div>
          <H5>Notas de triage</H5>
          {canWrite
            ? <Textarea value={notes ?? b?.notes ?? ""} maxLength={4000} placeholder="Qué pasa si no se atiende, fechas que lo exigen, acuerdos con la jefatura…" onChange={(e) => setNotes(e.target.value)} onBlur={() => { if (notes != null && notes !== (b?.notes || "")) save(p, { notes }, "Notas actualizadas") }} />
            : <p className="group-box px-5 py-4 text-sub">{b?.notes || "Sin notas."}</p>}
        </div>

        <div>
          <H5>Bitácora</H5>
          <div className="group-box">
            {[...(b?.log || []).map((l) => ({ d: l.at, t: l.what + (l.by ? ` · ${l.by}` : ""), k: "Triage" })), ...ups.map((u) => ({ d: u.date, t: u.text, k: u.tag || "Avance" }))]
              .sort((x, y) => y.d.localeCompare(x.d)).slice(0, 30).map((e, i) => (
                <div key={i} className="grid grid-cols-[88px_76px_1fr] gap-3 border-t border-line px-5 py-3 text-sm first:border-t-0 max-sm:grid-cols-[76px_1fr]">
                  <span className="text-faint">{fdate(e.d.slice(0, 10))}</span><span className="text-xs text-faint max-sm:hidden">{e.k}</span><span>{e.t}</span>
                </div>
              ))}
            {!b?.log?.length && !ups.length && <Empty>Sin avances registrados.</Empty>}
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const Field = ({ l, children }: { l: string; children: React.ReactNode }) => <label className="grid content-start gap-1.5 text-xs text-sub">{l}<div>{children}</div></label>

function Vsm({ title, steps, note }: { title: string; steps: Parameters<typeof VsmDiagram>[0]["steps"]; note?: string }) {
  return (
    <div className="group-box p-4">
      <div className="mb-2 text-xs font-medium text-sub">{title}</div>
      <div className="max-w-full overflow-x-auto"><VsmDiagram steps={steps} /></div>
      {note && <p className="mt-2 text-xs text-faint">{note}</p>}
    </div>
  )
}
