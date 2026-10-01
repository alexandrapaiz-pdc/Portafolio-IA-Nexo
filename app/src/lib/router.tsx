/* Hash routing with bare tokens (#portafolio, #tareas, #agentes, #solicitudes) — the only
   hash form an artifact link carries. A project id in the hash opens its detail sheet. */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"

export const VIEWS = ["inicio", "portafolio", "tareas", "agentes", "solicitudes"] as const
export type View = (typeof VIEWS)[number]

interface Router {
  view: View
  go: (v: View, opts?: { keepScroll?: boolean; section?: string }) => void
  project: string | null
  openProject: (id: string) => void
  closeProject: () => void
}
const Ctx = createContext<Router | null>(null)
export const useRouter = () => { const r = useContext(Ctx); if (!r) throw new Error("RouterProvider missing"); return r }

const initial = (): { view: View; project: string | null } => {
  const h = location.hash.slice(1)
  if ((VIEWS as readonly string[]).includes(h)) return { view: h as View, project: null }
  return { view: "inicio", project: h && !h.includes("-sec") ? h : null }
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initial)
  const hashFor = (v: View) => (v === "inicio" ? location.pathname + location.search : "#" + v)

  const go = useCallback<Router["go"]>((v, opts) => {
    setState({ view: v, project: null })
    try { history.replaceState(null, "", hashFor(v)) } catch { /* sandboxed */ }
    requestAnimationFrame(() => {
      if (opts?.section) document.getElementById(opts.section)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })
      else if (!opts?.keepScroll) window.scrollTo(0, 0)
    })
  }, [])
  const openProject = useCallback((id: string) => {
    setState((s) => ({ ...s, project: id }))
    try { history.replaceState(null, "", "#" + id) } catch { /* sandboxed */ }
  }, [])
  const closeProject = useCallback(() => {
    setState((s) => { try { history.replaceState(null, "", hashFor(s.view)) } catch { /* sandboxed */ } return { ...s, project: null } })
  }, [])

  useEffect(() => { document.documentElement.dataset.view = state.view }, [state.view])
  return <Ctx.Provider value={{ ...state, go, openProject, closeProject }}>{children}</Ctx.Provider>
}
