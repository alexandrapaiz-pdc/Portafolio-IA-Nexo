/* Data store. Portfolio data (projects, components, updates) is a snapshot built into the page
   (data/portfolio.json), so every viewer sees the same site with no sign-in or connection;
   it is updated by editing the snapshot and republishing. Only requests (tickets, triage) use the
   claude.ai artifact database, or the app's own API when built with --mode nexo (nexo-runtime.ts). */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { Component, Project, Ticket, Triage, Update } from "./domain"
import { nexoRuntime } from "./nexo-runtime"
import snapshot from "@/data/portfolio.json"

const SNAP = snapshot as unknown as { projects: Project[]; components: Component[]; updates: Update[]; snapshotAt: string }
const UPDATES = [...SNAP.updates].sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt || "").localeCompare(a.createdAt || ""))

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any
declare global { interface Window { claude?: { use: (name: string) => Promise<Any> } } }

export interface Store {
  db: Any; user: Any
  canWrite: boolean; canEdit: boolean; me: string | null; names: Record<string, string>
  projects: Project[]; components: Component[]; updates: Update[]
  tickets: Ticket[]; triage: Record<string, Triage>
  loaded: { p: boolean; c: boolean; u: boolean; t: boolean }
  noDb: boolean
  toast: (m: string) => void
  write: (fn: () => Promise<unknown>, ok?: string) => Promise<boolean>
}

const Ctx = createContext<Store | null>(null)
export const useStore = () => { const s = useContext(Ctx); if (!s) throw new Error("StoreProvider missing"); return s }


export function StoreProvider({ children }: { children: ReactNode }) {
  const [caps, setCaps] = useState<{ db: Any; user: Any }>({ db: null, user: null })
  const [canWrite, setCanWrite] = useState(false)
  const [me, setMe] = useState<string | null>(null)
  const [names, setNames] = useState<Record<string, string>>({})
  const projects = SNAP.projects, components = SNAP.components, updates = UPDATES
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [triage, setTriage] = useState<Record<string, Triage>>({})
  const [loaded, setLoaded] = useState({ p: true, c: true, u: true, t: false })
  const [noDb, setNoDb] = useState(false)
  const [toastMsg, setToastMsg] = useState("")
  const toastTimer = useRef<number>(0)

  const toast = useCallback((m: string) => {
    setToastMsg(m); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToastMsg(""), 2600)
  }, [])

  const write = useCallback(async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); if (ok) toast(ok); return true }
    catch (e: Any) { toast(e?.code === "invalid_argument" ? "No tienes permiso para editar esta página." : "No se pudo guardar. Intenta de nuevo."); return false }
  }, [toast])

  // Boot: resolve capabilities, then subscribe once to each collection.
  useEffect(() => {
    const cl = import.meta.env.MODE === "nexo" ? nexoRuntime : window.claude
    const all = () => setLoaded((l) => ({ ...l, t: true }))
    if (!cl?.use) { all(); setNoDb(true); return }
    const unsubs: (() => void)[] = []
    let alive = true
    ;(async () => {
      const [db, user] = await Promise.all([cl.use("db"), cl.use("user")])
      if (!alive) return
      setCaps({ db, user })
      if (user) {
        try { setCanWrite(!!(await user.canEdit())) } catch { setCanWrite(false) }
        try { setMe(await user.id()) } catch { setMe(null) }
      }
      if (!db) { all(); setNoDb(true); return }
      const err = () => toast("Se perdió la conexión con los datos. Recarga la página.")
      const docs = (s: Any) => s.docs.map((d: Any) => ({ id: d.id, ...d.data() }))
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

  const value = useMemo<Store>(() => ({
    ...caps, canWrite, canEdit: false, me, names, projects, components, updates, tickets, triage, loaded, noDb, toast, write,
  }), [caps, canWrite, me, names, projects, components, updates, tickets, triage, loaded, noDb, toast, write])

  return (
    <Ctx.Provider value={value}>
      {children}
      {toastMsg && <div role="status" className="fixed bottom-[calc(24px+env(safe-area-inset-bottom,0px))] left-1/2 z-[60] -translate-x-1/2 rounded-full bg-text px-[18px] py-2.5 text-[13.5px] text-bg">{toastMsg}</div>}
    </Ctx.Provider>
  )
}

export const useProject = (id?: string | null) => { const { projects } = useStore(); return projects.find((p) => p.id === id) }
