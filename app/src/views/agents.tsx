import { Footer } from "@/components/shared"
import AgenticFactory3D from "@/components/ui/agentic-factory-3d"

// The portal is hidden while it is built; only the animation is shown.
// The tracking demo (sample agents, KPIs, value stream maps) is in git history.
export function Agents() {
  return (
    <main>
      <section className="relative">
        <AgenticFactory3D embed className="nexo-light" height="max(560px, calc(100svh - 48px))" />
        <div className="pointer-events-none absolute inset-0">
          <div className="wrap grid h-full content-start gap-[18px] pt-[88px] max-[900px]:pt-12 min-[901px]:content-center min-[901px]:pt-0">
            <div className="eyebrow">En construcción</div>
            <h1 className="h-display max-w-[7em]">Portal de agentes.</h1>
          </div>
        </div>
      </section>
      <div className="wrap"><Footer right="Portal de agentes · en construcción" /></div>
    </main>
  )
}
