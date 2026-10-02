import { useEffect } from "react"
import { RouterProvider, useRouter } from "@/lib/router"
import { StoreProvider } from "@/lib/store"
import { Nav } from "@/components/nav"
import { Intro } from "@/components/intro"
import { ProjectSheet } from "@/components/project-sheet"
import { Home } from "@/views/home"
import { Portfolio } from "@/views/portfolio"
import { Agents } from "@/views/agents"
import { Tickets } from "@/views/tickets"

function Shell() {
  const { view } = useRouter()
  useEffect(() => {
    const root = document.documentElement
    const move = (e: PointerEvent) => { root.style.setProperty("--mx", e.clientX.toFixed(0)); root.style.setProperty("--my", e.clientY.toFixed(0)) }
    document.addEventListener("pointermove", move)
    return () => document.removeEventListener("pointermove", move)
  }, [])
  return (
    <>
      <div className="page-glow" aria-hidden><i /><i /><i /></div>
      <Nav />
      {view === "inicio" && <Home />}
      {view === "portafolio" && <Portfolio />}
      {view === "agentes" && <Agents />}
      {view === "solicitudes" && <Tickets />}
      <ProjectSheet />
      <Intro />
    </>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <RouterProvider>
        <Shell />
      </RouterProvider>
    </StoreProvider>
  )
}
