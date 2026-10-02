import { useStore } from "@/lib/store"
import { StatusPill } from "./shared"

// Event-driven stack (Nexo, Sep 2026), in layers: data on a private network, an event bus in the middle
// (agents publish and subscribe, nobody calls anyone directly), the Container Apps runtime, and platform
// services underneath. Each node carries the stack component whose status its dot shows; null = not tracked.
type Tone = "app" | "dark" | "person"
type N = [key: string, x: number, y: number, w: number, h: number, title: string, sub: string, comp: string | null, tone?: Tone]
const NODES: N[] = [
  ["jde", 10, 66, 194, 62, "JD Edwards", "red local, por VPN", "jde"],
  ["m365", 10, 143, 194, 80, "Microsoft 365", "Entra ID · SharePoint · Excel", "controles"],
  ["asana", 10, 240, 194, 60, "Asana · Jira", "solo lectura", null],
  ["temporal", 10, 314, 194, 66, "Temporal Cloud", "solo flujos largos", "orquestacion"],
  ["dbx", 256, 64, 252, 68, "Databricks", "Unity Catalog · Lakeflow · Vector Search", "datos"],
  ["adls", 518, 64, 118, 68, "ADLS Gen2", "Delta", "datos"],
  ["pg", 646, 64, 134, 68, "PostgreSQL", "pgvector", "datos"],
  ["kv", 790, 64, 140, 68, "Key Vault", "llaves", "controles"],
  ["presidio", 256, 260, 162, 42, "Presidio", "", "containerapps", "app"],
  ["lg", 428, 260, 162, 42, "LangGraph", "", "orquestacion", "app"],
  ["langfuse", 600, 260, 162, 42, "Langfuse", "", "containerapps", "app"],
  ["portal", 772, 260, 158, 42, "Portal Nexo", "", "dominio", "app"],
  ["litellm", 256, 310, 162, 42, "LiteLLM", "", "containerapps", "app"],
  ["workers", 428, 310, 162, 42, "Workers Temporal", "", "orquestacion", "app"],
  ["dapr", 600, 310, 162, 42, "Dapr pub/sub", "", "containerapps", "app"],
  ["mcp", 772, 310, 158, 42, "Servidores MCP", "", "containerapps", "app"],
  ["foundry", 246, 388, 220, 62, "Foundry", "Claude · Kimi K2.6", "foundry"],
  ["safety", 476, 388, 146, 62, "Content Safety", "", "controles"],
  ["monitor", 632, 388, 166, 62, "Azure Monitor", "App Insights", null],
  ["registry", 808, 388, 132, 62, "Registro de", "contenedores", "containerapps"],
  ["portales", 976, 250, 150, 54, "Portales", "Portal de Mundos y más", null, "person"],
  ["claude", 976, 310, 150, 42, "Claude (MCP)", "", "licencias", "person"],
  ["github", 976, 388, 150, 62, "GitHub", "código y guías", "github", "dark"],
]
// [path, color, dashed, both ends]
type C = "accent" | "navy" | "gray"
const EDGES: [string, C, boolean?, boolean?][] = [
  ["M204 97 H 244", "gray", true],
  ["M204 183 H 244", "accent"],
  ["M204 270 H 244", "gray"],
  ["M204 347 H 244", "gray", true, true],
  ["M578 144 V 160", "accent"],
  ...[336, 508, 680, 852].map((x) => [`M${x} 208 V 228`, "accent", false, true] as [string, C, boolean, boolean]),
  ["M356 364 V 386", "navy"],
  ["M874 386 V 366", "gray"],
  ["M974 281 H 932", "navy"],
  ["M974 331 H 932", "navy"],
  ["M974 419 H 942", "gray"],
]
const STROKE: Record<C, string> = { accent: "var(--accent)", navy: "var(--navy)", gray: "var(--faint)" }

