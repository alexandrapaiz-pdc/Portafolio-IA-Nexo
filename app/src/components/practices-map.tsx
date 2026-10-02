import { useStore } from "@/lib/store"
import { StatusPill } from "./shared"

// Snapshot of github.com/alexandrapaiz-pdc/bestpracticesai (2 oct 2026): guides per level, what each level
// ships (skills, templates, examples) and open decisions in pendientes.md. Status comes from the database.
const LEVELS = [
  { n: "1", name: "Usuario de Claude", who: "Cualquier persona con licencia", guides: 11, ships: ["skill pdc-startup"], open: 16 },
  { n: "2", name: "Constructor de apps", who: "Portales, tableros y páginas", guides: 9, ships: ["skill publicar-app", "plantilla README"], open: 8 },
  { n: "2.5", name: "Backends", who: "Apps con sus propios datos", guides: 4, ships: ["skill crear-backend", "API base", "ejemplo KPIs"], open: 8 },
  { n: "3", name: "Agentes", who: "Sobre el stack de Nexo", guides: 7, ships: ["sandbox local"], open: 0 },
]
const DOT: Record<string, string> = { activo: "listo", en_construccion: "en_curso" }

export function PracticesMap() {
  const { projects } = useStore()
  const lv = projects.find((p) => p.id === "protocolos")?.levels || []
  const W = 228, G = 16, X0 = 14, BASE = 300
  return (
    <figure className="m-0 grid gap-3">
      <div className="overflow-x-auto card px-3.5 py-[18px]">
        <svg viewBox="0 40 1000 272" className="block h-auto w-full min-w-[720px] text-text" role="img"
          aria-label="Mapa de AI Best Practices: cuatro niveles en escalera, de usuario de Claude a agentes, con sus guías, skills y plantillas.">
          <defs><marker id="pmArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z" fill="currentColor" opacity=".55" /></marker></defs>
          {LEVELS.map((L, i) => {
            const x = X0 + i * (W + G), top = 150 - i * 32, st = DOT[lv[i]?.status || ""] || "pendiente"
            return (
              <g key={L.n}>
                <rect className="dg-box" x={x} y={top} width={W} height={BASE - top} rx="12" />
                <text className="dg-g" x={x + 16} y={top + 24}>NIVEL {L.n}</text>
                <circle className={"dg-d " + st} cx={x + W - 18} cy={top + 20} r="4.5" />
                <text className="dg-t" x={x + 16} y={top + 46} style={{ fontSize: 15 }}>{L.name}</text>
                <text className="dg-s" x={x + 16} y={top + 64}>{L.who}</text>
                {L.ships.map((s, k) => <text key={s} className="dg-l" x={x + 16} y={BASE - 64 + k * 16 - (L.ships.length - 1) * 16}>· {s}</text>)}
                <text className="dg-t" x={x + 16} y={BASE - 18} style={{ fontSize: 13 }}>{L.guides} guías</text>
                <text className="dg-s" x={x + W - 16} y={BASE - 18} textAnchor="end">{L.open ? `${L.open} por decidir` : "sin pendientes"}</text>
                {i < LEVELS.length - 1 && <path className="dg-a" d={`M${x + W - 40} ${top - 14} Q${x + W + G / 2} ${top - 40} ${x + W + G + 40} ${top - 46}`} markerEnd="url(#pmArrow)" />}
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex flex-wrap gap-[18px] text-[13px] text-sub"><StatusPill status="listo" label="Activo" /><StatusPill status="en_curso" label="En construcción" /><span className="text-faint">Fuente: GitHub · BestPracticesAI, 2 oct</span></div>
    </figure>
  )
}
