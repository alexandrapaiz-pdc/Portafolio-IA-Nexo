import { ChevronRight } from "lucide-react"
import { agentsOf, inProgram, LSTAT, NEXT_LEVEL, NEXT_STATUS, PROGRAMS, savings, STATUS, type Level } from "@/lib/domain"
import { clone, isNum, nf, pct, today } from "@/lib/format"
import { useStore } from "@/lib/store"
import { useRouter } from "@/lib/router"
import { Button } from "@/components/ui/button"
import { GlowCard } from "@/components/ui/spotlight-card"
import { Empty, Footer, ProjectRow, Section, SectionHead, SecP, Stat, StatsRow, StatusPill, UpdateRow } from "@/components/shared"
import { StackDiagram } from "@/components/stack-diagram"

const JUMP = [["stack-sec", "Stack"], ["practicas", "Buenas prácticas"], ["brain", "Company Brain"], ["proyectos", "Agentes"], ["bitacora", "Bitácora"]]
const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })

function LevelRow({ x, pid, field, i }: { x: Level; pid: string; field: "levels" | "parts"; i: number }) {
  const { canWrite, projects, db, write } = useStore()
  const [cls, label] = LSTAT[x.status] || LSTAT.pendiente
  const cycle = () => {
    const pp = projects.find((p) => p.id === pid); if (!pp) return
    const arr = clone(pp[field] || []); const nx = field === "levels" ? NEXT_LEVEL[x.status] || "activo" : NEXT_STATUS[x.status] || "en_curso"
    arr[i].status = nx
    write(() => db.doc("projects/" + pid).update({ [field]: arr }), `${x.name}: ${(LSTAT[nx] || [0, nx])[1]}`)
  }
  return (
    <div className="row grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0"><div className="font-medium">{x.name}</div><div className="mt-0.5 text-[13px] text-sub">{x.who || x.desc}</div></div>
      <StatusPill status={cls} label={label} onClick={canWrite ? cycle : undefined} />
    </div>
  )
}

