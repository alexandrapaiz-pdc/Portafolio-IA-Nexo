import { useMemo, useState } from "react"
import { phaseLabel, STATUS, vsmStats, type Mode, type VsmStep } from "@/lib/domain"
import { fh, nf } from "@/lib/format"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Footer, H5, Section, SectionHead, SecP, StatusPill } from "@/components/shared"
import { AgentSphere } from "@/components/agent-sphere"
import { VsmDiagram, VsmLegend } from "@/components/vsm"

type DemoStep = [string, number, number, Mode?]
interface Demo { name: string; desc: string; owner: string; unit: string; seed: number; base: number; amp: number; hrsPer: number; appr: number; exc: number; asis: DemoStep[]; tobe: DemoStep[]; log: [string, "ok" | "ex", string][] }

// Sample data for the demo only — clearly labeled on the page as fictitious.
const DEMO: Record<string, Demo> = {
  avon: { name: "Agente de kickoff de campaña", desc: "De la base de ventas a las tablas de KPIs y el top / bottom 10 de ofertas, por país y campaña.", owner: "Planeación Avon", unit: "corridas", seed: 7, base: 2, amp: 4, hrsPer: 2.2, appr: 92, exc: 3,
    asis: [["Descargar ventas", 1.5, 0], ["Limpiar y consolidar", 4, 8], ["Pedidos año anterior", 2, 4], ["Separar subcategorías", 3, 4], ["Poblar KPIs", 2, 2], ["Top / bottom 10", 2.5, 8]],
    tobe: [["Base de ventas automática", 0.2, 0, "agente"], ["Agente genera KPIs", 0.3, 0.5, "agente"], ["Revisar y presentar", 1.5, 4, "mixto"]],
    log: [["09:12", "ok", "Kickoff C08'27 Guatemala listo; Planeación aprobó sin cambios."], ["09:05", "ok", "KPIs de El Salvador generados (412 ofertas)."], ["08:58", "ex", "3 ofertas sin subcategoría Children; pasan a revisión."], ["Ayer", "ok", "Top / bottom 10 de Honduras presentado al equipo."], ["Ayer", "ok", "Base de ventas actualizada desde Vikingo Planeación."]] },
  contraloria: { name: "Agente de conciliación documental", desc: "Concilia facturas de Tráfico contra órdenes de compra y prepara liquidación y retenciones para aprobación.", owner: "Contraloría · MegaMás", unit: "documentos", seed: 3, base: 24, amp: 30, hrsPer: 0.18, appr: 88, exc: 11,
    asis: [["Recibir documentos", 0.5, 24], ["Carpeta compartida", 0.5, 48], ["Factura vs. OC", 1, 72], ["Liquidar costos", 1.5, 48], ["Registrar en ERP", 0.5, 24]],
    tobe: [["Canal único", 0.2, 2, "manual"], ["Agente concilia", 0.1, 0.5, "agente"], ["Agente prepara", 0.1, 0.5, "agente"], ["Aprobar", 0.3, 8, "mixto"], ["Registrar en ERP", 0.3, 8, "manual"]],
    log: [["10:41", "ok", "Factura 88213 conciliada con OC 4512; enviada a aprobación."], ["10:37", "ex", "Documento ilegible en lote 17; se pidió reenvío a Tráfico."], ["10:20", "ok", "Liquidación del embarque 3301 preparada con retenciones."], ["09:55", "ok", "César Paz aprobó 14 conciliaciones."], ["Ayer", "ok", "Lote de 212 documentos procesado; 9 excepciones."]] },
  step: { name: "Validación de códigos STEP", desc: "Revisa los atributos de cada código nuevo por etapa, antes de que llegue a facturación.", owner: "Catálogos · Manufactura", unit: "códigos", seed: 11, base: 3, amp: 8, hrsPer: 1.1, appr: 81, exc: 6,
    asis: [["Llenar Excel", 2, 24], ["Validar datos", 1, 48], ["Redigitar", 1.5, 24], ["Errores al facturar", 4, 120]],
    tobe: [["Solicitud en STEP", 0.5, 4, "mixto"], ["Validar marca", 0.3, 4, "mixto"], ["Logística", 0.3, 4, "mixto"], ["Pesos y dimensiones", 0.3, 4, "mixto"], ["Producción", 0.3, 4, "mixto"], ["Check final", 0.3, 2, "manual"]],
    log: [["11:03", "ok", "Código 700145 validado en las 5 etapas."], ["10:48", "ex", "Tipo de costeo incorrecto en código 700139; devuelto a Manufactura."], ["10:12", "ok", "Ingeniería completó pesos y dimensiones de 4 códigos."], ["Ayer", "ok", "Catálogos cerró 7 códigos sin redigitar."], ["Ayer", "ex", "Unidades por caja vacías en 2 códigos."]] },
}

