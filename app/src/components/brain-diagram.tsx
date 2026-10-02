import { useStore } from "@/lib/store"
import { StatusPill } from "./shared"

// Company Brain as a system: every mundo's sources -> ingestion -> knowledge stores -> retrieval (RAG) -> agent
// with its four memory types, under one governance plane. Dots show live status where a box maps to a part of
// the Company Brain project (0 vocabulario, 1 documental, 2 operativos, 3 productos); the rest is the target design.
type B = { x: number; y: number; w: number; h: number; t: string; s?: string; s2?: string; part?: number; kind?: "box" | "mem" }
const COLS = [
  { x: 20, w: 184, label: "FUENTES · CADA MUNDO" },
  { x: 230, w: 190, label: "INGESTA" },
  { x: 448, w: 196, label: "CONOCIMIENTO" },
  { x: 674, w: 210, label: "RECUPERACIÓN · RAG" },
  { x: 914, w: 246, label: "AGENTE" },
]
const [A, Bc, C, D, E] = COLS
const BOXES: Record<string, B> = {
  docs: { x: A.x + 12, y: 92, w: A.w - 24, h: 52, t: "Documentos", s: "políticas, SOPs, SIGO" },
  erp: { x: A.x + 12, y: 160, w: A.w - 24, h: 52, t: "Sistemas y ERP", s: "transacciones, catálogos" },
  ventas: { x: A.x + 12, y: 228, w: A.w - 24, h: 52, t: "Ventas y operación", s: "por mundo y canal" },
  proy: { x: A.x + 12, y: 296, w: A.w - 24, h: 52, t: "Proyectos y tickets", s: "seguimiento del trabajo" },
  pdoc: { x: Bc.x, y: 92, w: Bc.w, h: 74, t: "Pipeline documental", s: "conectores → parsing →", s2: "chunking → embeddings", part: 1 },
  ent: { x: Bc.x, y: 184, w: Bc.w, h: 56, t: "Extracción de entidades", s: "personas, áreas, productos" },
  pest: { x: Bc.x, y: 258, w: Bc.w, h: 74, t: "Pipeline estructurado", s: "CDC por VPN, solo lectura", s2: "bronze → silver → gold", part: 2 },
  vec: { x: C.x, y: 92, w: C.w, h: 56, t: "Índice vectorial", s: "embeddings + permisos", part: 1 },
  kg: { x: C.x, y: 166, w: C.w, h: 56, t: "Grafo de conocimiento", s: "ontología y vocabulario", part: 0 },
  lake: { x: C.x, y: 240, w: C.w, h: 56, t: "Lakehouse", s: "datos operativos gobernados", part: 2 },
  sem: { x: C.x, y: 314, w: C.w, h: 56, t: "Capa semántica", s: "KPIs y productos de datos", part: 3 },
  router: { x: D.x, y: 92, w: D.w, h: 46, t: "Router de consulta", s: "elige la ruta por pregunta" },
  hyb: { x: D.x, y: 152, w: D.w, h: 46, t: "Búsqueda híbrida", s: "vectorial + palabras clave" },
  graph: { x: D.x, y: 212, w: D.w, h: 46, t: "Recorrido del grafo", s: "relaciones y contexto" },
  sql: { x: D.x, y: 272, w: D.w, h: 46, t: "Texto a SQL", s: "sobre la capa semántica" },
  rerank: { x: D.x, y: 332, w: D.w, h: 46, t: "Reranking + permisos", s: "lo que esa persona puede ver" },
  ctx: { x: D.x, y: 392, w: D.w, h: 46, t: "Contexto con citas", s: "fuente de cada dato" },
  llm: { x: E.x + 12, y: 92, w: E.w - 24, h: 46, t: "Modelo vía router", s: "el modelo indicado por tarea" },
  mWork: { x: E.x + 12, y: 152, w: E.w - 24, h: 46, t: "Memoria de trabajo", s: "la conversación y la tarea actual", kind: "mem" },
  mEpi: { x: E.x + 12, y: 210, w: E.w - 24, h: 46, t: "Memoria episódica", s: "ejecuciones y decisiones pasadas", kind: "mem" },
  mSem: { x: E.x + 12, y: 268, w: E.w - 24, h: 46, t: "Memoria semántica", s: "hechos y preferencias aprendidas", kind: "mem" },
  mProc: { x: E.x + 12, y: 326, w: E.w - 24, h: 46, t: "Memoria procedimental", s: "skills y playbooks", kind: "mem" },
  out: { x: E.x + 12, y: 392, w: E.w - 24, h: 46, t: "Portales · Claude · Agentes", s: "vía MCP, con tu identidad" },
}
const R = (k: string) => { const b = BOXES[k]; return { l: b.x, r: b.x + b.w, cy: b.y + b.h / 2, cx: b.x + b.w / 2, t: b.y, b: b.y + b.h } }
const curve = (a: string, b: string, dy = 0) => { const p = R(a), q = R(b), mx = (p.r + q.l) / 2; return `M${p.r} ${p.cy} C ${mx} ${p.cy}, ${mx} ${q.cy + dy}, ${q.l - 2} ${q.cy + dy}` }
const down = (a: string, b: string, x?: number) => { const p = R(a), q = R(b), cx = x ?? p.cx; return `M${cx} ${p.b} L${cx} ${q.t - 2}` }
const EDGES: [string, boolean?][] = [
  [curve("docs", "pdoc")], [curve("erp", "pest", -14)], [curve("ventas", "pest")], [curve("proy", "pest", 14)],
  [down("pdoc", "ent")], [curve("pdoc", "vec")], [curve("ent", "kg")], [curve("pest", "lake")], [down("lake", "sem")],
  [curve("vec", "hyb")], [curve("kg", "graph")], [curve("sem", "sql")],
  [down("hyb", "graph", R("hyb").l + 20)], [down("router", "hyb")], [down("rerank", "ctx")],
  [`M${R("router").l + 20} ${R("router").b} L${R("router").l + 20} ${R("hyb").t - 2}`],
  [`M${R("router").r - 18} ${R("router").b} L${R("router").r - 18} ${R("rerank").t - 2}`],
  [curve("ctx", "llm", 0)],
  [`M${R("mEpi").l} ${R("mEpi").cy} L${E.x - 12} ${R("mEpi").cy} L${E.x - 12} 452 L${R("kg").cx} 452 L${R("kg").cx} ${386}`, true],
]