export function Portfolio() {
  const { projects, components, updates, loaded, noDb, canWrite, db, write } = useStore()
  const { openProject } = useRouter()
  const byId = (id: string) => projects.find((p) => p.id === id)
  const ag = agentsOf(projects)
  const comps = [...components].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
  const ready = comps.filter((c) => c.status === "listo").length, prog = comps.filter((c) => c.status === "en_curso").length
  const kpis = projects.flatMap((p) => p.kpis || []), measured = kpis.filter((k) => isNum(k.baseline)).length
  const byUnit: Record<string, number> = {}
  projects.forEach((p) => { const s = savings(p); if (isNum(s.baseline)) byUnit[s.unit] = (byUnit[s.unit] || 0) + s.baseline })
  const units = Object.entries(byUnit)
  const pr = byId("protocolos"), br = byId("companybrain")
  const lv = pr?.levels || [], act = lv.filter((x) => x.status === "activo").length
  const parts = br?.parts || [], pDone = parts.filter((x) => x.status === "listo").length, pProg = parts.filter((x) => x.status === "en_curso").length
  const building = ag.filter((p) => ["construccion", "piloto", "produccion"].includes(p.phase || "")).length
  const M: Record<string, [number, string, number]> = {
    stack: [ready, `de ${comps.length} componentes listos`, pct(ready, comps.length)],
    practicas: [act, `de ${lv.length} niveles activos`, pct(act, lv.length)],
    brain: [pDone + pProg, `de ${parts.length} partes en marcha`, pct(pDone + pProg * 0.5, parts.length)],
    agentes: [ag.length, `proyectos · ${building} en construcción`, pct(building, ag.length)],
  }
  const unlocks = (cid: string) => projects.filter((p) => !p.enabler && (p.needs || []).includes(cid)).length

  return (
    <main className="wrap">
      <section className="grid gap-[18px] pb-10 pt-[88px]">
        <div className="eyebrow">Portafolio · Q4 2026</div>
        <h1 className="h-display">Portafolio.</h1>
        <p className="lead">Cuatro frentes: el stack de IA de Nexo, las buenas prácticas, el Company Brain y los proyectos de agentes.</p>
        <nav aria-label="Secciones del portafolio" className="mt-1.5 flex flex-wrap gap-2">
          {JUMP.map(([id, l]) => <button key={id} type="button" onClick={() => jump(id)} className="whitespace-nowrap rounded-full border-0 bg-group px-3.5 py-[7px] text-[13px] font-medium hover:bg-line">{l}</button>)}
        </nav>
      </section>

      {noDb && <p className="mb-6 rounded-r-sm bg-group px-4 py-3 text-[13px] text-sub">Inicia sesión en claude.ai para ver los datos del portafolio.</p>}

      <StatsRow>
        <Stat k="Stack listo" v={ready} unit={`de ${comps.length}`} sub={`${prog} componentes en curso`} />
        <Stat k="Proyectos de agentes" v={ag.length} sub={`Prioridad 1: ${ag[0]?.name || "—"}`} />
        <Stat k="Líneas base medidas" v={measured} unit={`de ${kpis.length}`} sub="KPIs con punto de partida" />
        <Stat k="Trabajo manual en alcance" accent v={units.length ? nf(units[0][1]) : "—"} unit={units[0]?.[0]} sub={units.length > 1 ? units.slice(1).map(([u, v]) => `${nf(v)} ${u}`).join(" · ") : "Horas medidas a la fecha"} />
      </StatsRow>

      <section className="grid grid-cols-2 gap-3.5 pt-10 max-[720px]:grid-cols-1">
        {PROGRAMS.map((g) => {
          const [num, label, w] = M[g.id], lead = g.lead ? byId(g.lead) : null
          return (
            <GlowCard key={g.id} glowColor="pdc" backdrop="rgba(248,250,252,.72)" borderColor="rgba(15,23,42,.07)" customSize className="min-w-0 grid-rows-none p-0 shadow-[0_1px_2px_rgba(15,23,42,.04),0_10px_30px_-12px_rgba(15,23,42,.18)]">
            <button type="button" onClick={() => jump(g.sec)} className="relative grid h-full min-w-0 cursor-pointer content-start gap-2.5 rounded-2xl border-0 bg-transparent p-6 text-left">
              <span className="text-[clamp(23px,2.4vw,28px)] font-medium leading-[1.1] tracking-[-.03em]">{g.name}</span>
              <h3 className="text-base font-medium leading-snug tracking-[-.015em] text-sub">{g.line}</h3>
              <p className="text-[13px] text-faint">{lead?.blocker ? `Bloqueo: ${lead.blocker}` : g.id === "agentes" && ag[0] ? `Prioridad 1: ${ag[0].name}` : ""}</p>
              <div className="mt-1.5 flex items-baseline gap-2"><b className="num text-[30px] font-semibold leading-none tracking-[-.04em]">{num}</b><span className="text-[13px] text-faint">{label}</span></div>
              <div className="bar mt-0.5"><i style={{ width: w + "%" }} /></div>
            </button>
            </GlowCard>
          )
        })}
      </section>

      <Section id="stack-sec">
        <SectionHead eyebrow="Nexo AI Stack" title="Lo que desbloquea todo lo demás.">
          <SecP>Cada componente del stack habilita proyectos. Mientras no esté listo, el avance se mide aquí y en el descubrimiento de cada proyecto.</SecP>
          <div><Button variant="ghost" onClick={() => openProject("infra")}>Ver detalle del stack</Button></div>
        </SectionHead>
        <div className="grid gap-[34px]">
          <StackDiagram />
          <div>
            <div className="flex gap-1">{comps.map((c) => <i key={c.id} className={"h-1 flex-1 rounded-sm " + (c.status === "listo" ? "bg-strong" : c.status === "en_curso" ? "bg-accent" : "bg-line-2")} />)}</div>
            <div className="num flex flex-wrap gap-[22px] pt-3 text-[13px] text-sub"><span><b className="font-semibold text-text">{ready}</b> listos</span><span><b className="font-semibold text-text">{prog}</b> en curso</span><span><b className="font-semibold text-text">{comps.length - ready - prog}</b> pendientes</span></div>
            <details className="group mt-[18px]">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-accent-ink [&::-webkit-details-marker]:hidden">Ver los {comps.length} componentes del stack <ChevronRight size={14} className="transition-transform group-open:rotate-90" /></summary>
              <div className="group-box mt-3">
                {loaded.c && !comps.length && <Empty>Todavía no hay componentes registrados.</Empty>}
                {comps.map((c) => {
                  const u = unlocks(c.id)
                  return (
                    <div key={c.id} className="row grid-cols-[minmax(0,1fr)_auto_auto] max-sm:grid-cols-[minmax(0,1fr)_auto]">
                      <div className="min-w-0"><div className="font-medium">{c.name}{c.key && <span className="ml-2 text-xs font-semibold text-accent-ink">Bloqueador principal</span>}</div><div className="mt-0.5 text-[13px] text-sub">{[c.owner, c.note].filter(Boolean).join(" · ")}</div></div>
                      <span className="num min-w-[92px] text-right text-[13px] text-faint max-sm:hidden">{u ? `${u} ${u === 1 ? "proyecto" : "proyectos"}` : "Base"}</span>
                      <StatusPill status={c.status} label={STATUS[c.status]} onClick={canWrite ? () => { const ns = NEXT_STATUS[c.status] || "en_curso"; write(() => db.doc("components/" + c.id).update({ status: ns, updated: today() }), `${c.name}: ${STATUS[ns]}`) } : undefined} />
                    </div>
                  )
                })}
              </div>
            </details>
          </div>
        </div>
      </Section>

      <Section id="practicas">
        <SectionHead eyebrow="AI Best Practices" title="Estándares para usar y construir con IA.">
          <SecP>Guías por nivel, desde quien usa Claude hasta quien construye agentes. Viven en GitHub y cualquiera puede proponer mejoras.</SecP>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="ghost" onClick={() => openProject("protocolos")}>Ver detalle</Button>
            {pr?.repo && <a href={pr.repo} target="_blank" rel="noopener" className="text-sm font-medium text-accent-ink no-underline hover:underline">Abrir en GitHub ›</a>}
            {isNum(pr?.pendingDecisions) && <span className="text-sm text-sub">{pr!.pendingDecisions} decisiones pendientes</span>}
          </div>
        </SectionHead>
        <div className="group-box">{lv.length ? lv.map((x, i) => <LevelRow key={i} x={x} pid="protocolos" field="levels" i={i} />) : <Empty>{loaded.p ? "Sin niveles registrados." : "Cargando…"}</Empty>}</div>
      </Section>

      <Section id="brain">
        <SectionHead eyebrow="Company Brain" title="El conocimiento de la empresa, listo para agentes.">
          <SecP>Integraciones con Databricks y la información de la empresa en un solo lugar. Los portales, empezando por Portal de Mundos, son su cara visible.</SecP>
          <div><Button variant="ghost" onClick={() => openProject("companybrain")}>Ver detalle</Button></div>
        </SectionHead>
        <div className="group-box">{parts.length ? parts.map((x, i) => <LevelRow key={i} x={x} pid="companybrain" field="parts" i={i} />) : <Empty>{loaded.p ? "Sin partes registradas." : "Cargando…"}</Empty>}</div>
        <div>
          <div className="flex flex-wrap items-baseline gap-2.5 px-1 pb-2 text-[13px] text-sub"><b className="font-semibold text-text">Portales</b><span>El frente interactivo del Company Brain</span></div>
          <div className="group-box">{projects.filter((p) => inProgram(p, "brain") && p.id !== "companybrain").map((p) => <ProjectRow key={p.id} p={p} />)}</div>
        </div>
      </Section>

      <Section id="proyectos">
        <SectionHead eyebrow="AI Agent Projects" title="Agentes, en este orden."><SecP>Prioridad acordada con Benji y Óscar el 30 de septiembre.</SecP></SectionHead>
        <div className="group-box">{ag.length ? ag.map((p, i) => <ProjectRow key={p.id} p={p} rank={String(i + 1)} />) : <Empty>{loaded.p ? "Todavía no hay proyectos." : "Cargando proyectos…"}</Empty>}</div>
      </Section>

      <Section id="bitacora">
        <SectionHead eyebrow="Bitácora" title="Lo último." />
        <div className="group-box">{updates.length ? updates.slice(0, 10).map((u) => <UpdateRow key={u.id} u={u} showProject />) : <Empty>Aún no hay actualizaciones. Abre un proyecto y publica la primera.</Empty>}</div>
      </Section>

      <Footer right="Fuentes: reuniones en Granola y backlog en Asana. “Pendiente” indica una línea base aún no medida." />
    </main>
  )
}
