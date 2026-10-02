import { useState, type ReactNode } from "react"
import { ArrowRight, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { asanaUrl, discovery, phaseLabel, readiness, savings, STATUS, type AsanaTask, type Project, type Update } from "@/lib/domain"
import { fdate, fnum, isNum, nf, pct, today } from "@/lib/format"
import { useStore } from "@/lib/store"
import { useRouter } from "@/lib/router"

export function SectionHead({ eyebrow, title, children, className }: { eyebrow: string; title: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("grid max-w-[40em] gap-2.5", className)}>
      <span className="inline-flex items-center gap-2 text-[13px] font-medium text-sub before:size-1.5 before:rounded-full before:bg-accent before:content-['']">{eyebrow}</span>
      <h2 className="h-sec">{title}</h2>
      {children}
    </div>
  )
}
export const SecP = ({ children }: { children: ReactNode }) => <p className="text-[17px] tracking-[-.015em] text-sub">{children}</p>

export function Section({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return <section id={id} className={cn("grid scroll-mt-[60px] gap-[26px] pt-[84px]", className)}>{children}</section>
}

export function Hero({ eyebrow, title, sub, children, className }: { eyebrow: string; title: string; sub?: string; children?: ReactNode; className?: string }) {
  return (
    <section className={cn("grid gap-[18px] pb-14 pt-[88px]", className)}>
      <div className="eyebrow">{eyebrow}</div>
      <h1 className="h-display">{title}{sub && <span className="sub">{sub}</span>}</h1>
      {children}
    </section>
  )
}

export function Footer({ left = "Grupo PDC · Nexo · Liderazgo de IA", right }: { left?: string; right: string }) {
  return <footer className="mt-24 flex flex-wrap justify-between gap-3 border-t border-line pb-11 pt-[22px] text-xs text-faint"><span>{left}</span><span>{right}</span></footer>
}

export function StatusPill({ status, label, onClick }: { status: string; label?: string; onClick?: () => void }) {
  const text = label ?? STATUS[status] ?? status
  return onClick
    ? <button type="button" className={cn("status", status)} onClick={onClick} title="Cambiar estado"><i />{text}</button>
    : <span className={cn("status", status)}><i />{text}</span>
}

export function Stat({ k, v, unit, sub, accent }: { k: string; v: ReactNode; unit?: string; sub?: string; accent?: boolean }) {
  return (
    <div className="grid min-w-0 gap-1.5 py-[26px] pr-5 [&+&]:border-l [&+&]:border-line [&+&]:pl-5 max-md:[&:nth-child(3)]:border-l-0 max-md:[&:nth-child(3)]:pl-0 max-md:[&:nth-child(n+3)]:border-t">
      <span className="text-[13px] text-sub">{k}</span>
      <span className={cn("num flex flex-wrap items-baseline text-[38px] font-semibold leading-none tracking-[-.04em]", accent && "text-accent")}>{v}{unit && <small className="ml-0.5 text-xl font-medium tracking-[-.02em] text-faint">{unit}</small>}</span>
      {sub && <span className="text-[13px] text-faint">{sub}</span>}
    </div>
  )
}
export const StatsRow = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-4 border-y border-line max-md:grid-cols-2">{children}</div>

export function MiniBar({ label, done, total }: { label: string; done: number; total: number }) {
  return (
    <>
      <div className="flex justify-between gap-2"><span>{label}</span><b className="num font-semibold text-text">{done}/{total}</b></div>
      <div className="bar"><i style={{ width: pct(done, total) + "%" }} /></div>
    </>
  )
}

export function ProjectRow({ p, rank }: { p: Project; rank?: string }) {
  const { components } = useStore()
  const { openProject } = useRouter()
  const r = readiness(p, components), d = discovery(p), s = savings(p)
  let impact: ReactNode
  if (p.enabler) impact = <><div className="text-[17px] font-semibold">Base</div><div className="text-xs text-faint">{p.impactLabel || "Habilita el portafolio"}</div></>
  else if (s.saved) impact = <><div className="num text-[17px] font-semibold text-accent">{nf(s.saved)} {s.unit}</div><div className="text-xs text-faint">liberadas</div></>
  else if (isNum(s.baseline)) impact = <><div className="num text-[17px] font-semibold">{nf(s.baseline)} {s.unit}</div><div className="text-xs text-faint">manuales en alcance</div></>
  else impact = <div className="text-[13px] font-medium text-faint">Línea base pendiente</div>
  const vsmSteps = p.vsm?.asis?.length || 0
  return (
    <button type="button" onClick={() => openProject(p.id)}
      className="row w-full cursor-pointer border-0 bg-transparent text-left hover:bg-black/[.025] grid-cols-[44px_minmax(0,1fr)_150px_170px_16px] max-[820px]:grid-cols-[36px_minmax(0,1fr)_16px] [&+&]:before:left-20">
      <span className="num text-[26px] font-semibold leading-none tracking-[-.04em] max-[820px]:text-[22px]">{rank ?? ""}</span>
      <div className="min-w-0">
        <div className="text-[17px] font-semibold tracking-[-.02em]">{p.name}</div>
        <div className="mt-0.5 text-[13px] text-sub">{[p.sponsor, phaseLabel(p)].filter(Boolean).join(" · ")}</div>
        <div className="mt-1.5 flex flex-wrap gap-2.5 text-xs text-faint">
          {p.noAzure && <span className="font-medium text-accent-ink">Avanza sin Azure</span>}
          {vsmSteps > 0 && <span>Mapa de valor: {vsmSteps} pasos</span>}
          {Number(p.wave) === 2 && <span>Ola 2</span>}
          {p.blocker && <span className="text-sub">Bloqueo: {p.blocker}</span>}
        </div>
      </div>
      <div className="grid gap-1.5 text-xs text-sub max-[820px]:hidden">
        <MiniBar label="Stack" done={r.ready} total={r.total} />
        <div className="mt-1" />
        <MiniBar label={p.enabler ? "Hitos" : "Descubrimiento"} done={d.done} total={d.total} />
      </div>
      <div className="min-w-0 text-right max-[820px]:hidden">{impact}</div>
      <ChevronRight size={16} className="text-faint" aria-hidden />
    </button>
  )
}

export function UpdateRow({ u, showProject }: { u: Update; showProject?: boolean }) {
  const { projects, canWrite, db, write } = useStore()
  const { openProject } = useRouter()
  const p = projects.find((x) => x.id === u.projectId)
  const k = p && u.kpiId ? (p.kpis || []).find((x) => x.id === u.kpiId) : null
  return (
    <div className="row grid-cols-[84px_minmax(0,1fr)] items-start max-sm:grid-cols-1 max-sm:gap-1">
      <div className="num pt-px text-[13px] text-faint">{fdate(u.date)}</div>
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-baseline gap-2.5">
          {showProject && p && <button type="button" onClick={() => openProject(p.id)} className="border-0 bg-transparent p-0 text-left font-semibold hover:text-accent-ink">{p.name}</button>}
          <span className={cn("text-xs text-faint", u.tag === "Bloqueo" && "text-accent-ink")}>{u.tag || "Avance"}</span>
          {canWrite && <ConfirmDelete onConfirm={() => write(() => db.doc("updates/" + u.id).delete(), "Actualización eliminada")} />}
        </div>
        <div className="whitespace-pre-wrap break-words text-[15px]">{u.text}</div>
        {k && isNum(u.value) && <div className="num mt-1 text-[13px] font-medium text-accent-ink">{k.name}: {fnum(u.value, k.unit)}</div>}
      </div>
    </div>
  )
}

export function ConfirmDelete({ onConfirm, label = "Eliminar" }: { onConfirm: () => void; label?: string }) {
  const [armed, setArmed] = useState(false)
  return (
    <button type="button" className="ml-auto rounded-md border-0 bg-transparent px-1.5 py-0.5 text-xs text-faint hover:text-text"
      onClick={() => { if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 3000) } else onConfirm() }}>
      {armed ? "¿Eliminar?" : label}
    </button>
  )
}

