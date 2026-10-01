import { addDays, isNum, today } from "./format"

export type Status = "pendiente" | "en_curso" | "listo"
export type Mode = "manual" | "mixto" | "agente"

export interface Kpi { id: string; name: string; unit?: string; baseline?: number | null; target?: number | null; current?: number | null; updated?: string; note?: string }
export interface Milestone { label: string; due?: string | null; done?: boolean }
export interface VsmStep { name: string; who?: string; pt?: number | null; wait?: number | null; ca?: number | null; mode?: Mode }
export interface Vsm { asis?: VsmStep[]; tobe?: VsmStep[]; asisNote?: string; tobeNote?: string; updated?: string }
export interface Level { name: string; who?: string; desc?: string; status: string }
export interface Project {
  id: string; name: string; bu?: string; sponsor?: string; tagline?: string; summary?: string
  priority?: number; wave?: number; program?: string; enabler?: boolean; noAzure?: boolean; paused?: boolean
  phase?: string; blocker?: string; next?: string; impactLabel?: string
  pains?: string[]; needs?: string[]; discovery?: Milestone[]; kpis?: Kpi[]
  savings?: { baseline?: number | null; current?: number | null; target?: number | null; unit?: string; note?: string }
  vsm?: Vsm; levels?: Level[]; parts?: Level[]; repo?: string; pendingDecisions?: number
  asana?: { gid: string; include?: string; exclude?: string }
}
export interface Component { id: string; name: string; owner?: string; note?: string; status: Status; order?: number; key?: boolean; updated?: string }
export interface Update { id: string; projectId: string; date: string; tag?: string; text: string; kpiId?: string | null; value?: number | null; createdAt?: string }
export interface AsanaTask { gid: string; name: string; done: boolean; due?: string | null; completedAt?: string | null }
export interface Ticket { id: string; code?: string; title: string; area?: string; type?: string; urgency?: string; problem?: string; current?: string; hours?: number | null; people?: number | null; wanted?: string | null; impact?: string; systems?: string; createdBy?: string | null; createdAt?: string }
export interface Triage { status?: string; priority?: number | null; note?: string; updatedAt?: string }

export const PHASES: [string, string][] = [["habilitacion", "Habilitación"], ["descubrimiento", "Descubrimiento"], ["construccion", "Construcción"], ["piloto", "Piloto"], ["produccion", "En producción"]]
export const STATUS: Record<string, string> = { pendiente: "Pendiente", en_curso: "En curso", listo: "Listo" }
export const NEXT_STATUS: Record<string, Status> = { pendiente: "en_curso", en_curso: "listo", listo: "pendiente" }
export const TAGS = ["Avance", "Decisión", "Bloqueo", "Hito"]
export const LSTAT: Record<string, [string, string]> = { activo: ["listo", "Activo"], en_construccion: ["en_curso", "En construcción"], pendiente: ["pendiente", "Pendiente"], listo: ["listo", "Listo"], en_curso: ["en_curso", "En curso"] }
export const NEXT_LEVEL: Record<string, string> = { activo: "pendiente", pendiente: "en_construccion", en_construccion: "activo" }
export const VMODES: Record<Mode, string> = { manual: "Manual", mixto: "Humano + agente", agente: "Agente" }

export const PROGRAMS = [
  { id: "stack", name: "Nexo AI Stack", lead: "infra", sec: "stack-sec", line: "Azure, agentes, datos y controles: la base de todo." },
  { id: "practicas", name: "AI Best Practices", lead: "protocolos", sec: "practicas", line: "Guías por nivel para usar y construir con IA, en GitHub." },
  { id: "brain", name: "Company Brain", lead: "companybrain", sec: "brain", line: "Databricks, datos de la empresa y portales como Portal de Mundos." },
  { id: "agentes", name: "AI Agent Projects", lead: null as string | null, sec: "proyectos", line: "Automatizaciones con dueño, línea base y KPI." },
]

export const phaseLabel = (p: Project) => (p.paused ? "En pausa" : (PHASES.find((x) => x[0] === p.phase) || [0, "—"])[1])
export const inProgram = (p: Project, g: string) => (p.program ? p.program === g : g === "agentes" && !p.enabler)
export const agentsOf = (ps: Project[]) => ps.filter((p) => inProgram(p, "agentes")).sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))

export function readiness(p: Project, comps: Component[]) {
  const list = (p.needs || []).map((id) => comps.find((c) => c.id === id)).filter(Boolean) as Component[]
  return { ready: list.filter((c) => c.status === "listo").length, total: list.length, list }
}
export function discovery(p: Project) {
  const d = p.discovery || []
  return { done: d.filter((x) => x.done).length, total: d.length }
}
export function savings(p: Project) {
  const s = p.savings || {}
  const saved = isNum(s.baseline) && isNum(s.current) ? Math.max(0, s.baseline - s.current) : null
  const pot = isNum(s.baseline) && isNum(s.target) ? Math.max(0, s.baseline - s.target) : null
  return { ...s, unit: s.unit || "h/mes", saved, pot }
}
export function taskStats(list: AsanaTask[]) {
  const t = today(), wk = addDays(t, 7), open = list.filter((x) => !x.done)
  return { done: list.length - open.length, total: list.length, late: open.filter((x) => x.due && x.due < t).length, week: open.filter((x) => x.due && x.due >= t && x.due <= wk).length }
}
export function vsmStats(st: VsmStep[]) {
  const n = st.length, timed = st.filter((x) => isNum(x.pt) && isNum(x.wait)).length, full = n > 0 && timed === n
  const pt = st.reduce((a, x) => a + (isNum(x.pt) ? x.pt : 0), 0)
  const lt = st.reduce((a, x) => a + (isNum(x.pt) ? x.pt : 0) + (isNum(x.wait) ? x.wait : 0), 0)
  const caAll = n > 0 && st.every((x) => isNum(x.ca))
  const rca = caAll ? st.reduce((a, x) => a * (x.ca as number) / 100, 1) * 100 : null
  return { n, timed, full, pt, lt, eff: full && lt ? (pt / lt) * 100 : null, rca, ag: st.filter((x) => x.mode === "agente" || x.mode === "mixto").length }
}
export const asanaUrl = (gid: string) => "https://app.asana.com/0/0/" + encodeURIComponent(gid)
