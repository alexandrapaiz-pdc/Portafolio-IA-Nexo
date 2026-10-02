import { GlowCard } from "@/components/ui/spotlight-card"
import { useState } from "react"
import { ArrowRight, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Ticket } from "@/lib/domain"
import { fdate, isNum, nf } from "@/lib/format"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input, NativeSelect, Textarea } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Empty, Footer, Section, SectionHead, SecP, Stat, StatsRow } from "@/components/shared"

const AREAS = ["Nexo", "MegaMás", "Avon", "PDC Brands", "Vikingo", "Otra"]
const TTYPES = ["Automatización o agente", "Portal o tablero", "Análisis de datos", "Licencia o acceso a Claude", "Quiero construirlo yo (autoservicio)", "Otro"]
const URG = ["Baja", "Media", "Alta"]
const TSTATUS: [string, string][] = [["nuevo", "Nueva"], ["evaluacion", "En evaluación"], ["aprobado", "Aprobada"], ["proyecto", "En portafolio"], ["descartado", "Descartada"]]
const tLabel = (s: string) => (TSTATUS.find((x) => x[0] === s) || TSTATUS[0])[1]
const STEPS = [["Envías", "Describes el problema y cuánto tiempo toma hoy."], ["Evaluamos", "IA Nexo revisa impacto, datos y factibilidad."], ["Priorizamos", "Entra al backlog con una prioridad visible."], ["Construimos", "Las aprobadas se convierten en proyecto del portafolio."]]
const GATES = [["El stack de Nexo está en producción con sus controles", "Entra ID, Key Vault, kill switch y bitácoras de auditoría"], ["Los primeros agentes demuestran resultados medidos", "Kickoff de Avon y Contraloría con KPIs contra su línea base"], ["Las guías de Nivel 3 pasan la revisión de ciberseguridad", "Arquitectura, sandbox, contenedores, orquestación y seguridad"], ["La ruta de sandbox a producción está probada", "Lista de verificación y aprobación de Nexo para cada agente"]]

function TStat({ s }: { s: string }) {
  return <span className={cn("inline-flex items-center gap-[7px] whitespace-nowrap text-[13px] text-sub", s === "nuevo" && "text-accent-ink", (s === "aprobado" || s === "proyecto") && "text-strong", s === "descartado" && "text-faint")}>
    <i className={cn("size-2 rounded-full shadow-[inset_0_0_0_1.5px_var(--faint)]", s === "nuevo" && "bg-accent shadow-none", s === "evaluacion" && "bg-faint shadow-none", (s === "aprobado" || s === "proyecto") && "bg-strong shadow-none")} />{tLabel(s)}</span>
}

function code() { const d = new Date(), a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return `SOL-${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${a[Math.floor(Math.random() * a.length)]}${a[Math.floor(Math.random() * a.length)]}` }

