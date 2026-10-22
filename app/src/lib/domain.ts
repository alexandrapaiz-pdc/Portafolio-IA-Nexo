import { isNum } from "./format"

export type Status = "pendiente" | "en_curso" | "listo"
export type Mode = "manual" | "mixto" | "agente"

export interface Kpi { id: string; name: string; unit?: string; baseline?: number | null; target?: number | null; current?: number | null; updated?: string; note?: string }
export interface Milestone { label: string; due?: string | null; done?: boolean }
export interface VsmStep { name: string; who?: string; pt?: number | null; wait?: number | null; ca?: number | null; mode?: Mode }
export interface Vsm { asis?: VsmStep[]; tobe?: VsmStep[]; asisNote?: string; tobeNote?: string; updated?: string }
export interface Level { name: string; who?: string; desc?: string; status: string }
export interface Project {
  id: string; name: string; bu?: string; sponsor?: string; tagline?: string; summary?: string
  site?: string; priority?: number; wave?: number; program?: string; enabler?: boolean; noAzure?: boolean; paused?: boolean
  phase?: string; blocker?: string; next?: string; impactLabel?: string
  pains?: string[]; needs?: string[]; discovery?: Milestone[]; kpis?: Kpi[]
  savings?: { baseline?: number | null; current?: number | null; target?: number | null; unit?: string; note?: string }
  vsm?: Vsm; intake?: Intake; levels?: Level[]; parts?: Level[]; repo?: string; pendingDecisions?: number
}
/** The project's intake guide, kept as the guide gave it (texts as written, numbers only where given). */
export interface IntakeStep { n: string; name: string; who: string; uses?: string; src?: string[]; out?: string; branch?: string | null }
export interface VsmRow { n: string; name: string; who?: string | null; est?: boolean; active?: string | null; lo?: number | null; hi?: number | null; wait?: string | null; effort?: string | null; stuck?: string | null }
export interface IntakeMetric { key: string; name: string; current?: string | null; target?: string | null; state: "medido" | "estimado" | "pendiente"; source?: string; kpi?: boolean; value?: number | null; unit?: string | null }
export interface Intake {
  status: "completada" | "pendiente"; date?: string; by?: string; url?: string
  process?: { bu?: string; area?: string; country?: string; what?: string; stages?: string[] }
  workflow?: { name?: string; trigger?: string; result?: string; problem?: string; improve?: string; owner?: string }
  parts?: { name: string; detail?: string }[]
  steps?: IntakeStep[]
  vsm?: { unit: string; case?: string; period?: string | null; steps: VsmRow[] }
  sources?: { id: string; name: string; who?: string; contact?: string; access?: string; state: "habilitado" | "pendiente" | "sin_estado"; url?: string }[]
  metrics?: IntakeMetric[]
  review?: { who?: string | null; cadence?: string; due?: string; period?: string | null; cases?: string }
  tracking?: { stage?: string; next?: string; blocker?: string; coordinator?: string | null; route?: [string, string, string][] }
  contacts?: { name: string; role?: string; email?: string | null }[]
  folder?: string
}
/** Agent projects and Company Brain are shown from their intake guide only. */
export const usesIntake = (p: Project) => inProgram(p, "agentes") || p.id === "companybrain"
/** Hours-person per month, by the guide's formula: cases per month × minutes-person per case ÷ 60. */
export function intakeHours(i?: Intake) {
  const m = (k: string) => i?.metrics?.find((x) => x.key === k)?.value
  const v = m("volume"), e = m("effort")
  return isNum(v) && isNum(e) ? (v * e) / 60 : null
}
export interface Component { id: string; name: string; owner?: string; note?: string; status: Status; order?: number; key?: boolean; updated?: string }
/** Quarterly deployment metrics (one doc per quarter, id "2026-Q4"). Missing = not measured yet. */
export interface QuarterMetrics {
  id: string; quarter: string; daysToValue?: number | null; liveWithUsers?: number | null; pilots?: number | null
  pilotsToProduction?: number | null; savingsUsd?: number | null; hoursSaved?: number | null; daysBlocked?: number | null; note?: string | null
  /** Values with a comment per metric card (e.g. 24 días · Avon); the quarter value is derived from them. */
  entries?: Partial<Record<string, MetricEntry[]>> | null
}
/** One submitted value: `v` (days, US$, hours), its comment, and `prod` for a pilot that reached production. */
export interface MetricEntry { v?: number | null; note?: string; prod?: boolean | null }
export const quarterOf = (d = new Date()) => `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`
export interface Update { id: string; projectId: string; date: string; tag?: string; text: string; kpiId?: string | null; value?: number | null; createdAt?: string }
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
  // Nexo AI Stack: hidden, agents run on the Vikingo AI agent platform. Kept for history.
  { id: "stack", hidden: true, name: "Nexo AI Stack", lead: "infra", sec: "stack-sec", line: "Azure, agentes, datos y controles: la base de todo." },
  { id: "practicas", name: "AI Best Practices", lead: "protocolos", sec: "practicas", line: "Nexo Apps: las guías por nivel y el sitio donde se publica cada app." },
  { id: "agentes", name: "AI Agent Projects", lead: null as string | null, sec: "proyectos", line: "Automatizaciones con dueño, línea base y KPI." },
  { id: "brain", name: "Company Brain", lead: "companybrain", sec: "brain", line: "Databricks, datos de la empresa y portales como Portal de Mundos." },
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
export function vsmStats(st: VsmStep[]) {
  const n = st.length, timed = st.filter((x) => isNum(x.pt) && isNum(x.wait)).length, full = n > 0 && timed === n
  const pt = st.reduce((a, x) => a + (isNum(x.pt) ? x.pt : 0), 0)
  const lt = st.reduce((a, x) => a + (isNum(x.pt) ? x.pt : 0) + (isNum(x.wait) ? x.wait : 0), 0)
  const caAll = n > 0 && st.every((x) => isNum(x.ca))
  const rca = caAll ? st.reduce((a, x) => a * (x.ca as number) / 100, 1) * 100 : null
  return { n, timed, full, pt, lt, eff: full && lt ? (pt / lt) * 100 : null, rca, ag: st.filter((x) => x.mode === "agente" || x.mode === "mixto").length }
}