const rng = (seed: number) => { let x = seed * 9301 + 49297; return () => (x = (x * 9301 + 49297) % 233280) / 233280 }
function series(d: Demo) {
  const r = rng(d.seed)
  return Array.from({ length: 30 }, (_, i) => { const wk = new Date(Date.now() - (29 - i) * 864e5).getDay(), w = wk === 0 || wk === 6 ? 0.25 : 1; return Math.max(0, Math.round((d.base + r() * d.amp) * w * (0.7 + i / 60))) })
}
const toSteps = (arr: DemoStep[], def: Mode): VsmStep[] => arr.map(([name, pt, wait, mode]) => ({ name, who: "", pt, wait, ca: null, mode: mode || def }))

function Bars({ vals }: { vals: number[] }) {
  const W = 600, H = 150, pl = 28, pb = 20, pt = 10, top = Math.ceil(Math.max(...vals) / 10) * 10 || 10, bw = (W - pl) / vals.length
  const Y = (v: number) => pt + (H - pt - pb) * (1 - v / top)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Actividad diaria de los últimos 30 días" className="block h-auto w-full">
      {[0, top / 2, top].map((v) => <g key={v}><line x1={pl} x2={W} y1={Y(v)} y2={Y(v)} stroke="var(--line)" /><text x={pl - 6} y={Y(v) + 4} textAnchor="end" fontSize="10" fill="var(--faint)">{nf(v)}</text></g>)}
      {vals.map((v, i) => <rect key={i} x={pl + i * bw + 2} y={Y(v)} width={Math.max(1, bw - 4)} height={Math.max(0, H - pb - Y(v))} rx="2" fill={i === vals.length - 1 ? "var(--accent)" : "var(--strong)"} opacity={i === vals.length - 1 ? 1 : 0.85}><title>{nf(v)}</title></rect>)}
      <text x={pl} y={H - 4} fontSize="10" fill="var(--faint)">hace 30 días</text><text x={W} y={H - 4} fontSize="10" fill="var(--faint)" textAnchor="end">hoy</text>
    </svg>
  )
}

