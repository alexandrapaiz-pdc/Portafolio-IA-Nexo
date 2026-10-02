import { Footer } from "@/components/shared"
import { AgentSphere } from "@/components/agent-sphere"

// The portal is hidden while it is built; only the animation is shown.
// The tracking demo (sample agents, KPIs, value stream maps) is in git history.
export function Agents() {
  return (
    <main className="wrap">
      <section className="grid justify-items-center gap-[18px] pb-10 pt-[88px] text-center">
        <div className="eyebrow">En construcción</div>
        <h1 className="h-display">Portal de agentes.</h1>
        <AgentSphere />
      </section>
      <Footer right="Portal de agentes · en construcción" />
    </main>
  )
}
