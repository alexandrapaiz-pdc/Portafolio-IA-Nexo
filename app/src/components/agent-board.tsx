import { ChevronRight } from "lucide-react"
import { agentsOf, PHASES, savings, type Project } from "@/lib/domain"
import { nf } from "@/lib/format"
import { useStore } from "@/lib/store"
import { useRouter } from "@/lib/router"
import { cn } from "@/lib/utils"

// Agent projects on a phase board: left to right is the road to production, the number is the agreed priority.
const COLS = PHASES.filter(([k]) => k !== "habilitacion")

export function AgentBoard() {
  const { projects } = useStore()
  const { openProject } = useRouter()
  const ag = agentsOf(projects)
  const rank = (p: Project) => ag.indexOf(p) + 1
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-4 gap-3">
        {COLS.map(([k, label], ci) => {
          const items = ag.filter((p) => (p.phase || "descubrimiento") === k)
          return (
            <div key={k} className="grid content-start gap-2.5">
              <div className="flex items-center gap-2 px-1 text-[13px] font-medium text-sub">
                <i className={cn("size-2 rounded-full", ci === 0 ? "bg-line-2" : ci === COLS.length - 1 ? "bg-strong" : "bg-accent")} />{label}
                <span className="num ml-auto text-faint">{items.length}</span>
                {ci < COLS.length - 1 && <ChevronRight size={14} className="text-faint" aria-hidden />}
              </div>
              <div className="grid min-h-[132px] content-start gap-2 rounded-r bg-group/70 p-2">
                {items.map((p) => {
                  const s = savings(p)
                  return (
                    <button key={p.id} type="button" onClick={() => openProject(p.id)}
                      className="grid gap-1 card px-3.5 py-3 text-left transition-shadow hover:shadow-[var(--shadow-hover)]">
                      <span className="flex items-baseline gap-2"><b className="num text-[13px] font-semibold text-accent">{rank(p)}</b><span className="text-[14px] font-medium leading-snug">{p.name}</span></span>
                      <span className="text-xs text-faint">{s.saved ? `${nf(s.saved)} ${s.unit} liberadas` : s.baseline ? `${nf(s.baseline)} ${s.unit} manuales` : p.blocker ? "Con bloqueo" : "Línea base pendiente"}</span>
                    </button>
                  )
                })}
                {!items.length && <span className="px-2 py-3 text-xs text-faint">Ninguno todavía</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