export function StackDiagram() {
  const { components } = useStore()
  const st = (id: string | null) => (id && components.find((c) => c.id === id)?.status) || "pendiente"
  return (
    <figure className="m-0 grid gap-3">
      <div className="overflow-x-auto card px-3.5 py-[18px]">
        <svg viewBox="0 0 1140 464" className="block h-auto w-full min-w-[820px] text-text" role="img"
          aria-label="Arquitectura del stack, orientada a eventos. Dentro de la suscripción de Azure: una capa de datos en red privada (Databricks, ADLS Gen2, PostgreSQL con pgvector, Key Vault), un bus de eventos donde los agentes publican y se suscriben, y Container Apps con Presidio, LangGraph, Langfuse, Portal Nexo, LiteLLM, workers de Temporal, Dapr y servidores MCP; abajo Foundry, Content Safety, Azure Monitor y el registro de contenedores. Fuera de Azure: JD Edwards por VPN, Microsoft 365, Asana, Jira y Temporal Cloud. Las personas entran por los portales, como Portal de Mundos, o por Claude vía MCP.">
          <defs>{(Object.keys(STROKE) as C[]).map((c) => <marker key={c} id={"sd-" + c} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z" fill={STROKE[c]} /></marker>)}</defs>
          <text className="dg-g" x={10} y={48}>FUERA DE AZURE</text>
          <rect className="dg-azure" x={232} y={5} width={722} height={455} rx="16" />
          <text className="dg-g" x={246} y={25}>SUSCRIPCIÓN DE AZURE · EAST US 2</text>
          <circle className={"dg-d " + st("azure")} cx={490} cy={21} r="4" />
          <rect x={246} y={34} width={694} height={110} rx="12" fill="var(--group)" stroke="var(--navy)" strokeOpacity=".35" />
          <text className="dg-g" x={258} y={54} style={{ fill: "var(--navy)" }}>DATOS · RED PRIVADA</text>
          <rect x={246} y={162} width={694} height={46} rx="12" fill="var(--accent)" />
          <text className="dg-t" x={593} y={181} textAnchor="middle" style={{ fill: "#fff" }}>Bus de eventos · Service Bus + Event Grid</text>
          <text className="dg-s" x={593} y={198} textAnchor="middle" style={{ fill: "#fff", opacity: .9 }}>los agentes publican y se suscriben; nadie se llama directo</text>
          <rect x={246} y={230} width={694} height={134} rx="12" fill="var(--accent-soft)" stroke="var(--accent)" strokeOpacity=".45" />
          <text className="dg-g" x={258} y={250} style={{ fill: "var(--accent-ink)" }}>CONTAINER APPS · CONTENEDORES DOCKER · RED PRIVADA</text>
          <text className="dg-g" x={976} y={240} style={{ fill: "var(--accent-ink)" }}>INTERFACES</text>
          {EDGES.map(([d, c, dash, both], i) => (
            <path key={i} d={d} fill="none" stroke={STROKE[c]} strokeWidth={c === "gray" ? 1.25 : 1.6} strokeDasharray={dash ? "5 4" : undefined}
              markerEnd={`url(#sd-${c})`} markerStart={both ? `url(#sd-${c})` : undefined} />
          ))}
          {NODES.map(([k, x, y, w, h, t, sub, c, tone]) => {
            const fill = tone === "person" ? "var(--navy)" : tone === "dark" ? "#0f1115" : "var(--raise)"
            const ink = tone === "person" || tone === "dark" ? "#fff" : undefined
            const one = !sub
            return (
              <g key={k}>
                <rect x={x} y={y} width={w} height={h} rx="10" fill={fill} stroke={tone === "person" || tone === "dark" ? "none" : "var(--line-2)"} />
                <text className="dg-t" x={x + 12} y={one ? y + h / 2 + 4.5 : y + 24} style={ink ? { fill: ink } : undefined}>{t}</text>
                {sub && <text className="dg-s" x={x + 12} y={y + (h < 60 ? 38 : 42)} style={ink ? { fill: ink, opacity: .85 } : undefined}>{sub}</text>}
                {c && <circle className={"dg-d " + st(c)} cx={x + w - 12} cy={y + 13} r="4" style={ink ? { stroke: "#fff" } : undefined} />}
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-x-[18px] gap-y-1 text-[13px] leading-5 text-sub"><span>Estado de cada pieza:</span><StatusPill status="listo" /><StatusPill status="en_curso" /><StatusPill status="pendiente" /><span className="text-faint">Orientado a eventos · septiembre 2026</span></div>
    </figure>
  )
}