export function Agents() {
  const { projects, components } = useStore()
  const [sel, setSel] = useState("avon")
  const d = DEMO[sel], p = projects.find((x) => x.id === sel)
  const vals = useMemo(() => series(d), [d]), tot = vals.reduce((a, b) => a + b, 0)
  const A = toSteps(d.asis, "manual"), B = toSteps(d.tobe, "agente"), ka = vsmStats(A), kb = vsmStats(B), mxl = Math.max(ka.lt, kb.lt) || 1
  const deps = ["dominio", "controles", "containerapps", "orquestacion"].map((id) => components.find((c) => c.id === id)).filter(Boolean)
  return (
    <main className="wrap">
      <section className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] items-center gap-7 pb-14 pt-[88px] max-[900px]:grid-cols-1">
        <div className="grid gap-[18px]">
          <div className="eyebrow">Próximamente</div>
          <h1 className="h-display">Portal de agentes.<span className="sub">Todos los agentes de Grupo PDC, en un solo lugar.</span></h1>
          <p className="lead">Un solo lugar para seguir los agentes de la empresa: qué hacen, quién los mantiene, cuánto trabajo manual liberan y cómo cambia su flujo de valor. Vivirá en el dominio de la empresa, con tu cuenta de Grupo PDC.</p>
        </div>
        <AgentSphere />
      </section>

      <Section className="pt-16">
        <SectionHead eyebrow="Demo · así se verá" title="Seguimiento de cada agente."><SecP>Una demostración con datos de ejemplo de los tres agentes en construcción. Ninguno está en producción todavía.</SecP></SectionHead>
        <div className="justify-self-start rounded-r-sm bg-accent-soft px-3.5 py-2.5 text-[13px] text-accent-ink">Datos ficticios para ilustrar el portal. No son mediciones reales.</div>
        <div className="seg" role="group" aria-label="Elegir agente">{Object.entries(DEMO).map(([id, x]) => <button key={id} type="button" aria-pressed={id === sel} onClick={() => setSel(id)}>{x.name}</button>)}</div>
        <div className="grid gap-[18px]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><h3 className="text-2xl tracking-[-.03em]">{d.name}</h3><p className="mt-1 max-w-[42em] text-sm text-sub">{d.desc}</p>
              <p className="mt-1.5 text-sm text-sub">{d.owner}{p ? ` · proyecto: ${p.name} · fase real: ${phaseLabel(p)}` : ""}</p></div>
            <span className="inline-flex items-center gap-[7px] whitespace-nowrap text-[13px] font-medium text-strong"><i className="size-2 rounded-full bg-strong motion-safe:animate-[pulseDot_2s_ease-in-out_infinite]" />En producción (demo)</span>
          </div>
          <div className="num grid grid-cols-4 gap-3 max-[720px]:grid-cols-2">
            {([[`${d.unit[0].toUpperCase() + d.unit.slice(1)} en 30 días`, nf(tot), `${nf(vals[vals.length - 1])} hoy`, false], ["Horas manuales liberadas", `${nf(Math.round(tot * d.hrsPer))} h`, "últimos 30 días", true], ["Aprobadas sin cambios", `${d.appr}%`, "revisión humana", false], ["Excepciones", String(d.exc), "enviadas a una persona", false]] as [string, string, string, boolean][]).map(([k, v, s, acc]) => (
              <div key={k} className="grid min-w-0 gap-1 rounded-r bg-group px-[18px] py-4"><span className="text-[12.5px] text-sub">{k}</span><span className={cn("text-[30px] font-semibold leading-[1.05] tracking-[-.04em]", acc && "text-accent")}>{v}</span><span className="text-xs text-faint">{s}</span></div>
            ))}
          </div>
          <div className="rounded-r bg-group px-[18px] pb-2.5 pt-4">
            <div className="mb-1.5 flex flex-wrap justify-between gap-3 text-[13px] text-sub"><span>Actividad diaria · <b className="font-semibold text-text">{d.unit}</b></span><span>Fines de semana con menos volumen</span></div>
            <Bars vals={vals} />
          </div>
          <div className="num grid gap-2.5 rounded-r bg-group px-[18px] py-4">
            <div className="text-[13px] text-sub">Lead time por ciclo · mapa de flujo de valor</div>
            {([["Hoy", ka.lt, "bg-faint"], ["Con agente", kb.lt, "bg-accent"]] as [string, number, string][]).map(([l, v, c]) => (
              <div key={l} className="grid grid-cols-[96px_minmax(0,1fr)_72px] items-center gap-3 text-[13px]"><span className="text-sub">{l}</span><div className="h-2.5 overflow-hidden rounded-[5px] bg-line-2"><i className={"block h-full rounded-[5px] " + c} style={{ width: (v / mxl) * 100 + "%" }} /></div><b className="text-right font-semibold">{fh(v)}</b></div>
            ))}
            <p className="text-[12.5px] text-sub">{nf((1 - kb.lt / ka.lt) * 100)}% menos lead time · eficiencia de {nf(ka.eff || 0)}% a {nf(kb.eff || 0)}% · {kb.ag} de {kb.n} pasos con agente</p>
          </div>
          <div className="grid gap-3.5"><div className="overflow-x-auto rounded-r bg-group px-3.5 py-4"><VsmDiagram steps={B} /></div><VsmLegend note="Flujo con agente · horas de ejemplo" /></div>
          <div><H5>Actividad reciente</H5>
            <div className="group-box">{d.log.map(([w, c, t], i) => <div key={i} className="row grid-cols-[64px_minmax(0,1fr)] items-start text-[13.5px]"><span className="num text-[12.5px] text-faint">{w}</span><span><span className={cn("font-medium", c === "ok" ? "text-strong" : "text-accent-ink")}>{c === "ok" ? "Listo" : "Excepción"}</span> · {t}</span></div>)}</div>
          </div>
        </div>
      </Section>

      <Section className="pt-16">
        <SectionHead eyebrow="Qué falta" title="Se publica cuando estén listos." />
        <div className="group-box">
          {deps.map((c) => <div key={c!.id} className="row grid-cols-[minmax(0,1fr)_auto]"><div className="min-w-0"><div className="font-medium">{c!.name}</div><div className="mt-0.5 text-[13px] text-sub">{c!.owner}</div></div><StatusPill status={c!.status} label={STATUS[c!.status]} /></div>)}
          <div className="row grid-cols-[minmax(0,1fr)_auto]"><div><div className="font-medium">Plantilla del portal con tarjetas de proyecto</div><div className="mt-0.5 text-[13px] text-sub">Alexandra · tarea en Asana</div></div><StatusPill status="pendiente" /></div>
        </div>
      </Section>
      <Footer right="Portal de agentes · en diseño" />
    </main>
  )
}
