import { Component, useEffect, useRef, useState, type ReactNode } from "react"
import { RobotScene } from "@/components/ui/robot-hero"

// A WebGL failure must not take the page down with it: show nothing instead.
class SafeWebGL extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

/** Contained pause between long sections: the robot follows the pointer; a click gives it heart eyes.
 *  The 3D scene mounts only once the band is near the viewport. */
export function RobotBand({ word = "NEXO IA", caption }: { word?: string; caption?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect() } }, { rootMargin: "300px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} aria-hidden className="relative mt-20 snap-center h-[clamp(240px,26vw,300px)] overflow-hidden rounded-[28px]"
      style={{ background: "radial-gradient(ellipse 55% 75% at 50% 45%, #ffffff 0%, #f1f4fb 60%, #e8edf7 100%)" }}>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <span className="translate-y-6 select-none whitespace-nowrap text-[clamp(48px,9vw,120px)] font-semibold leading-none tracking-[-.05em] text-navy opacity-[.06]">{word}</span>
      </div>
      <div className="absolute inset-0">{near && <SafeWebGL><RobotScene scale={1.5} pantallaColor="#4d7cff" pantallaBrillo={1.3} /></SafeWebGL>}</div>
      {caption && <p className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-[13px] text-faint">{caption}</p>}
    </div>
  )
}
