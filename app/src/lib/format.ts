export const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)

const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

export function fdate(iso?: string | null) {
  if (!iso) return ""
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number)
  if (!m) return String(iso)
  return `${d} ${MES[m - 1]}${y !== 2026 ? " " + y : ""}`
}

export function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00")
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export const nf = (v: number) => v.toLocaleString("es-GT", { maximumFractionDigits: Math.abs(v) >= 1000 ? 0 : 1 })

export function fnum(v: unknown, unit = "") {
  if (!isNum(v)) return "—"
  if (unit === "Q" || unit === "US$") return `${unit} ${nf(v)}`
  if (unit === "%") return `${nf(v)}%`
  return unit ? `${nf(v)} ${unit}` : nf(v)
}

export const fh = (v: unknown) => (isNum(v) ? `${nf(v)} h` : "—")
export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

export function ago(iso?: string) {
  if (!iso) return ""
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return "hace un momento"
  if (m < 60) return `hace ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `hace ${h} h`
  return fdate(iso.slice(0, 10))
}

export const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o))