export function Tickets() {
  const { tickets, triage, loaded, names } = useStore()
  const [filter, setFilter] = useState<"abiertas" | "todas" | "cerradas">("abiertas")
  const [open, setOpen] = useState<{ mode: "new" } | { mode: "view"; id: string } | null>(null)
  const st = (t: Ticket) => triage[t.id]?.status || "nuevo"
  const isOpen = (t: Ticket) => !["proyecto", "descartado"].includes(st(t))
  const all = [...tickets].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
  const openL = all.filter(isOpen), hrs = openL.reduce((a, t) => a + (isNum(t.hours) ? t.hours : 0), 0)
  const pr: Record<string, number> = { Alta: 0, Media: 1, Baja: 2 }
  const list = filter === "abiertas" ? [...openL].sort((a, b) => (triage[a.id]?.priority ?? 99) - (triage[b.id]?.priority ?? 99) || (pr[a.urgency || ""] ?? 3) - (pr[b.urgency || ""] ?? 3) || (b.hours || 0) - (a.hours || 0)) : filter === "cerradas" ? all.filter((t) => !isOpen(t)) : all
  const who = (id?: string | null) => (id && names[id]) || "Colaborador"

  return (
    <main className="wrap">
      <div className="screen grid gap-12">
      <section className="grid gap-[18px]">
        <div className="eyebrow">Abierto a toda la empresa</div>
        <h1 className="h-display">Envía tu solicitud.<span className="sub">¿Qué proceso deberíamos automatizar?</span></h1>
        <p className="lead">Si una tarea manual te quita horas cada semana, cuéntanos. Toma dos minutos.</p>
        <div className="mt-2"><button type="button" onClick={() => setOpen({ mode: "new" })} className="group inline-flex h-[52px] items-center gap-2 rounded-full bg-accent px-7 text-base font-medium text-white shadow-[0_8px_24px_-10px_rgba(255,81,0,.7)] transition hover:brightness-105">Enviar una solicitud<ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" /></button></div>
      </section>

      <div className="grid grid-cols-4 border-t border-line max-[760px]:grid-cols-2">
        {STEPS.map(([h, p], i) => <div key={h} className="grid min-w-0 gap-1 pr-[18px] pt-[18px] [&+&]:border-l [&+&]:border-line [&+&]:pl-[18px] max-[760px]:[&:nth-child(3)]:border-l-0 max-[760px]:[&:nth-child(3)]:pl-0"><b className="text-[13px] font-semibold text-accent">{i + 1}</b><span className="text-[15px] font-semibold tracking-[-.02em]">{h}</span><p className="text-[13px] text-sub">{p}</p></div>)}
      </div>
      </div>

      <Section className="pt-[72px]">
        <SectionHead eyebrow="Hacia dónde vamos" title="Descentralizar la IA, con guardrails.">
          <SecP>Hoy Nexo construye los agentes. Más adelante, y por confirmar, cada área podría construir los suyos sobre el mismo stack y con las mismas reglas.</SecP>
        </SectionHead>
        <div className="grid grid-cols-2 gap-3.5 max-[720px]:grid-cols-1">
          {[{ k: "Hoy", s: "nuevo", sl: "Activo", h: "Solicitud a Nexo", p: "Describes el problema; Nexo evalúa, prioriza y construye.", li: ["Nexo diseña, construye y opera el agente", "Prioridad según horas manuales, impacto y factibilidad", "Cada proyecto con línea base y KPI antes de construir"] },
            { k: "A largo plazo", s: "evaluacion", sl: "Proyecto potencial · por confirmar", h: "Autoservicio con guardrails", p: "Tu área construye su propio agente sobre el stack de Nexo; Nexo da el marco y revisa. Es una posibilidad a futuro, todavía no es un proyecto confirmado.", li: ["Sandbox para experimentar sin tocar datos reales", "Agentes y skills de Nexo que ayudan a construir: plantillas, guías de Nivel 3 y skills de AI Best Practices", "Revisión y aprobación de Nexo antes de pasar a producción", "Mismos controles: solo lectura, aprobación humana, kill switch y auditoría", "Todos los agentes, de Nexo o de cada área, centralizados en el Portal de agentes"] }].map((m) => (
            <GlowCard key={m.h} glowColor="pdc" backdrop="rgba(248,250,252,.72)" borderColor="rgba(15,23,42,.07)" customSize className="min-w-0 content-start gap-2.5 p-6 grid-rows-none shadow-[0_1px_2px_rgba(15,23,42,.04),0_10px_30px_-12px_rgba(15,23,42,.18)]">
              <div className="flex items-center gap-2.5 text-[13px] font-semibold"><span className={m.k === "Hoy" ? "text-accent" : "text-faint"}>{m.k}</span><span className={cn("inline-flex items-center gap-[7px] font-normal", m.s === "nuevo" ? "text-accent-ink" : "text-sub")}><i className={cn("size-2 rounded-full", m.s === "nuevo" ? "bg-accent" : "bg-faint")} />{m.sl}</span></div>
              <h3 className="text-[22px] leading-[1.15] tracking-[-.03em]">{m.h}</h3><p className="text-sm text-sub">{m.p}</p>
              <ul className="m-0 mt-1 grid list-none gap-2 p-0 text-sm">{m.li.map((x) => <li key={x} className="grid grid-cols-[auto_minmax(0,1fr)] gap-2.5 before:mt-2 before:size-[5px] before:rounded-full before:bg-faint before:content-['']">{x}</li>)}</ul>
            </GlowCard>
          ))}
        </div>
        <div>
          <div className="flex flex-wrap items-baseline gap-2.5 px-1 pb-2 text-[13px] text-sub"><b className="font-semibold text-text">Se habilita cuando</b><span>El marco se prueba primero con los proyectos de Nexo</span></div>
          <div className="group-box">{GATES.map(([h, n], i) => <div key={h} className="row grid-cols-[28px_minmax(0,1fr)]"><b className="text-[13px] font-semibold text-accent">{i + 1}</b><div><div>{h}</div><div className="mt-0.5 text-[13px] text-sub">{n}</div></div></div>)}</div>
        </div>
      </Section>

      <Section className="pt-[72px]">
        <SectionHead eyebrow="Backlog" title="Solicitudes recibidas." />
        <StatsRow>
          <Stat k="Solicitudes abiertas" v={openL.length} sub={`${all.length} en total`} />
          <Stat k="Nuevas" v={all.filter((t) => st(t) === "nuevo").length} accent={all.some((t) => st(t) === "nuevo")} sub="Sin revisar" />
          <Stat k="En evaluación" v={all.filter((t) => st(t) === "evaluacion").length} sub="Impacto y factibilidad" />
          <Stat k="Horas manuales al mes" v={nf(hrs)} sub="Estimadas por solicitantes" />
        </StatsRow>
        <div className="seg" role="group" aria-label="Filtrar solicitudes">{(["abiertas", "todas", "cerradas"] as const).map((f) => <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>)}</div>
        <div className="group-box">
          {list.length ? list.map((t) => { const tr = triage[t.id] || {}; return (
            <button key={t.id} type="button" onClick={() => setOpen({ mode: "view", id: t.id })} className="row w-full cursor-pointer grid-cols-[minmax(0,1fr)_120px_110px_16px] border-0 bg-transparent text-left hover:bg-black/[.025] max-[700px]:grid-cols-[minmax(0,1fr)_auto_16px]">
              <div className="min-w-0"><div className="text-base font-semibold tracking-[-.02em]"><span className="num mr-2 text-xs font-medium text-faint">{t.code}</span>{t.title}</div>
                <div className="mt-0.5 text-[13px] text-sub">{[t.area, t.type, who(t.createdBy), fdate((t.createdAt || "").slice(0, 10))].filter(Boolean).join(" · ")}{tr.priority ? ` · Prioridad ${tr.priority}` : ""}</div></div>
              <span className="num text-right text-[15px] font-semibold max-[700px]:hidden">{isNum(t.hours) ? nf(t.hours) + " h" : "—"}<small className="block text-xs font-normal text-faint">al mes · {t.urgency}</small></span>
              <TStat s={st(t)} /><ChevronRight size={16} className="text-faint" aria-hidden />
            </button>) }) : <Empty>{!loaded.t ? "Cargando solicitudes…" : filter === "abiertas" ? "No hay solicitudes abiertas. Envía la primera con “Nueva solicitud”." : "No hay solicitudes aquí."}</Empty>}
        </div>
        <p className="rounded-r-sm bg-group px-4 py-3 text-[13px] text-sub">Por ahora las solicitudes se guardan aquí; pasarán a Azure cuando esté listo.</p>
      </Section>
      <Footer right="Dudas: Alexandra Paiz, Líder de IA y Herramientas" />

      {open?.mode === "new" && <NewTicket onClose={() => setOpen(null)} />}
      {open?.mode === "view" && <TicketDetail id={open.id} who={who} onClose={() => setOpen(null)} />}
    </main>
  )
}

