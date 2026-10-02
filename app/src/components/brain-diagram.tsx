import { useStore } from "@/lib/store"
import { StatusPill } from "./shared"

// Company Brain as one layered database: every mundo feeds it, and portals, agents and chat read from it.
// The first four layers are the Company Brain project's parts (live status); agent memory is the target layer.
const CX = 470, RX = 178, RY = 24, H = 40, GAP = 14, TOP = 70
const LAYERS: [string, string, number | null][] = [
  ["Vocabulario y ontología", "un mismo idioma para personas y agentes", 0],
  ["Conocimiento documental", "políticas, SOPs y documentos, con permisos", 1],
  ["Datos operativos", "ERP, ventas y operación de cada mundo", 2],
  ["Productos de datos", "KPIs y líneas base listas para usar", 3],
  ["Memoria de agentes", "lo que los agentes aprenden y recuerdan", null],
]
const OUT: [string, string][] = [["Portales", "Portal de Mundos y más"], ["Agentes", "trabajan con contexto"], ["Chat", "Claude para cualquier líder"]]
const yOf = (i: number) => TOP + i * (H + GAP)

export function BrainDiagram() {
  const { projects } = useStore()
  const parts = projects.find((p) => p.id === "companybrain")?.parts || []
  const st = (i: number | null) => (i === null ? null : parts[i]?.status || "pendiente")
  const mid = yOf(2) + H / 2
  return (
    <figure className="m-0 grid gap-3">
      <div className="overflow-x-auto card px-3.5 py-6">
        <svg viewBox="40 30 940 330" className="block h-auto w-full min-w-[720px]" role="img"
          aria-label="Company Brain como una base de datos de cinco capas: vocabulario y ontología, conocimiento documental, datos operativos, productos de datos y memoria de agentes. Los seis mundos la alimentan; portales, agentes y chat la consultan.">
          <defs>
            <linearGradient id="cbBody" x1="0" x2="1"><stop offset="0" stopColor="#e9eeff" /><stop offset=".5" stopColor="#ffffff" /><stop offset="1" stopColor="#dfe6ff" /></linearGradient>
            <linearGradient id="cbBodyA" x1="0" x2="1"><stop offset="0" stopColor="#ffe9de" /><stop offset=".5" stopColor="#fff7f2" /><stop offset="1" stopColor="#ffe1d2" /></linearGradient>
          </defs>
          <text className="dg-g" x={70} y={52}>6 MUNDOS</text>
          {[...Array(6)].map((_, i) => {
            const y = 86 + i * 46, ty = yOf(Math.min(4, Math.floor(i * 0.8))) + H / 2 + 6
            return (
              <g key={i}>
                <path d={`M98 ${y} C 200 ${y}, 220 ${ty}, ${CX - RX - 4} ${ty}`} fill="none" stroke="#4d6fff" strokeOpacity=".28" strokeWidth="1.2" />
                <path d={`M98 ${y} C 200 ${y}, 220 ${ty}, ${CX - RX - 4} ${ty}`} className="cb-flow" style={{ animationDelay: `${i * 0.25}s` }} fill="none" stroke="#4d6fff" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx={84} cy={y} r="9" fill="#fff" stroke="#00216f" strokeOpacity=".35" />
                <circle cx={84} cy={y} r="3" fill="#00216f" fillOpacity=".55" />
              </g>
            )
          })}
          {LAYERS.map((_, k) => {
            const i = LAYERS.length - 1 - k, y = yOf(i), [t, s, p] = LAYERS[i], acc = p === null, sv = st(p)
            return (
              <g key={t}>
                <path d={`M${CX - RX} ${y} V ${y + H} A ${RX} ${RY} 0 0 0 ${CX + RX} ${y + H} V ${y} Z`} fill={acc ? "url(#cbBodyA)" : "url(#cbBody)"} stroke={acc ? "#ff5100" : "#00216f"} strokeOpacity={acc ? 0.55 : 0.22} />
                <ellipse cx={CX} cy={y} rx={RX} ry={RY} fill={acc ? "#fff4ee" : "#f6f8ff"} stroke={acc ? "#ff5100" : "#00216f"} strokeOpacity={acc ? 0.55 : 0.22} />
                <text className="dg-t" x={CX} y={y + 30} textAnchor="middle">{t}</text>
                <text className="dg-s" x={CX} y={y + 46} textAnchor="middle">{s}</text>
                {sv && <circle className={"dg-d " + sv} cx={CX + RX - 22} cy={y + 30} r="4.5" />}
              </g>
            )
          })}
          <text className="dg-g" x={CX} y={46} textAnchor="middle" style={{ fill: "var(--navy)" }}>COMPANY BRAIN</text>
          {OUT.map(([t, s], i) => {
            const y = 96 + i * 92, cy = y + 28
            return (
              <g key={t}>
                <path d={`M${CX + RX + 4} ${mid} C ${CX + RX + 90} ${mid}, ${700} ${cy}, ${758} ${cy}`} fill="none" stroke="#ff5100" strokeOpacity=".3" strokeWidth="1.2" />
                <path d={`M${CX + RX + 4} ${mid} C ${CX + RX + 90} ${mid}, ${700} ${cy}, ${758} ${cy}`} className="cb-flow" style={{ animationDelay: `${i * 0.4}s` }} fill="none" stroke="#ff5100" strokeWidth="1.6" strokeLinecap="round" />
                <rect x={760} y={y} width={200} height={56} rx="14" fill="#fff" stroke="var(--line-2)" />
                <text className="dg-t" x={780} y={y + 25}>{t}</text>
                <text className="dg-s" x={780} y={y + 42}>{s}</text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-[18px] text-[13px] text-sub"><span>Estado de cada capa:</span><StatusPill status="listo" /><StatusPill status="en_curso" /><StatusPill status="pendiente" /><span className="text-faint">Memoria de agentes: capa objetivo</span></div>
    </figure>
  )
}