export function BrainDiagram() {
  const { projects } = useStore()
  const parts = projects.find((p) => p.id === "companybrain")?.parts || []
  const st = (i?: number) => (i === undefined ? null : parts[i]?.status || "pendiente")
  return (
    <figure className="m-0 grid gap-3">
      <div className="overflow-x-auto card px-3.5 py-[18px]">
        <svg viewBox="0 20 1180 504" className="block h-auto w-full min-w-[920px] text-text" role="img"
          aria-label="Arquitectura del Company Brain: las fuentes de cada mundo pasan por pipelines de ingesta a un índice vectorial, un grafo de conocimiento, un lakehouse y una capa semántica; la recuperación RAG combina búsqueda híbrida, grafo y texto a SQL con reranking y permisos; el agente usa memoria de trabajo, episódica, semántica y procedimental, todo bajo un plano de gobierno.">
          <defs><marker id="cbArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z" fill="currentColor" opacity=".55" /></marker></defs>
          {COLS.map((c) => <text key={c.label} className="dg-g" x={c.x} y={40}>{c.label}</text>)}
          <rect className="dg-group" x={A.x + 8} y={66} width={A.w} height={300} rx="14" opacity=".5" />
          <rect className="dg-group" x={A.x + 4} y={62} width={A.w} height={300} rx="14" opacity=".75" />
          <rect className="dg-box" x={A.x} y={58} width={A.w} height={300} rx="14" />
          <text className="dg-s" x={A.x + 14} y={78}>el mismo patrón en todos</text>
          <rect className="dg-azure" x={C.x - 12} y={58} width={C.w + 24} height={326} rx="14" />
          <rect className="dg-group" x={E.x} y={58} width={E.w} height={392} rx="14" />
          <text className="dg-s" x={E.x + 14} y={78}>cuatro tipos de memoria</text>
          {EDGES.map(([d, dashed], i) => <path key={i} className="dg-a" d={d} markerEnd="url(#cbArrow)" style={dashed ? { strokeDasharray: "4 4" } : undefined} />)}
          <text className="dg-l" x={R("kg").cx + 10} y={444}>lo aprendido vuelve al Company Brain</text>
          {Object.entries(BOXES).map(([k, b]) => {
            const s = st(b.part)
            return (
              <g key={k}>
                <rect className={b.kind === "mem" ? "vb mixto" : "dg-box"} x={b.x} y={b.y} width={b.w} height={b.h} rx="10" />
                <text className="dg-t" x={b.x + 12} y={b.y + 20}>{b.t}</text>
                {b.s && <text className="dg-s" x={b.x + 12} y={b.y + 36}>{b.s}</text>}
                {b.s2 && <text className="dg-s" x={b.x + 12} y={b.y + 52}>{b.s2}</text>}
                {s && <circle className={"dg-d " + s} cx={b.x + b.w - 13} cy={b.y + 14} r="4" />}
              </g>
            )
          })}
          <rect className="dg-group" x={20} y={474} width={1140} height={40} rx="12" />
          <text className="dg-g" x={36} y={499}>GOBIERNO</text>
          <text className="dg-l" x={120} y={499}>Entra ID: permisos de cada persona   ·   Presidio: datos personales fuera   ·   trazas y costos por consulta   ·   evaluaciones de calidad   ·   aprobación humana antes de actuar</text>
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-[18px] text-[13px] text-sub"><span>Estado:</span><StatusPill status="listo" /><StatusPill status="en_curso" /><StatusPill status="pendiente" /><span className="inline-flex items-center gap-1.5"><i className="legend-swatch mixto" />Memoria del agente</span><span className="text-faint">Sin punto: diseño objetivo</span></div>
    </figure>
  )
}
