import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useRouter, type View } from "@/lib/router"
import { useStore } from "@/lib/store"
import { fdate } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import logoLight from "@/assets/grupo-pdc-principal.png"

const TABS: { v: View; label: string; soon?: boolean }[] = [
  { v: "inicio", label: "Inicio" }, { v: "portafolio", label: "Portafolio" }, { v: "tareas", label: "Tareas" }, { v: "agentes", label: "Agentes", soon: true },
]

export function Nav() {
  const { view, go } = useRouter()
  const { canWrite, updates } = useStore()
  const tabsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const tr = tabsRef.current, tb = tr?.querySelector<HTMLElement>(`[data-v="${view}"]`)
    if (tr && tb && tr.scrollWidth > tr.clientWidth) tr.scrollLeft = tb.offsetLeft - tr.offsetLeft - 12
  }, [view])
  const stamp = updates[0]?.date
  return (
    <nav aria-label="Secciones" className="sticky top-[env(safe-area-inset-top,0px)] z-20 border-b border-line bg-glass backdrop-blur-xl backdrop-saturate-[1.8]">
      <div className="wrap flex h-12 items-center gap-3.5">
        <button type="button" onClick={() => go("inicio")} className="border-0 bg-transparent p-0" aria-label="Inicio">
          <img src={logoLight} alt="Grupo PDC" className="block h-5 w-auto" />
        </button>
        <div ref={tabsRef} role="tablist" aria-label="Vistas" className="ml-3.5 flex gap-1 max-sm:ml-1.5 max-sm:min-w-0 max-sm:flex-1 max-sm:overflow-x-auto max-sm:[scrollbar-width:none]">
          {TABS.map((t) => (
            <button key={t.v} data-v={t.v} type="button" onClick={() => go(t.v)} aria-current={view === t.v ? "page" : undefined}
              className={cn("flex-none whitespace-nowrap rounded-full border-0 bg-transparent px-3 py-[5px] text-[13px] font-medium text-sub max-sm:px-2.5", view === t.v && "bg-group text-text")}>
              {t.label}{t.soon && <Badge variant="soon" className="ml-1.5 align-[1px]">EN CONSTRUCCIÓN</Badge>}
            </button>
          ))}
        </div>
        <span className="flex-1 max-sm:hidden" />
        {canWrite && <span className="whitespace-nowrap text-xs font-medium text-accent-ink max-sm:hidden" title="Puedes editar esta página">Edición</span>}
        {stamp && <span className="whitespace-nowrap text-xs text-faint max-sm:hidden">Act. {fdate(stamp)}</span>}
        <button type="button" onClick={() => go("solicitudes")} aria-current={view === "solicitudes" ? "page" : undefined}
          className={cn("flex-none whitespace-nowrap rounded-full border-0 bg-accent px-[15px] py-1.5 text-[13px] font-semibold text-white hover:brightness-105", view === "solicitudes" && "shadow-[0_0_0_3px_var(--accent-soft)]")}>
          Solicitudes
        </button>
      </div>
    </nav>
  )
}
