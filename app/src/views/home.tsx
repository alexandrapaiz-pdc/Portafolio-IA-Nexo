import { useRouter } from "@/lib/router"
import openexoLogo from "@/assets/openexo.png"
import { GlowCard } from "@/components/ui/spotlight-card"
import { ArrowRight } from "lucide-react"
import { RequestCta, Section, SectionHead, SecP } from "@/components/shared"
import { RobotBand } from "@/components/robot-band"

const ISTACK = [
  ["Propósito", "La cascada de metas de la empresa"],
  ["Percibir", "Un Company Brain legible por máquinas"],
  ["Interpretar", "Sistemas sofisticados de memoria para agentes"],
  ["Decidir", "Propuestas del agente con aprobación humana"],
  ["Orquestar y actuar", "Orquestación completa: flujos, aprobaciones y ruteo de modelos"],
  ["Aprender", "Crecimiento exponencial recursivo: cada ciclo mejora el siguiente"],
]
// ExO 3.0 = MTP + DRIVE + SHAPE: 10 characteristics, each scored 1 to 5 (openexo.com/exo-model-3; exo-framework notes).
const EXO: { tag: string; h: string; p: string; li: [string, string, string][] }[] = [
  { tag: "MTP", h: "Propósito Transformador Masivo", p: "El centro del modelo, traducido a un protocolo que los agentes pueden leer: inspiración humana, restricciones duras y prioridades ponderadas. El nuestro: «Que cada proceso sistemático corra con IA».", li: [] },
  { tag: "DRIVE", h: "El motor de inteligencia", p: "Cinco características que hacen a la organización rápida e inteligente.", li: [
    ["D", "Arquitectura de decisiones", "lo reversible va a velocidad de máquina; lo irreversible, con aprobación humana"],
    ["R", "Aprendizaje recursivo", "aprender más rápido de lo que cambia el entorno"],
    ["I", "Intelligence Stack", "el núcleo operativo, en seis capas"],
    ["V", "Foso de valor", "datos propios, densidad de inteligencia y velocidad para reconfigurarse"],
    ["E", "Agencia elástica", "una sola reserva de capacidad, humana y de agentes; la autoridad se gana con desempeño"],
  ] },
  { tag: "SHAPE", h: "La forma organizacional", p: "Cinco características que la mantienen firme y resiliente.", li: [
    ["S", "Autonomía segura", "cada decisión de un agente responde a una persona con nombre"],
    ["H", "Arquitectura humana", "el trabajo de las personas se rediseña junto con el de los agentes"],
    ["A", "Arquitectura adaptativa", "modular: cada capa se puede reemplazar"],
    ["P", "Control por propósito", "restricciones, decisiones e identidad alineadas al MTP"],
    ["E", "Confianza en el ecosistema", "identidad, credenciales y auditoría hacia afuera"],
  ] },
]

// Misión ("De libro abierto a código abierto"): hidden for now.
const SHOW_MISSION = false

