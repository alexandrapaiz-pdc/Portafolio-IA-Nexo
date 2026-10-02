import { useStore } from "@/lib/store"
import { StatusPill } from "./shared"

// Company Brain: company sources feed four knowledge layers; agents, portals and Claude read from them.
// Each layer's dot shows the live status of the matching part of the Company Brain project.
// Sources are kinds of information every mundo has, not one system each: the stack of cards stands for all the mundos.
const SOURCES: [string, string, number][] = [["Documentos", "políticas, SOPs, SIGO", 0], ["Sistemas y ERP", "transacciones, catálogos", 1], ["Ventas y operación", "por mundo y canal", 1], ["Proyectos y tickets", "seguimiento del trabajo", 1]]
const CONSUMERS: [string, string][] = [["Agentes", "con contexto y memoria"], ["Portales", "Portal de Mundos y más"], ["Claude", "consultas de cualquier líder"]]

export function BrainDiagram() {
  const { projects } = useStore()
  const parts = projects.find((p) => p.id === "companybrain")?.parts || []
  const st = (i: number) => parts[i]?.status || "pendiente"
  const LY = [70, 160, 250], LH = 64 // documental, operativos, productos
  const layer = (i: number, y: number, t: string, s: string) => (
    <g key={t}>
      <rect className="dg-box" x={330} y={y} width={340} height={LH} rx="10" />
      <text className="dg-t" x={348} y={y + 27}>{t}</text><text className="dg-s" x={348} y={y + 45}>{s}</text>
      <circle className={"dg-d " + st(i)} cx={652} cy={y + 18} r="4.5" />
    </g>
  )
  return (
    <figure className="m-0 grid gap-3">
      <div className="overflow-x-auto card px-3.5 py-[18px]">
        <svg viewBox="0 0 1000 420" className="block h-auto w-full min-w-[720px] text-text" role="img"
          aria-label="Company Brain: los documentos, sistemas transaccionales, ventas y proyectos de cada mundo alimentan conocimiento documental, datos operativos y productos de datos, unidos por un vocabulario común; agentes, portales y Claude los consultan.">
          <defs><marker id="cbArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z" fill="currentColor" opacity=".55" /></marker></defs>
          <text className="dg-g" x={20} y={40}>CADA MUNDO DE GRUPO PDC</text>
          <rect className="dg-group" x={32} y={74} width={206} height={318} rx="14" opacity=".45" />
          <rect className="dg-group" x={26} y={68} width={206} height={318} rx="14" opacity=".7" />
          <rect className="dg-box" x={20} y={62} width={206} height={318} rx="14" />
          <text className="dg-s" x={36} y={366}>El mismo patrón en todos los mundos</text>
          <text className="dg-g" x={310} y={40}>COMPANY BRAIN · LEGIBLE POR MÁQUINAS</text>
          <text className="dg-g" x={790} y={40}>QUIÉN LO USA</text>
          <rect className="dg-azure" x={310} y={54} width={380} height={348} rx="16" />
          {SOURCES.map(([t, s, to], i) => {
            const y = 76 + i * 68, cy = y + 24, ty = (to === 0 ? LY[0] : LY[1]) + LH / 2 + (to === 0 ? 0 : (i - 2) * 8)
            return (
              <g key={t}>
                <rect className="dg-box" x={32} y={y} width={182} height={50} rx="10" />
                <text className="dg-t" x={46} y={y + 22}>{t}</text><text className="dg-s" x={46} y={y + 39}>{s}</text>
                <path className="dg-a" d={`M214 ${cy} C 272 ${cy}, 272 ${ty}, 328 ${ty}`} markerEnd="url(#cbArrow)" />
              </g>
            )
          })}
          {layer(1, LY[0], "Conocimiento documental", "consultado en vivo, con los permisos de cada persona")}
          {layer(2, LY[1], "Datos operativos", "copia gobernada, nunca consulta directa al ERP")}
          {layer(3, LY[2], "Productos de datos", "KPIs y líneas base por proyecto y por mundo")}
          <path className="dg-a" d={`M500 ${LY[1] + LH} L500 ${LY[2] - 2}`} markerEnd="url(#cbArrow)" />
          <rect className="dg-group" x={330} y={334} width={340} height={52} rx="10" />
          <text className="dg-t" x={348} y={356}>Vocabulario y ontología</text><text className="dg-s" x={348} y={373}>un mismo idioma para personas y agentes</text>
          <circle className={"dg-d " + st(0)} cx={652} cy={352} r="4.5" />
          {CONSUMERS.map(([t, s], i) => {
            const y = 110 + i * 96, cy = y + 24
            return (
              <g key={t}>
                <rect className="dg-box" x={790} y={y} width={190} height={48} rx="10" />
                <text className="dg-t" x={806} y={y + 21}>{t}</text><text className="dg-s" x={806} y={y + 37}>{s}</text>
                <path className="dg-a" d={`M692 ${228} C 740 ${228}, 740 ${cy}, 788 ${cy}`} markerEnd="url(#cbArrow)" />
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex flex-wrap gap-[18px] text-[13px] text-sub"><span>Estado de cada capa:</span><StatusPill status="listo" /><StatusPill status="en_curso" /><StatusPill status="pendiente" /></div>
    </figure>
  )
}
