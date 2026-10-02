import { useStore } from "@/lib/store"
import { StatusPill } from "./shared"

// Event-driven stack (Nexo, Sep 2026): sources outside Azure, a private VNet with the data plane and the
// Container Apps runtime, an event bus between them, and platform services underneath. Each node carries the
// stack component whose status its dot shows; null means it is not tracked as its own component.
type N = [key: string, x: number, y: number, w: number, h: number, title: string, sub: string, comp: string | null, tone?: "app" | "bus" | "dark" | "person"]
const NODES: N[] = [
  ["temporal", 10, 25, 225, 52, "Temporal Cloud", "solo flujos largos", "orquestacion"],
  ["m365", 10, 99, 225, 80, "Microsoft 365", "Entra ID · SharePoint · Excel", "controles"],
  ["asana", 10, 201, 225, 62, "Asana · Jira", "tokens de solo lectura", null],
  ["jde", 10, 285, 225, 66, "JD Edwards", "red local, vía VPN", "jde"],
  ["pg", 280, 88, 256, 46, "PostgreSQL · pgvector", "", "datos"],
  ["kv", 280, 143, 256, 46, "Key Vault", "", "controles"],
  ["dbx", 280, 198, 256, 68, "Databricks", "Unity Catalog · Lakeflow · Vector Search", "datos"],
  ["adls", 280, 275, 256, 44, "ADLS Gen2 · Delta", "", "datos"],
  ["lg", 572, 120, 172, 42, "LangGraph", "", "orquestacion", "app"],
  ["portal", 760, 120, 180, 42, "Portal Nexo", "", "dominio", "app"],
  ["dapr", 572, 170, 172, 42, "Dapr pub/sub", "", "containerapps", "app"],
  ["mcp", 760, 170, 180, 42, "Servidores MCP", "", "containerapps", "app"],
  ["langfuse", 572, 220, 172, 42, "Langfuse", "", "containerapps", "app"],
  ["litellm", 760, 220, 180, 42, "LiteLLM", "", "containerapps", "app"],
  ["workers", 572, 270, 172, 42, "Workers Temporal", "", "orquestacion", "app"],
  ["presidio", 760, 270, 180, 42, "Presidio", "", "containerapps", "app"],
  ["bus", 558, 336, 262, 44, "Bus de eventos", "Service Bus · Event Grid", null, "bus"],
  ["foundry", 268, 388, 258, 62, "Foundry", "Claude · Kimi K2.6", "foundry"],
  ["monitor", 537, 388, 136, 62, "Azure Monitor", "", null],
  ["safety", 682, 388, 136, 62, "Content Safety", "", "controles"],
  ["registry", 827, 388, 136, 62, "Registro de", "contenedores", "containerapps"],
  ["nav", 996, 120, 134, 44, "Navegador", "", null, "person"],
  ["claude", 996, 170, 134, 44, "Claude (MCP)", "", "licencias", "person"],
  ["github", 996, 384, 134, 72, "GitHub", "código y guías", "github", "dark"],
]
// [path, accent, dashed, both ends]
const EDGES: [string, boolean?, boolean?, boolean?][] = [
  ["M235 51 L700 51 L700 86", false, true, true],
  ["M235 139 L258 139 L258 236 L278 236"],
  ["M235 232 L258 232"],
  ["M235 318 L258 318 L258 250 L278 250", false, true],
  ["M538 111 L560 111", false, false, true],
  ["M560 166 L538 166"],
  ["M538 232 L560 232", false, false, true],
  ["M536 307 Q 560 330 600 334", false, false],
  ["M760 324 L760 334", true, false, true],
  ["M640 322 Q 560 360 470 386", true],
  ["M994 142 L942 142", true],
  ["M994 192 L942 192", true],
  ["M895 386 L895 324"],
  ["M994 420 L965 420"],
]

