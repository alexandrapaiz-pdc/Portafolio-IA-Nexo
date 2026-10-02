import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { ShaderBackground } from "@/components/ui/leonardo-primo-background-animato-1"
import { LiquidButton } from "@/components/ui/liquid-glass-button"

/** Temporary welcome: full-screen aurora shader, once per session, skipped on deep links. */
export function Intro() {
  const [show, setShow] = useState(() => {
    try { if (sessionStorage.getItem("nexo.intro") === "1") return false } catch { /* storage blocked */ }
    return location.hash.length <= 1
  })
  const [leaving, setLeaving] = useState(false)
  const close = () => {
    if (leaving) return
    setLeaving(true)
    try { sessionStorage.setItem("nexo.intro", "1") } catch { /* storage blocked */ }
    setTimeout(() => setShow(false), 900)
  }
  useEffect(() => {
    if (!show) return
    const t = setTimeout(close, 10000)
    const k = (e: KeyboardEvent) => { if (e.key === "Escape" || e.key === "Enter") close() }
    window.addEventListener("keydown", k)
    return () => { clearTimeout(t); window.removeEventListener("keydown", k) }
  })
  if (!show) return null
  return (
    <div role="dialog" aria-label="Bienvenida" onClick={close}
      className={cn("fixed inset-0 z-[100] grid place-items-center bg-[#00113A] transition-[opacity,visibility] duration-[900ms]", leaving && "invisible opacity-0")}>
      <ShaderBackground className="absolute inset-0" paused={leaving} />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_50%,rgba(0,10,40,.58),rgba(0,10,40,0)_72%)]" />
      <div className="relative grid justify-items-center gap-[18px] px-6 text-center text-white motion-safe:animate-[introIn_1.4s_cubic-bezier(.2,.8,.2,1)_both]">
        <span className="text-[13px] font-semibold uppercase tracking-[.14em] opacity-80">Nexo IA · Grupo PDC</span>
        <h1 className="text-[clamp(40px,7vw,88px)] leading-none tracking-[-.045em] text-white [text-shadow:0_2px_40px_rgba(0,10,40,.35)]">Bienvenido al futuro de Nexo.</h1>
        <p className="text-[clamp(16px,2vw,20px)] tracking-[-.015em] opacity-85">Inteligencia artificial para Servicios Compartidos.</p>
        <LiquidButton size="xl" className="mt-2 rounded-full px-9 text-[15px] font-semibold text-white" onClick={(e) => { e.stopPropagation(); close() }}>Entrar</LiquidButton>
      </div>
      <div aria-hidden className="absolute bottom-[calc(36px+env(safe-area-inset-bottom,0px))] left-1/2 h-0.5 w-[120px] -translate-x-1/2 overflow-hidden rounded-sm bg-white/20">
        <i className="block h-full w-full origin-left bg-white motion-safe:animate-[introBar_10s_linear_forwards]" />
      </div>
    </div>
  )
}
