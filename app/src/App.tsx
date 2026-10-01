import { RouterProvider, useRouter } from "@/lib/router"
import { StoreProvider } from "@/lib/store"
import { Nav } from "@/components/nav"
import { Intro } from "@/components/intro"
import { ProjectSheet } from "@/components/project-sheet"
import { Home } from "@/views/home"
import { Portfolio } from "@/views/portfolio"
import { Tasks } from "@/views/tasks"
import { Agents } from "@/views/agents"
import { Tickets } from "@/views/tickets"

function Shell() {
  const { view } = useRouter()
  return (
    <>
      <Nav />
      {view === "inicio" && <Home />}
      {view === "portafolio" && <Portfolio />}
      {view === "tareas" && <Tasks />}
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
