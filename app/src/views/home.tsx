import { useRouter } from "@/lib/router"
import { GlowCard } from "@/components/ui/spotlight-card"
import { ArrowRight } from "lucide-react"
import { Footer, RequestCta, Section, SectionHead, SecP } from "@/components/shared"
import { RobotBand } from "@/components/robot-band"

const ISTACK = [
  ["Propósito", "El MTP y las prioridades del portafolio"],
  ["Percibir", "Company Brain: Databricks y SharePoint"],
  ["Interpretar", "Agentes LangGraph con contexto y glosario"],
  ["Decidir", "Propuestas del agente con aprobación humana"],
  ["Orquestar y actuar", "Flujos en Temporal y servidores MCP"],
  ["Aprender", "Memoria en pgvector y trazas en Langfuse"],
]
const EXO = [
  ["MTP", "Propósito Transformador Masivo", "La razón de existir de la organización: el norte que alinea cada decisión. El nuestro: «Que cada proceso sistemático corra con IA»."],
  ["DRIVE", "El motor de inteligencia", "Cómo la organización decide, aprende y escala inteligencia, desde la arquitectura de decisiones hasta la agencia elástica. En Nexo: el stack de IA y los agentes."],
  ["SHAPE", "La forma organizacional", "Autonomía segura, arquitectura humana, arquitectura adaptativa, control por propósito y confianza en el ecosistema."],
]

export function Home() {
  const { go } = useRouter()
  return (
    <main className="wrap">
      <section className="screen grid gap-[18px]">
        <div className="eyebrow">Portafolio de IA · Q4 2026</div>
        <h1 className="h-display">Nexo IA.<span className="sub">Inteligencia artificial para Servicios Compartidos.</span></h1>
        <div className="mt-2 grid max-w-[44em] gap-2 border-t border-line pb-1 pt-[22px]">
          <span className="text-xs font-medium tracking-[.02em] text-faint">Nuestro MTP · Propósito Transformador Masivo</span>
          <p className="text-[clamp(22px,2.6vw,28px)] font-medium leading-[1.2] tracking-[-.03em] text-balance">Que cada proceso sistemático corra con IA.</p>
        </div>
        <p className="lead">El stack de IA de Nexo, las buenas prácticas, el Company Brain y los proyectos de agentes. Medimos el avance en horas de trabajo manual liberadas y en los KPIs de cada dolor de negocio.</p>
        <p className="text-[13px] text-faint">Alexandra Paiz, Líder de IA y Herramientas</p>
        <div className="mt-6 -ml-5 max-sm:ml-0"><button type="button" onClick={() => go("portafolio")} className="group inline-flex h-[52px] items-center gap-2 rounded-full border border-line-2 bg-white px-5 text-base font-medium leading-none text-text transition-colors hover:border-text">Ver el portafolio<ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" /></button></div>
      </section>

      <Section id="mision" className="screen pt-[clamp(20px,4vh,48px)]">
        <SectionHead eyebrow="Misión" title="De libro abierto a código abierto." />
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
            <p className="text-[15px] leading-relaxed text-sub">Primero Nexo construye y prueba el marco; después se escalará.</p>
          </div>
        </div>
      </Section>

      <RobotBand />

      <Section id="marco" className="screen gap-5 pt-[clamp(20px,4vh,48px)]">
        <SectionHead eyebrow="Marco de trabajo" title="Organización Exponencial 3.0.">
          <SecP>Estamos formados en el modelo ExO 3.0 de Salim Ismail (OpenExO). Es el mapa que usamos para Servicios Compartidos.</SecP>
          <a href="https://openexo.com/exo-model-3" target="_blank" rel="noopener" className="text-sm font-medium text-accent-ink no-underline hover:underline">Modelo ExO 3.0 en OpenExO ›</a>
        </SectionHead>
        <div className="grid grid-cols-3 gap-3.5 max-[820px]:grid-cols-1">
          {EXO.map(([tag, h, p]) => (
            <GlowCard key={tag} glowColor="pdc" backdrop="rgba(248,250,252,.72)" borderColor="rgba(15,23,42,.07)" customSize className="content-start gap-2.5 p-6 grid-rows-none shadow-[0_1px_2px_rgba(15,23,42,.04),0_10px_30px_-12px_rgba(15,23,42,.18)]">
              <span className="text-xs font-medium text-faint">{tag}</span><h3 className="text-xl leading-[1.15] tracking-[-.03em]">{h}</h3><p className="text-sm text-sub">{p}</p>
            </GlowCard>
          ))}
        </div>
        <div>
          <div className="flex flex-wrap items-baseline gap-2.5 px-1 pb-2 text-[13px] text-sub"><b className="font-semibold text-text">Intelligence Stack</b></div>
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
      <Footer right="Marco: Organizaciones Exponenciales 3.0 (OpenExO)" />
    </main>
  )
}
