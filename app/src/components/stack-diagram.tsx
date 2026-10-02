import { useStore } from "@/lib/store"
import { StatusPill } from "./shared"

// Event-driven stack (Nexo, Sep 2026): sources outside Azure, a private VNet with the data plane and the
// Container Apps runtime, an event bus between them, and platform services underneath. Each node carries the
// stack component whose status its dot shows; null means it is not tracked as its own component.
type N = [key: string, x: number, y: number, w: number, h: number, title: string, sub: string, comp: string | null, tone?: "app" | "bus" | "dark" | "person"]
const NODES: N[] = [
  ["temporal", 10, 70, 200, 56, "Temporal Cloud", "solo flujos largos", "orquestacion"],
  ["m365", 10, 142, 200, 56, "Microsoft 365", "Entra ID · SharePoint · Excel", "controles"],
  ["asana", 10, 214, 200, 56, "Asana · Jira", "tokens de solo lectura", null],
  ["jde", 10, 286, 200, 56, "JD Edwards", "red local, vía VPN", "jde"],
  ["pg", 272, 84, 210, 52, "PostgreSQL · pgvector", "memoria de agentes", "datos"],
  ["kv", 272, 146, 210, 52, "Key Vault", "secretos", "controles"],
  ["dbx", 272, 208, 210, 52, "Databricks", "Unity Catalog · Lakeflow", "datos"],
  ["adls", 272, 270, 210, 52, "ADLS Gen2 · Delta", "almacenamiento", "datos"],
  ["lg", 518, 116, 180, 44, "LangGraph", "", "orquestacion", "app"],
  ["portal", 706, 116, 180, 44, "Portal Nexo", "", "dominio", "app"],
  ["dapr", 518, 166, 180, 44, "Dapr pub/sub", "", "containerapps", "app"],
  ["mcp", 706, 166, 180, 44, "Servidores MCP", "", "containerapps", "app"],
  ["langfuse", 518, 216, 180, 44, "Langfuse", "", "containerapps", "app"],
  ["litellm", 706, 216, 180, 44, "LiteLLM", "", "containerapps", "app"],
  ["workers", 518, 266, 180, 44, "Workers Temporal", "", "orquestacion", "app"],
  ["presidio", 706, 266, 180, 44, "Presidio", "", "containerapps", "app"],
  ["bus", 560, 368, 284, 46, "Bus de eventos", "Service Bus · Event Grid", null, "bus"],
  ["foundry", 256, 436, 200, 50, "Foundry", "Claude · Kimi K2.6", "foundry"],
  ["monitor", 472, 436, 140, 50, "Azure Monitor", "", null],
  ["safety", 628, 436, 140, 50, "Content Safety", "", "controles"],
  ["registry", 784, 436, 130, 50, "Registro", "de contenedores", "containerapps"],
  ["nav", 956, 116, 170, 44, "Navegador", "", null, "person"],
  ["claude", 956, 166, 170, 44, "Claude (MCP)", "", "licencias", "person"],
  ["github", 956, 436, 170, 50, "GitHub", "código y guías", "github", "dark"],
]
// [path, accent, dashed, both ends] — orthogonal routing on a shared grid
const EDGES: [string, boolean?, boolean?, boolean?][] = [
  ["M110 70 V 16 H 608 V 82", false, true, true],
  ["M210 170 H 228"], ["M210 242 H 228"], ["M210 314 H 228", false, true],
  ["M228 170 V 314"], ["M228 234 H 270"],
  ["M482 110 H 504", false, false, true],
  ["M504 172 H 484"],
  ["M482 234 H 504", false, false, true],
  ["M377 322 V 346 H 600 V 366"],
  ["M702 324 V 366", true, false, true],
  ["M560 391 H 430 V 434", true],
  ["M954 138 H 900", true],
  ["M954 188 H 900", true],
  ["M872 434 V 324"],
  ["M954 461 H 916"],
]
const LABELS: [string, number, number, ("start" | "middle" | "end")?][] = [["flujos largos", 360, 12, "middle"], ["VPN", 214, 306], ["eventos", 712, 350]]

export function StackDiagram() {
  const { components } = useStore()
  const st = (id: string | null) => (id && components.find((c) => c.id === id)?.status) || "pendiente"
  return (
    <figure className="m-0 grid gap-3">
      <div className="overflow-x-auto card px-3.5 py-[18px]">
        <svg viewBox="0 0 1140 500" className="block h-auto w-full min-w-[820px] text-text" role="img"
          aria-label="Arquitectura del stack, orientada a eventos: Temporal Cloud, Microsoft 365, Asana, Jira y JD Edwards fuera de Azure; dentro de una VNet privada, PostgreSQL con pgvector, Key Vault, Databricks y ADLS, y Container Apps con LangGraph, Portal Nexo, Dapr, servidores MCP, Langfuse, LiteLLM, workers de Temporal y Presidio, conectados por un bus de eventos; abajo Foundry, Azure Monitor, Content Safety y el registro de contenedores. Las personas entran por el navegador o por Claude vía MCP.">
          <defs>
            <marker id="dgArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z" fill="currentColor" opacity=".55" /></marker>
            <marker id="dgArrowA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z" fill="var(--accent)" /></marker>
          </defs>
          <text className="dg-g" x={10} y={56}>FUERA DE AZURE</text>
          <rect className="dg-azure" x={240} y={30} width={690} height={466} rx="16" />
          <text className="dg-g" x={256} y={50}>SUSCRIPCIÓN DE AZURE · EAST US 2</text>
          <circle className={"dg-d " + st("azure")} cx={500} cy={46} r="4" />
          <rect className="dg-group" x={256} y={62} width={658} height={274} rx="12" />
          <text className="dg-s" x={902} y={78} textAnchor="end">VNet privada</text>
          <rect x={506} y={84} width={392} height={238} rx="12" fill="var(--accent-soft)" stroke="var(--accent)" strokeOpacity=".45" />
          <text className="dg-g" x={518} y={104} style={{ fill: "var(--accent-ink)" }}>CONTAINER APPS · DOCKER</text>
          <text className="dg-g" x={956} y={104}>PERSONAS</text>
          <text className="dg-g" x={956} y={424}>CÓDIGO</text>
          <text className="dg-g" x={256} y={424}>SERVICIOS DE PLATAFORMA</text>
          {EDGES.map(([d, acc, dash, both], i) => (
            <path key={i} d={d} fill="none" stroke={acc ? "var(--accent)" : "var(--faint)"} strokeWidth={acc ? 1.6 : 1.25} strokeDasharray={dash ? "5 4" : undefined}
              markerEnd={d.endsWith("H 228") || d.startsWith("M228 170") ? undefined : `url(#${acc ? "dgArrowA" : "dgArrow"})`} markerStart={both ? `url(#${acc ? "dgArrowA" : "dgArrow"})` : undefined} />
          ))}
          {LABELS.map(([t, x, y, a]) => <text key={t} className="dg-l" x={x} y={y} textAnchor={a || "start"}>{t}</text>)}
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