export function Home() {
  const { go } = useRouter()
  return (
    <main className="wrap">
      <section className="grid gap-[18px] pb-6 pt-[88px]">
        <h1 className="h-display">Nexo IA.<span className="sub">Inteligencia artificial para Servicios Compartidos.</span></h1>
        <div className="mt-2 grid max-w-[44em] gap-2 border-t border-line pb-1 pt-[22px]">
          <span className="text-xs font-medium tracking-[.02em] text-faint">Nuestro MTP · Propósito Transformador Masivo</span>
          <p className="text-[clamp(22px,2.6vw,28px)] font-medium leading-[1.2] tracking-[-.03em] text-balance">Que cada proceso sistemático corra con IA.</p>
        </div>
        <p className="lead">Ingeniería de IA desplegada en el negocio: trabajo junto a cada dueño de proceso, construyo dentro de su flujo real y llevo cada agente a producción en la plataforma de agentes de Vikingo AI. Medimos el avance en horas de trabajo manual liberadas y en los KPIs de cada dolor de negocio.</p>
        <p className="text-[13px] text-faint">Alexandra Paiz, Forward Deployed Engineer de IA</p>
        <div className="mt-6"><button type="button" onClick={() => go("portafolio")} className="group inline-flex h-[52px] items-center gap-2 rounded-full border border-line-2 bg-white px-5 text-base font-medium leading-none text-text transition-colors hover:border-text">Ver el portafolio<ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" /></button></div>
      </section>

      {SHOW_MISSION && (
      <Section id="mision">
        <SectionHead title="De libro abierto a código abierto." />
        <blockquote className="m-0 max-w-[34em] text-[clamp(20px,2.2vw,25px)] font-medium leading-[1.3] tracking-[-.025em] text-balance">
          Grupo PDC ya es una empresa de libro abierto: los números son de todos. <span className="text-faint">La misión de Nexo IA es que lo que construimos con IA también lo sea, abierto y editable por cualquier líder.</span>
        </blockquote>
        <div className="grid grid-cols-3 gap-8 max-[820px]:grid-cols-1 max-[820px]:gap-5">
          <div className="grid content-start gap-2 border-t border-line pt-4">
            <h3 className="text-[15px] font-semibold tracking-[-.01em]">InnerSource</h3>
            <p className="text-[15px] leading-relaxed text-sub">Prácticas de código abierto, pero dentro de la organización: el código, las guías y los agentes se ven, se reutilizan y cualquiera puede proponer mejoras, con guardrails.</p>
          </div>
          <div className="grid content-start gap-2 border-t border-line pt-4">
            <h3 className="text-[15px] font-semibold tracking-[-.01em]">Como los laboratorios de IA</h3>
            <p className="text-[15px] leading-relaxed text-sub">En empresas como Anthropic, mercadeo, legal o finanzas construyen sus propias herramientas con agentes de programación, en lenguaje natural.</p>
          </div>
          <div className="grid content-start gap-2 border-t border-line pt-4">
            <h3 className="text-[15px] font-semibold tracking-[-.01em]">El camino</h3>
            <p className="text-[15px] leading-relaxed text-sub">Primero construyo junto a cada equipo de Nexo y pruebo el marco en procesos reales; después se escalará.</p>
          </div>
        </div>
      </Section>
      )}

      <RobotBand />

      <Section id="marco" className="gap-5">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead title="Organización Exponencial 3.0.">
            <SecP>Estamos certificados en el modelo ExO 3.0 de Salim Ismail y trabajamos directamente con OpenExO. Es el mapa que usamos para Servicios Compartidos: un propósito y diez características, cada una evaluada del 1 al 5.</SecP>
            <a href="https://openexo.com/exo-model-3" target="_blank" rel="noopener" className="text-sm font-medium text-accent-ink no-underline hover:underline">Modelo ExO 3.0 en OpenExO ›</a>
          </SectionHead>
          <a href="https://openexo.com" target="_blank" rel="noopener" className="grid justify-items-start gap-2.5 card px-6 py-5 no-underline transition-shadow hover:shadow-[var(--shadow-hover)]">
            <img src={openexoLogo} alt="OpenExO" className="block h-7 w-auto" />
            <span className="text-[13px] text-sub">Equipo certificado · ExO 3.0</span>
          </a>
        </div>
        <div className="grid grid-cols-3 gap-3.5 max-[820px]:grid-cols-1">
          {EXO.map(({ tag, h, p, li }) => (
            <GlowCard key={tag} glowColor="pdc" backdrop="rgba(248,250,252,.72)" borderColor="rgba(15,23,42,.07)" customSize className="content-start gap-2.5 p-6 grid-rows-none shadow-[0_1px_2px_rgba(15,23,42,.04),0_10px_30px_-12px_rgba(15,23,42,.18)]">
              <span className="text-xs font-semibold tracking-[.08em] text-accent">{tag}</span><h3 className="text-xl leading-[1.15] tracking-[-.03em]">{h}</h3><p className="text-sm text-sub">{p}</p>
              {li.length > 0 && <ul className="m-0 mt-1.5 grid list-none gap-2.5 border-t border-line p-0 pt-3.5">{li.map(([k, n, d]) => (
                <li key={k + n} className="grid grid-cols-[18px_minmax(0,1fr)] gap-2 text-[13px] leading-snug"><b className="font-semibold text-accent">{k}</b><span><span className="font-semibold text-text">{n}</span><span className="text-sub">: {d}</span></span></li>
              ))}</ul>}
            </GlowCard>
          ))}
        </div>
        <div>
          <div className="flex flex-wrap items-baseline gap-2.5 pb-2 text-[13px] text-sub"><b className="font-semibold text-text">Intelligence Stack</b><span>Seis capas cognitivas, con un plano de control GOVERN/ASSURE que las supervisa</span></div>
          <div className="grid grid-cols-6 border-t border-line max-[820px]:grid-cols-2">
            {ISTACK.map(([n, d], i) => (
              <div key={n} className="grid min-w-0 content-start gap-1 py-3 pr-3.5 [&+&]:border-l [&+&]:border-line [&+&]:pl-3.5 max-[820px]:[&:nth-child(odd)]:border-l-0 max-[820px]:[&:nth-child(odd)]:pl-0 max-[820px]:[&:nth-child(n+3)]:border-t">
                <b className="text-xs font-semibold text-accent">{i + 1}</b><span className="text-[15px] font-semibold tracking-[-.02em]">{n}</span><p className="text-[13px] text-sub">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>
      <RequestCta />
    </main>
  )
}
