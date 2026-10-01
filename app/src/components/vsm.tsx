import { useState } from "react"
import { cn } from "@/lib/utils"
import { VMODES, vsmStats, type Mode, type Project, type VsmStep } from "@/lib/domain"
import { clone, fh, isNum, nf, today } from "@/lib/format"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input, NativeSelect } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function wrapLines(t: string, max: number) {
  const w = String(t || "").split(/\s+/), L: string[] = []
  let c = ""
  w.forEach((x) => { if ((c + " " + x).trim().length > max && c) { L.push(c); c = x } else c = (c + " " + x).trim() })
  if (c) L.push(c)
  if (L.length > 3) { L.length = 3; L[2] = L[2].replace(/.{0,2}$/, "…") }
  return L
}

/** Classic VSM: process boxes, wait triangles before each step, and the time ladder below. */
export function VsmDiagram({ steps }: { steps: VsmStep[] }) {
  const TW = 46, BW = 160, BH = 104, Y = 14, LY1 = Y + BH + 30, LY2 = LY1 + 22
  const W = 10 + steps.length * (TW + BW) + 10, H = LY2 + 24
  let x = 10
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} className="block h-auto text-text" role="img" aria-label={`Mapa de flujo de valor con ${steps.length} pasos: cajas de proceso, triángulos de espera y escalera de tiempos.`}>
      <defs><marker id="vArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1 L9 5 L0 9 z" fill="currentColor" opacity=".5" /></marker></defs>
      {steps.map((s, i) => {
        const x0 = x, tx = x0 + TW / 2, ty = Y + BH / 2, bx = x0 + TW, m: Mode = s.mode || "manual"
        x = bx + BW
        return (
          <g key={i}>
            <path className="vline" d={`M${x0} ${ty} L${x0 + TW} ${ty}`} markerEnd="url(#vArrow)" />
            <path className="vtri" d={`M${tx} ${ty - 15} L${tx + 11} ${ty + 5} L${tx - 11} ${ty + 5} Z`} />
            <text className="vnum" x={tx} y={ty + 20} textAnchor="middle">{isNum(s.wait) ? nf(s.wait) + " h" : "—"}</text>
            <path className="vline" d={`M${x0} ${LY1} L${x0 + TW} ${LY1} L${x0 + TW} ${LY2}`} />
            <text className="vnum" x={tx} y={LY1 - 6} textAnchor="middle">{isNum(s.wait) ? nf(s.wait) : "—"}</text>
            <rect className={"vb " + m} x={bx} y={Y} width={BW} height={BH} rx="10" />
            <text className={"vm " + m} x={bx + 12} y={Y + 17}>{VMODES[m].toUpperCase()}</text>
            {wrapLines(s.name, 19).map((l, j) => <text key={j} className="vt" x={bx + 12} y={Y + 35 + j * 15}>{l}</text>)}
            <text className="vs" x={bx + 12} y={Y + BH - 10}>{(s.who || "") + (isNum(s.ca) ? ` · ${nf(s.ca)}% C&A` : "")}</text>
            <path className="vline" d={`M${bx} ${LY2} L${bx + BW} ${LY2}${i < steps.length - 1 ? ` L${bx + BW} ${LY1}` : ""}`} />
            <text className="vnum pt" x={bx + BW / 2} y={LY2 + 16} textAnchor="middle">{isNum(s.pt) ? nf(s.pt) + " h" : "—"}</text>
          </g>
        )
      })}
    </svg>
  )
}

export function VsmLegend({ note }: { note?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[12.5px] text-sub">
      <span><i className="legend-swatch" />Manual</span><span><i className="legend-swatch mixto" />Humano + agente</span><span><i className="legend-swatch agente" />Agente</span>
      <span>{note ?? "△ espera antes del paso · escalera: espera arriba, proceso abajo"}</span>
    </div>
  )
}

function VStat({ k, v, tone }: { k: string; v: string; tone?: "acc" | "pend" }) {
  return <div className="grid min-w-0 gap-0.5"><span className="text-xs text-faint">{k}</span><span className={cn("num text-xl font-semibold tracking-[-.03em]", tone === "acc" && "text-accent", tone === "pend" && "text-[13px] font-medium text-faint")}>{v}</span></div>
}

