import { useState, type ReactNode } from "react"
import { ChevronRight } from "lucide-react"
import { inProgram, PROGRAMS, taskStats } from "@/lib/domain"
import { addDays, ago, today } from "@/lib/format"
import { useStore } from "@/lib/store"
import { useRouter } from "@/lib/router"
import { Button } from "@/components/ui/button"
import { Empty, Footer, Section, SectionHead, TaskRow } from "@/components/shared"

function Fold({ title, summary, children }: { title: string; summary: ReactNode; children: ReactNode }) {
  return (
    <details className="group overflow-hidden rounded-r bg-group">
      <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto_16px] items-center gap-3.5 px-5 py-4 hover:bg-black/[.025] [&::-webkit-details-marker]:hidden">
        <span className="text-base font-semibold tracking-[-.02em]">{title}</span>
        <span className="num whitespace-nowrap text-[13px] text-sub">{summary}</span>
        <ChevronRight size={18} className="text-faint transition-transform group-open:rotate-90" aria-hidden />
      </summary>
      <div className="border-t border-line">{children}</div>
    </details>
  )
}

export function Tasks() {
  const { projects, asana, asanaMeta, loaded, canWrite, mcp, syncing, syncErr, syncAsana } = useStore()
  const { openProject } = useRouter()
  const [showDone, setShowDone] = useState<string | null>(null)
  const t = today(), wk = addDays(t, 7)
  const tasksOf = (id: string) => asana[id]?.tasks || []
  const rows = projects.flatMap((p) => tasksOf(p.id).filter((x) => !x.done && x.due && x.due <= wk).map((x) => ({ t: x, p }))).sort((a, b) => (a.t.due || "").localeCompare(b.t.due || ""))
  const late = rows.filter((r) => (r.t.due || "") < t).length
  const order = [...projects].sort((a, b) => {
    const ga = PROGRAMS.findIndex((g) => inProgram(a, g.id) || g.lead === a.id), gb = PROGRAMS.findIndex((g) => inProgram(b, g.id) || g.lead === b.id)
    return ga - gb || (a.priority ?? 99) - (b.priority ?? 99)
  }).filter((p) => tasksOf(p.id).length)

  return (
    <main className="wrap">
      <section className="grid gap-[18px] pb-7 pt-[88px]">
        <div className="eyebrow">Backlog personal en Asana</div>
        <h1 className="h-display">Tareas.</h1>
        <p className="lead">El trabajo del día a día detrás de cada frente, sincronizado desde Asana.</p>
        <div className="flex flex-wrap items-center gap-3 text-[13px] text-faint">
          <span>{asanaMeta?.syncedAt ? `Sincronizado con Asana ${ago(asanaMeta.syncedAt)}` : "Aún no se ha sincronizado con Asana."}</span>
          {canWrite && mcp && <Button variant="ghost" disabled={syncing} onClick={syncAsana}>{syncing ? "Sincronizando…" : "Sincronizar Asana"}</Button>}
          {syncErr && <span className="text-accent-ink">{syncErr}</span>}
        </div>
      </section>

      <Section className="pt-6">
        <SectionHead eyebrow="Próximos 7 días" title="Esta semana." />
        <Fold title="Vencidas y por vencer" summary={rows.length ? <>{rows.length} tareas{late ? <> · <span className="text-accent-ink">{late} vencidas</span></> : null}</> : "Nada pendiente"}>
          {rows.length ? rows.map((r) => <TaskRow key={r.t.gid} t={r.t} project={r.p} />) : <Empty>{loaded.a ? "Nada vence en los próximos 7 días." : "Cargando tareas…"}</Empty>}
        </Fold>
      </Section>

      <Section>
        <SectionHead eyebrow="Por proyecto" title="Todo lo abierto." />
        <div className="grid gap-2.5">
          {order.length ? order.map((p) => {
            const list = tasksOf(p.id), st = taskStats(list), open = list.filter((x) => !x.done).sort((a, b) => (a.due || "9").localeCompare(b.due || "9")), sd = showDone === p.id
            return (
              <Fold key={p.id} title={p.name} summary={<>{st.total - st.done} abiertas{st.late ? <> · <span className="text-accent-ink">{st.late} vencidas</span></> : null} · {st.done} cerradas</>}>
                {open.length ? open.map((x) => <TaskRow key={x.gid} t={x} />) : <div className="row text-sm text-sub">Sin tareas abiertas.</div>}
                {sd && list.filter((x) => x.done).map((x) => <TaskRow key={x.gid} t={x} />)}
                <div className="flex flex-wrap gap-4 px-5 pb-3.5 pt-2.5 text-[13px]">
                  {st.done > 0 && <button type="button" className="border-0 bg-transparent p-0 text-sub hover:text-text" onClick={() => setShowDone(sd ? null : p.id)}>{sd ? "Ocultar cerradas" : `Mostrar ${st.done} cerradas`}</button>}
                  <button type="button" className="border-0 bg-transparent p-0 text-sub hover:text-text" onClick={() => openProject(p.id)}>Ver proyecto ›</button>
                </div>
              </Fold>
            )
          }) : <div className="group-box"><Empty>Sincroniza con Asana para ver las tareas.</Empty></div>}
        </div>
      </Section>
      <Footer right="Fuente: Asana · Backlog Personal" />
    </main>
  )
}
