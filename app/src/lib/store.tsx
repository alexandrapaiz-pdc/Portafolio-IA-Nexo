/* Data store: wraps the claude.ai artifact runtime (db, user, mcp) behind one React context.
   The page renders without it (empty states) and lights up when the capabilities resolve. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { AsanaTask, Component, Project, Ticket, Triage, Update } from "./domain"

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any
declare global { interface Window { claude?: { use: (name: string) => Promise<Any> } } }

export interface Store {
  db: Any; user: Any; mcp: Any
  canWrite: boolean; me: string | null; names: Record<string, string>
  projects: Project[]; components: Component[]; updates: Update[]
  asana: Record<string, { tasks: AsanaTask[]; syncedAt?: string }>; asanaMeta: { syncedAt?: string } | null
  tickets: Ticket[]; triage: Record<string, Triage>
  loaded: { p: boolean; c: boolean; u: boolean; a: boolean; t: boolean }
  noDb: boolean
  syncing: boolean; syncErr: string
  toast: (m: string) => void
  write: (fn: () => Promise<unknown>, ok?: string) => Promise<boolean>
  syncAsana: () => Promise<void>
}

const Ctx = createContext<Store | null>(null)
export const useStore = () => { const s = useContext(Ctx); if (!s) throw new Error("StoreProvider missing"); return s }

const SYNC_MSG: Record<string, string> = {
  needs_reauth: "Reconecta Asana en claude.ai › Ajustes › Conectores.",
  server_not_connected: "Agrega el conector de Asana en claude.ai › Ajustes › Conectores.",
  selection_required: "Elige cuál conector de Asana usar e intenta de nuevo.",
  not_in_manifest: "Asana no está permitido para esta página. Actívalo en los permisos de la página.",
  blocked_by_policy: "La política de tu organización bloquea Asana aquí.",
  approval_required: "Tu organización requiere aprobación para esta herramienta de Asana.",
  server_unavailable: "Asana no respondió. Intenta en un momento.",
  tool_error: "Asana devolvió un error: ",
}
const OPT = "name,subtasks.name,subtasks.completed,subtasks.completed_at,subtasks.due_on"

export function StoreProvider({ children }: { children: ReactNode }) {
  const [caps, setCaps] = useState<{ db: Any; user: Any; mcp: Any }>({ db: null, user: null, mcp: null })
  const [canWrite, setCanWrite] = useState(false)
  const [me, setMe] = useState<string | null>(null)
  const [names, setNames] = useState<Record<string, string>>({})
  const [projects, setProjects] = useState<Project[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [updates, setUpdates] = useState<Update[]>([])
  const [asana, setAsana] = useState<Store["asana"]>({})
  const [asanaMeta, setAsanaMeta] = useState<Store["asanaMeta"]>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [triage, setTriage] = useState<Record<string, Triage>>({})
  const [loaded, setLoaded] = useState({ p: false, c: false, u: false, a: false, t: false })
  const [noDb, setNoDb] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncErr, setSyncErr] = useState("")
  const [toastMsg, setToastMsg] = useState("")
  const toastTimer = useRef<number>(0)
  const autoSynced = useRef(false)

  const toast = useCallback((m: string) => {
    setToastMsg(m); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToastMsg(""), 2600)
  }, [])

  const write = useCallback(async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); if (ok) toast(ok); return true }
    catch (e: Any) { toast(e?.code === "invalid_argument" ? "No tienes permiso para editar esta página." : "No se pudo guardar. Intenta de nuevo."); return false }
  }, [toast])

  // Boot: resolve capabilities, then subscribe once to each collection.
  useEffect(() => {
    const cl = window.claude
    const all = () => setLoaded({ p: true, c: true, u: true, a: true, t: true })
    if (!cl?.use) { all(); setNoDb(true); return }
    const unsubs: (() => void)[] = []
    let alive = true
    ;(async () => {
      const [db, user, mcp] = await Promise.all([cl.use("db"), cl.use("user"), cl.use("mcp")])
      if (!alive) return
      setCaps({ db, user, mcp })
      if (user) {
        try { setCanWrite(!!(await user.canEdit())) } catch { setCanWrite(false) }
        try { setMe(await user.id()) } catch { setMe(null) }
      }
      if (!db) { all(); setNoDb(true); return }
      const err = () => toast("Se perdió la conexión con los datos. Recarga la página.")
      const docs = (s: Any) => s.docs.map((d: Any) => ({ id: d.id, ...d.data() }))
      unsubs.push(db.collection("projects").onSnapshot((s: Any) => { setProjects(docs(s)); setLoaded((l) => ({ ...l, p: true })) }, err))
      unsubs.push(db.collection("components").onSnapshot((s: Any) => { setComponents(docs(s)); setLoaded((l) => ({ ...l, c: true })) }, err))
      unsubs.push(db.collection("updates").orderBy("date", "desc").limit(300).onSnapshot((s: Any) => {
        const list = docs(s) as Update[]
        list.sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt || "").localeCompare(a.createdAt || ""))
        setUpdates(list); setLoaded((l) => ({ ...l, u: true }))
      }, err))
      unsubs.push(db.collection("asana").onSnapshot((s: Any) => { const m: Store["asana"] = {}; s.docs.forEach((d: Any) => (m[d.id] = d.data())); setAsana(m); setLoaded((l) => ({ ...l, a: true })) }, err))
      unsubs.push(db.doc("asanaMeta/sync").onSnapshot((d: Any) => setAsanaMeta(d.exists ? d.data() : { syncedAt: undefined }), err))
      unsubs.push(db.collection("tickets").orderBy("createdAt", "desc").limit(500).onSnapshot((s: Any) => { setTickets(docs(s)); setLoaded((l) => ({ ...l, t: true })) }, err))
      unsubs.push(db.collection("triage").onSnapshot((s: Any) => { const m: Record<string, Triage> = {}; s.docs.forEach((d: Any) => (m[d.id] = d.data())); setTriage(m) }, err))
    })()
    return () => { alive = false; unsubs.forEach((u) => u?.()) }
  }, [toast])

  // Resolve requester names (ids only are stored).
  useEffect(() => {
    const ids = [...new Set(tickets.map((t) => t.createdBy).filter(Boolean))] as string[]
    if (!caps.user || !ids.length) return
    caps.user.profiles(ids).then((ps: Any) => {
      setNames((old) => { const n = { ...old }; ids.forEach((id) => (n[id] = ps[id]?.name || "")); return n })
    }).catch(() => {})
  }, [tickets, caps.user])

  const syncAsana = useCallback(async () => {
    const { db, mcp } = caps
    if (!canWrite || !mcp || !db || syncing) return
    setSyncing(true); setSyncErr("")
    const fetchTask = async (gid: string) => {
      const call = () => mcp.callTool("Asana", "asana_get_task", { task_id: gid, opt_fields: OPT }, { cache: false })
      let res: Any
      try { res = await call() } catch (e: Any) {
        if (e?.retryable) { await new Promise((r) => setTimeout(r, (e.retryAfterMs || 1500) + Math.random() * 800)); res = await call() } else throw e
      }
      let pl = res.payload
      if (typeof pl === "string") { try { pl = JSON.parse(pl) } catch { /* keep text */ } }
      const t = pl?.data ?? pl
      if (!t || !Array.isArray(t.subtasks)) throw { code: "tool_error", message: "respuesta sin subtareas" }
      return t
    }
    try {
      const linked = projects.filter((p) => p.asana?.gid)
      const byGid: Record<string, Any> = {}
      for (const g of [...new Set(linked.map((p) => p.asana!.gid))]) byGid[g] = await fetchTask(g)
      const now = new Date().toISOString()
      for (const p of linked) {
        const a = p.asana!, inc = a.include ? new RegExp(a.include, "i") : null, exc = a.exclude ? new RegExp(a.exclude, "i") : null
        const tasks = byGid[a.gid].subtasks
          .filter((x: Any) => (!inc || inc.test(x.name)) && (!exc || !exc.test(x.name)))
          .map((x: Any) => ({ gid: String(x.gid), name: String(x.name || ""), done: !!x.completed, due: x.due_on || null, completedAt: x.completed_at || null }))
        await db.doc("asana/" + p.id).set({ syncedAt: now, parentGid: a.gid, tasks })
      }
      await db.doc("asanaMeta/sync").set({ syncedAt: now })
      toast("Asana sincronizado")
    } catch (e: Any) {
      setSyncErr((SYNC_MSG[e?.code] || "No se pudo sincronizar con Asana. ") + (e?.code === "tool_error" && e?.message ? e.message : ""))
    }
    setSyncing(false)
  }, [caps, canWrite, projects, syncing, toast])

  // Auto-sync for editors when the last sync is older than 30 minutes.
  useEffect(() => {
    if (autoSynced.current || !canWrite || !caps.mcp || !loaded.p || asanaMeta === null) return
    const age = asanaMeta.syncedAt ? Date.now() - new Date(asanaMeta.syncedAt).getTime() : Infinity
    if (age > 30 * 60000) { autoSynced.current = true; syncAsana() }
  }, [canWrite, caps.mcp, loaded.p, asanaMeta, syncAsana])

  const value = useMemo<Store>(() => ({
    ...caps, canWrite, me, names, projects, components, updates, asana, asanaMeta, tickets, triage, loaded, noDb, syncing, syncErr, toast, write, syncAsana,
  }), [caps, canWrite, me, names, projects, components, updates, asana, asanaMeta, tickets, triage, loaded, noDb, syncing, syncErr, toast, write, syncAsana])

  return (
    <Ctx.Provider value={value}>
      {children}
      {toastMsg && <div role="status" className="fixed bottom-[calc(24px+env(safe-area-inset-bottom,0px))] left-1/2 z-[60] -translate-x-1/2 rounded-full bg-text px-[18px] py-2.5 text-[13.5px] text-bg">{toastMsg}</div>}
    </Ctx.Provider>
  )
}

export const useProject = (id?: string | null) => { const { projects } = useStore(); return projects.find((p) => p.id === id) }