export function VsmSection({ p, onEditingChange }: { p: Project; onEditingChange?: (b: boolean) => void }) {
  const { canWrite, db, write } = useStore()
  const [tab, setTab] = useState<"asis" | "tobe">("asis")
  const [draft, setDraft] = useState<VsmStep[] | null>(null)
  const [note, setNote] = useState("")
  const v = p.vsm || {}
  const steps = draft ?? v[tab] ?? []
  const k = vsmStats(steps)
  const setEditing = (d: VsmStep[] | null) => { setDraft(d); onEditingChange?.(!!d) }
  const upd = (i: number, patch: Partial<VsmStep>) => setDraft((d) => (d || []).map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const numOrNull = (x: string) => (x === "" ? null : Number(x))

  const head = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="seg" role="group" aria-label="Vista del mapa">
        {(["asis", "tobe"] as const).map((t) => <button key={t} type="button" aria-pressed={tab === t} disabled={!!draft} onClick={() => setTab(t)}>{t === "asis" ? "Hoy" : "Con agente"}</button>)}
      </div>
      {canWrite && (draft
        ? <div className="flex gap-2"><Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={async () => {
              const vsm = clone(v) as Record<string, unknown>
              vsm[tab] = draft.filter((x) => x.name); vsm[tab + "Note"] = note.trim(); vsm.updated = today()
              setEditing(null); await write(() => db.doc("projects/" + p.id).update({ vsm }), "Mapa guardado")
            }}>Guardar mapa</Button></div>
        : <Button variant="ghost" onClick={() => { setNote(v[(tab + "Note") as "asisNote"] || ""); setEditing(clone(v[tab] || [])) }}>Editar mapa</Button>)}
    </div>
  )

  if (draft) {
    return (
      <div className="grid gap-3.5">{head}
        <div className="overflow-x-auto rounded-r bg-group p-4">
          <table className="w-full min-w-[780px] table-fixed border-collapse text-[13px]">
            <colgroup><col className="w-[34%]" /><col className="w-[18%]" /><col className="w-[84px]" /><col className="w-[84px]" /><col className="w-[84px]" /><col className="w-[150px]" /><col className="w-[64px]" /></colgroup>
            <thead><tr className="text-left text-xs text-sub">{["Paso", "Quién", "Proceso (h)", "Espera antes (h)", "% C&A", "Modo", ""].map((h) => <th key={h} className="px-1.5 py-1.5 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {draft.map((s, i) => (
                <tr key={i}>
                  <td className="p-1"><Input value={s.name} placeholder="Nombre del paso" onChange={(e) => upd(i, { name: e.target.value })} /></td>
                  <td className="p-1"><Input value={s.who || ""} placeholder="Área o rol" onChange={(e) => upd(i, { who: e.target.value })} /></td>
                  <td className="p-1"><Input type="number" min={0} step="any" value={s.pt ?? ""} onChange={(e) => upd(i, { pt: numOrNull(e.target.value) })} /></td>
                  <td className="p-1"><Input type="number" min={0} step="any" value={s.wait ?? ""} onChange={(e) => upd(i, { wait: numOrNull(e.target.value) })} /></td>
                  <td className="p-1"><Input type="number" min={0} max={100} step="any" value={s.ca ?? ""} onChange={(e) => upd(i, { ca: numOrNull(e.target.value) })} /></td>
                  <td className="p-1"><NativeSelect value={s.mode || "manual"} onChange={(e) => upd(i, { mode: e.target.value as Mode })}>{Object.entries(VMODES).map(([a, b]) => <option key={a} value={a}>{b}</option>)}</NativeSelect></td>
                  <td className="p-1"><button type="button" className="border-0 bg-transparent text-xs text-faint hover:text-text" onClick={() => setDraft((d) => (d || []).filter((_, j) => j !== i))}>Quitar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button variant="ghost" className="mt-2.5" onClick={() => setDraft((d) => [...(d || []), { name: "", who: "", pt: null, wait: null, ca: null, mode: "manual" }])}>Agregar paso</Button>
          <Label className="mt-3">Nota del mapa<Input value={note} onChange={(e) => setNote(e.target.value)} /></Label>
        </div>
      </div>
    )
  }

  if (!steps.length) return <div className="grid gap-3.5">{head}<div className="group-box px-5 py-7 text-center text-faint">{tab === "asis" ? "Aún no se ha mapeado el proceso actual." : "Aún no se ha diseñado el flujo con agente."}</div></div>
  const other = vsmStats(v[tab === "asis" ? "tobe" : "asis"] || [])
  const delta = tab === "tobe" && k.full && other.full && other.lt ? ` · ${nf((1 - k.lt / other.lt) * 100)}% menos lead time` : ""
  const tabNote = v[(tab + "Note") as "asisNote"]
  return (
    <div className="grid gap-3.5">{head}
      <div className="grid grid-cols-5 gap-2.5 max-sm:grid-cols-2">
        <VStat k="Lead time" v={k.full ? fh(k.lt) : `${k.timed}/${k.n} medidos`} tone={k.full ? undefined : "pend"} />
        <VStat k="Tiempo de proceso" v={k.full ? fh(k.pt) : "Pendiente"} tone={k.full ? undefined : "pend"} />
        <VStat k="Eficiencia" v={k.eff != null ? nf(k.eff) + "%" : "Pendiente"} tone={k.eff != null ? "acc" : "pend"} />
        <VStat k="% C&A acumulado" v={k.rca != null ? nf(k.rca) + "%" : "Pendiente"} tone={k.rca != null ? undefined : "pend"} />
        <VStat k="Pasos con agente" v={`${k.ag} de ${k.n}`} />
      </div>
      <div className="overflow-x-auto rounded-r bg-group px-3.5 py-4"><VsmDiagram steps={steps} /></div>
      <VsmLegend />
      {(tabNote || delta) && <p className="text-[12.5px] text-sub">{tabNote}{delta}</p>}
    </div>
  )
}
