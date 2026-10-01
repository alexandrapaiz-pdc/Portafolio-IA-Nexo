import { useStore } from "@/lib/store"
import { StatusPill } from "./shared"

// Architecture from BestPracticesAI · Nivel 3 · Arquitectura and the Company Brain data plan.
// Each node carries the stack component whose status it shows.
const NODES: [string, number, number, number, number, string, string, string | null][] = [
  ["portal", 20, 134, 162, 52, "Portal de agentes", "apps.grupopdc.com", "dominio"],
  ["claude", 20, 206, 162, 52, "Claude", "consultas vía MCP", "licencias"],
  ["sp", 20, 318, 162, 52, "SharePoint y Excel", "fuente viva", null],
  ["jde", 20, 420, 162, 52, "JD Edwards", "ERP · solo lectura", "jde"],
  ["entra", 200, 170, 120, 52, "Entra ID", "identidad", "controles"],
  ["temporal", 380, 24, 160, 52, "Temporal Cloud", "fuera de Azure", "orquestacion"],
  ["lg", 380, 172, 160, 70, "LangGraph", "agentes y MCP", "orquestacion"],
  ["presidio", 590, 172, 150, 52, "Presidio", "enmascara PII", "containerapps"],
  ["litellm", 790, 172, 140, 52, "LiteLLM", "ruteo de modelos", "containerapps"],
  ["langfuse", 790, 270, 140, 52, "Langfuse", "trazas y costos", "containerapps"],
  ["foundry", 975, 172, 162, 52, "Microsoft Foundry", "modelos", "foundry"],
  ["dbx", 380, 420, 160, 52, "Databricks", "Unity Catalog · KPIs", "datos"],
  ["pg", 580, 420, 192, 52, "PostgreSQL + pgvector", "memoria de agentes", "datos"],
  ["kv", 790, 420, 140, 52, "Key Vault", "secretos", "azure"],
]
const EDGES: [string, string, number?, number?, string?][] = [
  ["M182 160 L198 184", ""], ["M182 232 L198 208", ""],
  ["M320 196 L378 196", "permisos", 349, 188],
  ["M182 344 L350 344 L350 226 L378 226", "Graph · en vivo", 266, 336],
  ["M460 76 L460 170", "inicia flujos · pausa para aprobación humana", 470, 122, "start"],
  ["M540 198 L588 198", "contexto", 565, 190],
  ["M740 198 L788 198", "sin PII", 765, 190],
  ["M930 198 L973 198", "modelo", 952, 190],
  ["M860 224 L860 268", "trazas", 868, 250, "start"],
  ["M440 242 L440 418", "KPIs y datos", 448, 392, "start"],
  ["M515 242 L515 392 L676 392 L676 418", "memoria", 590, 385],
  ["M182 446 L378 446", "Lakeflow · VPN", 280, 438],
  ["M860 420 L860 338", "secretos", 868, 385, "start"],
]

export function StackDiagram() {
  const { components } = useStore()
  const st = (id: string | null) => (id && components.find((c) => c.id === id)?.status) || "pendiente"
  return (
    <figure className="m-0 grid gap-3">
      <div className="overflow-x-auto rounded-r bg-group px-3.5 py-[18px]">
        <svg viewBox="0 0 1160 510" className="block h-auto w-full min-w-[760px] text-text" role="img"
          aria-label="Arquitectura del stack de IA de Nexo: el portal y Claude pasan por Entra ID a los agentes LangGraph en Azure Container Apps; Presidio enmascara datos y LiteLLM rutea a Microsoft Foundry; Temporal orquesta con aprobación humana; Databricks, PostgreSQL y Key Vault guardan datos, memoria y secretos; JD Edwards llega a Databricks por Lakeflow vía VPN.">
          <defs><marker id="dgArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z" fill="currentColor" opacity=".55" /></marker></defs>
          <rect className="dg-azure" x="188" y="100" width="962" height="398" rx="16" />
          <text className="dg-g" x="204" y="122">AZURE · pdc-nexo-ai</text><circle className={"dg-d " + st("azure")} cx="365" cy="118" r="4" />
          <rect className="dg-group" x="362" y="142" width="588" height="196" rx="14" />
          <text className="dg-g" x="378" y="162">CONTAINER APPS</text>
          {EDGES.map(([d, l, lx, ly, anc], i) => (
            <g key={i}><path className="dg-a" d={d} markerEnd="url(#dgArrow)" />{l && <text className="dg-l" x={lx} y={ly} textAnchor={(anc || "middle") as "start" | "middle"}>{l}</text>}</g>
          ))}
          {NODES.map(([k, x, y, w, h, t, sub, c]) => (
            <g key={k}>
              <rect className="dg-box" x={x} y={y} width={w} height={h} rx="10" />
              <text className="dg-t" x={x + 14} y={y + 23}>{t}</text><text className="dg-s" x={x + 14} y={y + 40}>{sub}</text>
              {c && <circle className={"dg-d " + st(c)} cx={x + w - 14} cy={y + 16} r="4" />}
            </g>
          ))}
        </svg>
      </div>
      <figcaption className="max-w-[60em] text-[13px] text-sub">Una pregunta entra por el portal o por Claude, Entra ID la identifica y el agente trabaja con los permisos de esa persona. Presidio quita los datos personales antes de que LiteLLM la envíe al modelo. Temporal dispara los flujos programados y se detiene a pedir aprobación humana antes de cualquier acción. JD Edwards se copia a Databricks por VPN y nunca se consulta directo. Fuente: BestPracticesAI · Nivel 3 · Arquitectura, y plan de datos de Company Brain.</figcaption>
      <div className="flex flex-wrap gap-[18px] text-[12.5px] text-sub"><span>Estado de cada pieza:</span><StatusPill status="listo" /><StatusPill status="en_curso" /><StatusPill status="pendiente" /></div>
    </figure>
  )
}
