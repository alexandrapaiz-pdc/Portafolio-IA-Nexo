"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

// From 21st.dev "ai-agent-pipeline", adapted to Nexo: light card in the page's glass style, PDC navy / blue /
// orange instead of black and #0052FF, a fluid width, Spanish copy, and the Nexo stack (Company Brain, LangGraph,
// Claude, human approval). It is an illustration of how a run flows, so it carries no live metrics.

const messages = [
  "Evento recibido: «Preparar kickoff de campaña C08 · Guatemala»",
  "Presidio: datos personales enmascarados antes de salir",
  "Company Brain: búsqueda híbrida, 6 fragmentos relevantes con fuente",
  "Contexto armado con citas y permisos de quien pidió",
  "LangGraph: el agente planea 3 pasos y llama herramientas",
  "Borrador de KPIs y top / bottom 10 listo para revisión",
  "Esperando aprobación humana antes de registrar",
  "Aprobado: resultado registrado y trazado en Langfuse",
  "En espera del siguiente evento del bus…",
]

const BLUE = "#2f5bff", NAVY = "#00216f", ORANGE = "#ff5100"

function AnimatedDot({ path, duration, delay, size, opacity, color = BLUE }: { path: string; duration: number; delay: number; size: number; opacity: number; color?: string }) {
  return (
    <circle r={size} fill={color} opacity={opacity}>
      <animateMotion dur={`${duration}s`} repeatCount="indefinite" begin={`${delay}s`} path={path} />
    </circle>
  )
}

function PulsingDot({ cx, cy, color, duration, delay = 0, r = 2.8 }: { cx: number; cy: number; color: string; duration: number; delay?: number; r?: number }) {
  return <motion.circle cx={cx} cy={cy} r={r} fill={color} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }} />
}

const label = { fontSize: 9, fill: "var(--faint)", letterSpacing: ".08em", fontFamily: "var(--font)" }
const title = { fontSize: 11, fill: "var(--navy)", fontFamily: "var(--font)", fontWeight: 500 }
const mono = { fontSize: 8.5, fill: "var(--faint)", fontFamily: "ui-monospace, Menlo, monospace" }