export function StackDiagram() {
  const { components } = useStore()
  const st = (id: string | null) => (id && components.find((c) => c.id === id)?.status) || "pendiente"
  return (
    <figure className="m-0 grid gap-3">
      <div className="overflow-x-auto card px-3.5 py-[18px]">
        <svg viewBox="0 0 1140 470" className="block h-auto w-full min-w-[820px] text-text" role="img"
          aria-label="Arquitectura del stack, orientada a eventos: Temporal Cloud, Microsoft 365, Asana, Jira y JD Edwards fuera de Azure; dentro de una VNet privada, PostgreSQL con pgvector, Key Vault, Databricks y ADLS, y Container Apps con LangGraph, Portal Nexo, Dapr, servidores MCP, Langfuse, LiteLLM, workers de Temporal y Presidio, conectados por un bus de eventos; abajo Foundry, Azure Monitor, Content Safety y el registro de contenedores. Las personas entran por el navegador o por Claude vía MCP.">
          <defs>
            <marker id="dgArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z" fill="currentColor" opacity=".55" /></marker>
            <marker id="dgArrowA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z" fill="var(--accent)" /></marker>
          </defs>
          <text className="dg-g" x={10} y={14}>FUERA DE AZURE</text>
          <rect className="dg-azure" x={256} y={5} width={720} height={455} rx="16" />
          <text className="dg-g" x={946} y={26} textAnchor="end">SUSCRIPCIÓN DE AZURE · EAST US 2</text>
          <circle className={"dg-d " + st("azure")} cx={958} cy={22} r="4" />
          <rect className="dg-group" x={270} y={59} width={692} height={268} rx="12" />
          <text className="dg-s" x={950} y={76} textAnchor="end">VNet privada</text>
          <rect x={562} y={88} width={389} height={233} rx="12" fill="var(--accent-soft)" stroke="var(--accent)" strokeOpacity=".55" />
          <text className="dg-t" x={940} y={108} textAnchor="end" style={{ fill: "var(--accent-ink)" }}>Container Apps · contenedores Docker</text>
          <text className="dg-g" x={996} y={108} style={{ fill: "var(--accent-ink)" }}>PERSONAS</text>
          {EDGES.map(([d, acc, dash, both], i) => (
            <path key={i} d={d} fill="none" stroke={acc ? "var(--accent)" : "var(--faint)"} strokeWidth={acc ? 1.6 : 1.25} strokeDasharray={dash ? "5 4" : undefined}
              markerEnd={`url(#${acc ? "dgArrowA" : "dgArrow"})`} markerStart={both ? `url(#${acc ? "dgArrowA" : "dgArrow"})` : undefined} />
          ))}
          {NODES.map(([k, x, y, w, h, t, sub, c, tone]) => {
            const fill = tone === "bus" ? "var(--accent)" : tone === "person" ? "var(--navy)" : tone === "dark" ? "#0f1115" : "var(--raise)"
            const ink = tone === "bus" || tone === "person" || tone === "dark" ? "#fff" : undefined
            const one = !sub
            return (
              <g key={k}>
                <rect x={x} y={y} width={w} height={h} rx="10" fill={fill} stroke={tone === "app" ? "var(--line)" : tone ? "none" : "var(--line-2)"} />
                <text className="dg-t" x={x + 12} y={one ? y + h / 2 + 4.5 : y + 21} style={ink ? { fill: ink } : undefined}>{t}</text>
                {sub && <text className="dg-s" x={x + 12} y={y + 38} style={ink ? { fill: ink, opacity: .85 } : undefined}>{sub}</text>}
                {c && <circle className={"dg-d " + st(c)} cx={x + w - 12} cy={y + 13} r="4" style={ink ? { stroke: "#fff" } : undefined} />}
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex flex-wrap gap-[18px] text-[12.5px] text-sub"><span>Estado de cada pieza:</span><StatusPill status="listo" /><StatusPill status="en_curso" /><StatusPill status="pendiente" /><span className="text-faint">Orientado a eventos · septiembre 2026</span></div>
    </figure>
  )
}