function NewTicket({ onClose }: { onClose: () => void }) {
  const { db, me, toast } = useStore()
  const [f, setF] = useState({ title: "", area: AREAS[0], type: TTYPES[0], urgency: "Media", problem: "", current: "", hours: "", people: "", wanted: "", impact: "", systems: "" })
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Nueva solicitud">
        <div className="grid gap-2.5"><h2 className="text-[clamp(26px,4vw,32px)] font-medium leading-[1.1] tracking-[-.03em]">Nueva solicitud</h2><p className="text-[17px] text-sub">Entre más concreto, más rápido se evalúa. Los números aproximados están bien.</p></div>
        {!db || !me ? <p className="text-[17px] text-sub">Inicia sesión en claude.ai con tu cuenta de Grupo PDC para enviar una solicitud.</p> : (
          <form className="grid gap-3.5" onSubmit={async (e) => {
            e.preventDefault(); if (!f.title.trim() || !f.problem.trim()) return; setBusy(true)
            const n = (v: string) => (v === "" ? null : Number(v))
            const doc = { code: code(), title: f.title.trim(), area: f.area, type: f.type, urgency: f.urgency, problem: f.problem.trim(), current: f.current.trim(), hours: n(f.hours), people: n(f.people), wanted: f.wanted || null, impact: f.impact.trim(), systems: f.systems.trim(), createdBy: me, createdAt: new Date().toISOString() }
            try { await db.collection("tickets").add(doc); onClose(); toast("Solicitud enviada: " + doc.code) }
            catch (err: unknown) { setBusy(false); toast((err as { code?: string })?.code === "invalid_argument" ? "Tu acceso a esta página es de solo lectura. Pide acceso de colaborador para enviar solicitudes." : "No se pudo enviar. Intenta de nuevo.") }
          }}>
            <Label>Título<Input required maxLength={120} value={f.title} onChange={set("title")} placeholder="Ej. Conciliar facturas de Tráfico contra órdenes de compra" /></Label>
            <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
              <Label>Área<NativeSelect value={f.area} onChange={set("area")}>{AREAS.map((a) => <option key={a}>{a}</option>)}</NativeSelect></Label>
              <Label>Tipo<NativeSelect value={f.type} onChange={set("type")}>{TTYPES.map((a) => <option key={a}>{a}</option>)}</NativeSelect></Label>
              <Label>Urgencia<NativeSelect value={f.urgency} onChange={set("urgency")}>{URG.map((a) => <option key={a}>{a}</option>)}</NativeSelect></Label>
            </div>
            <Label>¿Qué problema quieres resolver?<Textarea required value={f.problem} onChange={set("problem")} placeholder="Qué duele hoy y a quién afecta." /></Label>
            <Label>¿Cómo se hace hoy?<Textarea value={f.current} onChange={set("current")} placeholder="Pasos, herramientas y quién participa." /></Label>
            <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
              <Label>Horas manuales al mes<Input type="number" min={0} step="any" value={f.hours} onChange={set("hours")} placeholder="Ej. 20" /></Label>
              <Label>Personas involucradas<Input type="number" min={0} step={1} value={f.people} onChange={set("people")} placeholder="Ej. 3" /></Label>
              <Label>Fecha deseada<Input type="date" value={f.wanted} onChange={set("wanted")} /></Label>
            </div>
            <Label>¿Cómo sabremos que funcionó?<Input value={f.impact} onChange={set("impact")} placeholder="Ej. Cerrar el mes 3 días antes; 0 facturas vencidas" /></Label>
            <Label>Sistemas y datos<Input value={f.systems} onChange={set("systems")} placeholder="Ej. Excel, JD Edwards, SharePoint, correo" /></Label>
            <p className="text-xs text-faint">Cada solicitud llega por correo a Alexandra Paiz (IA Nexo) y queda visible para quienes tienen acceso a esta página.</p>
            <div className="flex justify-end gap-2"><Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button><Button variant="accent" type="submit" disabled={busy}>Enviar solicitud</Button></div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function TicketDetail({ id, who, onClose }: { id: string; who: (id?: string | null) => string; onClose: () => void }) {
  const { tickets, triage, canWrite, db, write } = useStore()
  const t = tickets.find((x) => x.id === id), tr = triage[id] || {}
  const [status, setStatus] = useState(tr.status || "nuevo"), [prio, setPrio] = useState(tr.priority != null ? String(tr.priority) : ""), [note, setNote] = useState(tr.note || ""), [armed, setArmed] = useState(false)
  if (!t) return null
  const st = tr.status || "nuevo"
  const F: [string, string | undefined][] = [["Área", t.area], ["Tipo", t.type], ["Solicitante", who(t.createdBy)], ["Enviada", fdate((t.createdAt || "").slice(0, 10))], ["Urgencia", t.urgency], ["Fecha deseada", t.wanted ? fdate(t.wanted) : ""], ["Horas manuales al mes", isNum(t.hours) ? nf(t.hours) + " h" : ""], ["Personas involucradas", isNum(t.people) ? String(t.people) : ""], ["Cómo se hace hoy", t.current], ["Cómo sabremos que funcionó", t.impact], ["Sistemas y datos", t.systems]]
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={t.code || "Solicitud"}>
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-3.5 text-[13px] text-faint"><TStat s={st} />{tr.priority ? <b className="font-semibold text-accent-ink">Prioridad {tr.priority}</b> : null}<span>{t.code}</span></div>
          <h2 className="text-[clamp(26px,4vw,32px)] font-medium leading-[1.1] tracking-[-.03em]">{t.title}</h2>
          <p className="max-w-[36em] text-[17px] text-sub">{t.problem}</p>
        </div>
        <div><h5 className="mb-2.5 px-1 text-[13px] font-medium tracking-normal text-sub">Detalle</h5>
          <div className="group-box grid grid-cols-[170px_minmax(0,1fr)] max-sm:grid-cols-1">
            {F.filter(([, v]) => v).map(([k, v], i) => <div key={k} className="contents"><div className={cn("px-5 py-3 text-[13px] text-sub", i && "border-t border-line")}>{k}</div><div className={cn("whitespace-pre-wrap break-words px-5 py-3 text-sm", i && "border-t border-line max-sm:border-t-0")}>{v}</div></div>)}
          </div>
        </div>
        {tr.note && !canWrite && <div><h5 className="mb-2.5 px-1 text-[13px] font-medium tracking-normal text-sub">Comentario de IA Nexo</h5><div className="group-box px-5 py-4">{tr.note}</div></div>}
        {canWrite && (
          <form className="grid gap-3.5 card px-5 py-4" onSubmit={(e) => { e.preventDefault(); write(() => db.doc("triage/" + id).set({ status, priority: prio === "" ? null : Number(prio), note: note.trim(), updatedAt: new Date().toISOString() }), "Evaluación guardada") }}>
            <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
              <Label>Estado<NativeSelect value={status} onChange={(e) => setStatus(e.target.value)}>{TSTATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</NativeSelect></Label>
              <Label>Prioridad en backlog<Input type="number" min={1} step={1} value={prio} onChange={(e) => setPrio(e.target.value)} placeholder="1 = primero" /></Label>
            </div>
            <Label>Comentario visible para el solicitante<Textarea value={note} onChange={(e) => setNote(e.target.value)} /></Label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={async () => { if (!armed) { setArmed(true); return } onClose(); await write(async () => { await db.doc("tickets/" + id).delete(); await db.doc("triage/" + id).delete() }, "Solicitud eliminada") }}>{armed ? "Confirmar eliminación" : "Eliminar"}</Button>
              <Button type="submit">Guardar evaluación</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