export default function EnterpriseAIPipeline() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % messages.length), 2700)
    return () => clearInterval(t)
  }, [])

  const paths = {
    p1: "M116,88 L158,88",
    p2: "M268,88 L306,88",
    p3: "M411,88 C425,88 435,50 448,50",
    p4: "M411,88 L448,88",
    p5: "M411,88 C425,88 435,126 448,126",
  }
  const box = { fill: "var(--raise)", stroke: "var(--line-2)", strokeWidth: 0.8 }

  return (
    <div className="card w-full overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-[18px] py-[11px]">
        <div className="flex items-center gap-[7px]">
          <motion.span className="inline-block size-[6px] rounded-full bg-accent" animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
          <span className="font-mono text-[10px] tracking-[0.1em] text-faint">CÓMO CORRE UN AGENTE · ILUSTRATIVO</span>
        </div>
        <span className="font-mono text-[10px] text-faint">aprobación humana en cada acción</span>
      </div>

      <svg width="100%" viewBox="0 0 580 160" className="mx-auto block max-w-[760px] px-4" role="img" aria-label="Flujo de un agente: un evento dispara la consulta al Company Brain, el agente en LangGraph con Claude prepara un borrador, una persona aprueba y el resultado se registra.">
        <defs>
          <marker id="aiPipeArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M2 1.5L7.5 5L2 8.5" fill="none" stroke={BLUE} strokeOpacity=".5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>
        <path d={paths.p1} fill="none" stroke={BLUE} strokeOpacity=".28" strokeWidth="1.5" strokeDasharray="3 5" markerEnd="url(#aiPipeArrow)" />
        <path d={paths.p2} fill="none" stroke={BLUE} strokeOpacity=".28" strokeWidth="1.5" strokeDasharray="3 5" markerEnd="url(#aiPipeArrow)" />
        {[paths.p3, paths.p4, paths.p5].map((d) => <path key={d} d={d} fill="none" stroke={ORANGE} strokeOpacity=".25" strokeWidth="1.5" strokeDasharray="3 5" />)}

        <AnimatedDot path={paths.p1} duration={1.05} delay={0} size={2.5} opacity={1} />
        <AnimatedDot path={paths.p1} duration={1.05} delay={0.35} size={1.8} opacity={0.6} />
        <AnimatedDot path={paths.p1} duration={1.05} delay={0.7} size={1.3} opacity={0.35} />
        <AnimatedDot path={paths.p2} duration={0.88} delay={0.18} size={2.5} opacity={1} />
        <AnimatedDot path={paths.p2} duration={0.88} delay={0.62} size={1.8} opacity={0.6} />
        <AnimatedDot path={paths.p3} duration={1.3} delay={0.08} size={2.2} opacity={0.9} color={ORANGE} />
        <AnimatedDot path={paths.p4} duration={1.15} delay={0.28} size={2.2} opacity={0.9} color={ORANGE} />
        <AnimatedDot path={paths.p5} duration={1.4} delay={0.45} size={2.2} opacity={0.9} color={ORANGE} />

        <rect x="16" y="66" width="100" height="44" rx="9" {...box} />
        <text x="66" y="83" textAnchor="middle" style={label}>DISPARADOR</text>
        <text x="66" y="100" textAnchor="middle" style={title}>Evento del bus</text>
        <text x="66" y="124" textAnchor="middle" style={mono}>o solicitud</text>

        <rect x="158" y="66" width="110" height="44" rx="9" {...box} />
        <text x="213" y="83" textAnchor="middle" style={label}>COMPANY BRAIN</text>
        <text x="213" y="100" textAnchor="middle" style={title}>Contexto</text>
        <text x="213" y="124" textAnchor="middle" style={mono}>pgvector · Databricks</text>

        <rect x="306" y="53" width="105" height="70" rx="11" fill={NAVY} />
        <rect x="318" y="53.5" width="80" height="1" rx="0.5" fill={ORANGE} fillOpacity=".8" />
        <text x="358" y="78" textAnchor="middle" style={{ ...label, fill: "rgba(255,255,255,.6)" }}>AGENTE</text>
        <text x="358" y="97" textAnchor="middle" style={{ ...title, fill: "#fff", fontSize: 13 }}>Razonando</text>
        <PulsingDot cx={346} cy={113} color={ORANGE} duration={1.2} delay={0} />
        <PulsingDot cx={358} cy={113} color={ORANGE} duration={1.2} delay={0.4} />
        <PulsingDot cx={370} cy={113} color={ORANGE} duration={1.2} delay={0.8} />
        <text x="358" y="139" textAnchor="middle" style={mono}>LangGraph · Claude</text>

        {([["Borrador listo", 35, false], ["Aprobación", 73, true], ["Registro y traza", 111, true]] as [string, number, boolean][]).map(([t, y, pulse], k) => (
          <g key={t}>
            <rect x="448" y={y} width="120" height="30" rx="8" {...box} />
            <text x="458" y={y + 18.5} style={{ ...title, fontSize: 10.5, fontWeight: 500 }}>{t}</text>
            {pulse ? <PulsingDot cx={556} cy={y + 15} color={ORANGE} duration={1.9 + k * 0.3} delay={k * 0.35} r={3} /> : <circle cx={556} cy={y + 15} r={3} fill={NAVY} />}
          </g>
        ))}
      </svg>

      <div className="h-[48px] border-t border-line px-[18px] py-[12px]">
        <div className="flex h-full items-start gap-2">
          <span className="shrink-0 font-mono text-[13px] leading-[1.4] text-accent">›</span>
          <div className="relative h-full flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.25 }}
                className="absolute inset-0 font-mono text-[11.5px] leading-[1.55] text-sub">{messages[i]}</motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
