import { useRouter } from "@/lib/router"
import { GlowCard } from "@/components/ui/spotlight-card"
import { ArrowRight } from "lucide-react"
import { Footer, Section, SectionHead, SecP } from "@/components/shared"
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
  ["SHAPE", "La forma organizacional", "Autonomía segura, arquitectura humana, arquitectura adaptativa, control por propósito y confianza en el ecosistema. En Nexo: AI Best Practices y el autoservicio con guardrails."],
]

export function Home() {
  const { go } = useRouter()
  return (
    <main className="wrap">
      <section className="grid gap-[18px] pb-14 pt-[88px]">
        <div className="eyebrow">Portafolio de IA · Q4 2026</div>
        <h1 className="h-display">Nexo IA.<span className="sub">Inteligencia artificial para Servicios Compartidos.</span></h1>
        <div className="mt-2 grid max-w-[44em] gap-2 border-t border-line pb-1 pt-[22px]">
          <span className="text-xs font-medium tracking-[.02em] text-faint">Nuestro MTP · Propósito Transformador Masivo</span>
          <p className="text-[clamp(22px,2.6vw,28px)] font-medium leading-[1.2] tracking-[-.03em] text-balance">Que cada proceso sistemático corra con IA.</p>
          <p className="text-base tracking-[-.015em] text-sub">Abierta como nuestros números, segura como nuestro estándar.</p>
        </div>
        <p className="lead">El stack de IA de Nexo, las buenas prácticas, el Company Brain y los proyectos de agentes. Medimos el avance en horas de trabajo manual liberadas y en los KPIs de cada dolor de negocio.</p>
        <p className="text-[13px] text-faint">Alexandra Paiz, Líder de IA y Herramientas</p>
        <div className="mt-6 -ml-5 max-sm:ml-0"><button type="button" onClick={() => go("portafolio")} className="group inline-flex h-[52px] items-center gap-2 rounded-full border border-line-2 bg-white px-5 text-base font-medium leading-none text-text transition-colors hover:border-text">Ver el portafolio<ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" /></button></div>
      </section>

      <Section id="mision">
        <SectionHead eyebrow="Misión" title="De libro abierto a código abierto." />
        <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start gap-10 max-[820px]:grid-cols-1 max-[820px]:gap-6">
          <blockquote className="m-0 text-[clamp(20px,2.2vw,25px)] font-medium leading-tight tracking-[-.03em]">
            Grupo PDC ya es una empresa de libro abierto: los números son de todos. <span className="text-faint">La misión de Nexo IA es que lo que construimos con IA también lo sea, abierto y editable por cualquier líder.</span>
          </blockquote>
          <div className="grid gap-4 text-[15px] text-sub">
            <p><b className="font-semibold text-text">InnerSource.</b> Prácticas de código abierto, pero dentro de la organización: el código, las guías y los agentes se ven, se reutilizan y cualquiera puede proponer mejoras, con guardrails.</p>
            <p><b className="font-semibold text-text">Así trabajan los laboratorios de IA de frontera.</b> En empresas como Anthropic, equipos que no son de ingeniería, como mercadeo, legal o finanzas, construyen sus propias herramientas con agentes de programación: describen en lenguaje natural lo que necesitan y el agente escribe el código. Quien conoce el proceso arma la primera versión; ingeniería la revisa, la asegura y la lleva a producción.</p>
            <p><b className="font-semibold text-text">El camino.</b> Primero Nexo construye y prueba el marco; después cada área desarrolla sus propios agentes en autoservicio.</p>
          </div>
        </div>
      </Section>

      <RobotBand />

      <Section id="marco">
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
          <div className="flex flex-wrap items-baseline gap-2.5 px-1 pb-2 text-[13px] text-sub"><b className="font-semibold text-text">Intelligence Stack</b><span>Seis capas, como un ciclo OODA a escala de organización, y dónde vive cada una en Nexo</span></div>
          <div className="grid grid-cols-6 border-t border-line max-[820px]:grid-cols-2">
            {ISTACK.map(([n, d], i) => (
              <div key={n} className="grid min-w-0 content-start gap-1 py-4 pr-3.5 [&+&]:border-l [&+&]:border-line [&+&]:pl-3.5 max-[820px]:[&:nth-child(odd)]:border-l-0 max-[820px]:[&:nth-child(odd)]:pl-0 max-[820px]:[&:nth-child(n+3)]:border-t">
                <b className="text-xs font-semibold text-accent">{i + 1}</b><span className="text-[15px] font-semibold tracking-[-.02em]">{n}</span><p className="text-[13px] text-sub">{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-r-sm border border-dashed border-line-2 px-4 py-3 text-[13px] text-sub"><b className="font-semibold text-text">GOVERN / ASSURE · plano de control.</b> Entra ID, Presidio, Key Vault, kill switch, auditoría y las reglas de AI Best Practices cruzan todas las capas.</p>
        </div>
      </Section>
      <Footer right="Marco: Organizaciones Exponenciales 3.0 (OpenExO)" />
    </main>
  )
}
