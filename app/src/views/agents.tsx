import { Footer } from "@/components/shared"
import AgenticFactory3D from "@/components/ui/agentic-factory-3d"

// The portal is hidden while it is built; only the animation is shown.
// The tracking demo (sample agents, KPIs, value stream maps) is in git history.
// The factory sits in its own box (under 900 px wide, so it centers and fits whole) to stay small and sharp.
export function Agents() {
  return (
    <main className="wrap">
      <section className="grid grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] items-center gap-6 pb-10 pt-16 max-[820px]:grid-cols-1 max-[820px]:pt-12">
        <div className="grid gap-[18px]">
          <div className="eyebrow">En construcción</div>
          <h1 className="h-display max-w-[7em]">Portal de agentes.</h1>
        </div>
        <AgenticFactory3D embed className="nexo-light" height="clamp(320px, 42vw, 460px)" />
      </section>
      <Footer right="Portal de agentes · en construcción" />
    </main>
  )
}