export function TaskRow({ t, project }: { t: AsanaTask; project?: Project }) {
  const late = !t.done && !!t.due && t.due < today()
  return (
    <div className={cn("row grid-cols-[auto_minmax(0,1fr)_auto] px-5 py-[11px] text-sm", t.done && "opacity-80")}>
      <span aria-hidden className={cn("size-2 rounded-full", t.done ? "bg-strong" : "shadow-[inset_0_0_0_1.5px_var(--faint)]")} />
      <span className="min-w-0">
        <a href={asanaUrl(t.gid)} target="_blank" rel="noopener" className={cn("text-inherit no-underline hover:underline", t.done && "text-faint line-through decoration-line-2")}>{t.name}</a>
        {project && <span className="mt-px block text-xs text-faint">{project.name}</span>}
      </span>
      <span className={cn("num whitespace-nowrap text-xs text-faint", late && "font-semibold text-accent-ink")}>
        {t.done ? (t.completedAt ? "Cerrada " + fdate(t.completedAt) : "Cerrada") : t.due ? (late ? "Vencida · " : "") + fdate(t.due) : "Sin fecha"}
      </span>
    </div>
  )
}

export const Empty = ({ children }: { children: ReactNode }) => <div className="px-5 py-7 text-center text-faint">{children}</div>
export const H5 = ({ children }: { children: ReactNode }) => <h5 className="mb-2.5 px-1 text-[13px] font-medium tracking-normal text-sub">{children}</h5>

/** Invitation to submit a request, shown at the end of long pages. */
export function RequestCta() {
  const { go } = useRouter()
  return (
    <section className="mt-24 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 card px-8 py-8 max-sm:grid-cols-1 max-sm:px-6">
      <div className="grid gap-1.5">
        <h2 className="text-[clamp(22px,2.6vw,28px)] font-medium tracking-[-.03em]">¿Tienes un proceso manual que se repite?</h2>
        <p className="text-[15px] text-sub">Envíalo a Nexo. Toda solicitud se evalúa y entra al backlog de IA.</p>
      </div>
      <button type="button" onClick={() => go("solicitudes")}
        className="group inline-flex h-[52px] items-center gap-2 justify-self-start rounded-full bg-accent px-6 text-base font-medium text-white shadow-[0_8px_24px_-10px_rgba(255,81,0,.7)] transition hover:brightness-105">
        Enviar una solicitud<ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
      </button>
    </section>
  )
}
