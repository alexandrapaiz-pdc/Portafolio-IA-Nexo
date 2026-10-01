import { useEffect, useRef } from "react"

type RGB = [number, number, number]
const AG = [
  { t: "Kickoff Avon", lat: 0.35, lon: 0.3, live: 1 }, { t: "Conciliación", lat: -0.25, lon: 2.4, live: 1 }, { t: "STEP", lat: 0.55, lon: 4.3, live: 1 },
  { t: "Próximo", lat: -0.6, lon: 1.2, live: 0 }, { t: "Próximo", lat: 0.1, lon: 3.3, live: 0 }, { t: "Próximo", lat: -0.15, lon: 5.4, live: 0 },
].map((g) => ({ ...g, v: [Math.cos(g.lat) * Math.cos(g.lon), Math.sin(g.lat), Math.cos(g.lat) * Math.sin(g.lon)] as RGB, ph: Math.random() }))
const N = 620
const PTS: RGB[] = Array.from({ length: N }, (_, i) => { const y = 1 - ((i + 0.5) / N) * 2, r = Math.sqrt(1 - y * y), a = i * 2.39996323; return [Math.cos(a) * r, y, Math.sin(a) * r] })

/** Rotating point sphere: agents as glowing nodes sending light trails into the Portal core. */
export function AgentSphere() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current, host = cv?.parentElement
    const ctx = cv?.getContext("2d")
    if (!cv || !ctx || !host) return
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
    let W = 0, H = 0, raf = 0, lastCol = 0, mx = 0, my = 0, tx = 0, ty = 0
    const t0 = performance.now()
    let col = { dark: false, dot: [0, 33, 111] as RGB, acc: [255, 81, 0] as RGB, core: [0, 33, 111] as RGB, text: "#1d1d1f", faint: "#86868b", raise: "#fff", line: "rgba(0,0,0,.14)", font: "system-ui" }
    const css = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()
    const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches }
    const rgb = (c: string): RGB => { const d = document.createElement("span"); d.style.color = c; document.body.appendChild(d); const v = getComputedStyle(d).color; d.remove(); const m = v.match(/[\d.]+/g) || ["0", "0", "0"]; return [Number(m[0]), Number(m[1]), Number(m[2])] }
    const colors = () => { const dark = isDark(); col = { dark, dot: rgb(dark ? "#C9D4FF" : "#00216F"), acc: rgb(css("--accent") || "#FF5100"), core: rgb(dark ? "#2F5BFF" : "#00216F"), text: css("--text"), faint: css("--faint"), raise: css("--raise"), line: css("--line-2"), font: css("--font") } }
    const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`
    const size = () => { const r = cv.getBoundingClientRect(); if (!r.width) return false; const dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return true }
    const rot = (v: RGB, ry: number, rx: number): RGB => { let [x, y, z] = v; const cy = Math.cos(ry), sy = Math.sin(ry); [x, z] = [x * cy + z * sy, -x * sy + z * cy]; const cx = Math.cos(rx), sx = Math.sin(rx); [y, z] = [y * cx - z * sx, y * sx + z * cx]; return [x, y, z] }

    function draw(time: number) {
      const S = Math.min(W, H), R = S * 0.33, cx = W / 2, cy = H / 2, F = R * 3.2, ry = time * 0.00011 + mx * 0.35, rx = -0.32 + my * 0.22
      const proj = (v: RGB) => { const [x, y, z] = rot(v, ry, rx), k = F / (F + z * R); return { x: cx + x * R * k, y: cy + y * R * k, z, k } }
      ctx!.clearRect(0, 0, W, H)
      let g = ctx!.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.5)
      g.addColorStop(0, rgba(col.core, col.dark ? 0.2 : 0.07)); g.addColorStop(0.6, rgba(col.core, col.dark ? 0.05 : 0.02)); g.addColorStop(1, rgba(col.core, 0))
      ctx!.fillStyle = g; ctx!.fillRect(0, 0, W, H)
      ctx!.save(); ctx!.translate(cx, cy); ctx!.rotate(-0.35 + mx * 0.08)
      ctx!.beginPath(); ctx!.ellipse(0, 0, R * 1.32, R * 0.34, 0, 0, Math.PI * 2); ctx!.strokeStyle = rgba(col.dot, col.dark ? 0.22 : 0.14); ctx!.lineWidth = 1; ctx!.stroke()
      const ra = time * 0.0006; ctx!.beginPath(); ctx!.arc(Math.cos(ra) * R * 1.32, Math.sin(ra) * R * 0.34, 2.2, 0, Math.PI * 2); ctx!.fillStyle = rgba(col.acc, 0.9); ctx!.fill(); ctx!.restore()
      for (const p of PTS.map(proj).sort((a, b) => b.z - a.z)) { const d = (1 - p.z) / 2; ctx!.beginPath(); ctx!.arc(p.x, p.y, 0.55 + d * 1.25, 0, Math.PI * 2); ctx!.fillStyle = rgba(col.dot, 0.06 + d * d * (col.dark ? 0.7 : 0.55)); ctx!.fill() }
      const A = AG.map((a) => ({ a, p: proj(a.v) })), back = A.filter((o) => o.p.z >= 0.15), front = A.filter((o) => o.p.z < 0.15)
      const arc = (o: (typeof A)[number], al: number) => {
        const { a, p } = o; if (!a.live) return
        const qx = (p.x + cx) / 2 + (p.x - cx) * 0.35, qy = (p.y + cy) / 2 - R * 0.55
        const pt = (t: number) => [(1 - t) * (1 - t) * p.x + 2 * (1 - t) * t * qx + t * t * cx, (1 - t) * (1 - t) * p.y + 2 * (1 - t) * t * qy + t * t * cy]
        ctx!.beginPath(); ctx!.moveTo(p.x, p.y); ctx!.quadraticCurveTo(qx, qy, cx, cy); ctx!.strokeStyle = rgba(col.dot, 0.18 * al); ctx!.lineWidth = 1; ctx!.stroke()
        if (!reduce) { const h = (time / 1700 + a.ph) % 1; for (let k = 0; k < 16; k++) { const t = h - k * 0.016; if (t < 0) break; const [x, y] = pt(t); ctx!.beginPath(); ctx!.arc(x, y, Math.max(0.4, 2.2 - k * 0.12), 0, Math.PI * 2); ctx!.fillStyle = rgba(col.acc, (1 - k / 16) * 0.95 * al); ctx!.fill() } }
      }
      const node = (o: (typeof A)[number], al: number, label: boolean) => {
        const { a, p } = o, r = (a.live ? 6 : 4.5) * p.k
        if (a.live) {
          const hg = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.6); hg.addColorStop(0, rgba(col.acc, 0.28 * al)); hg.addColorStop(1, rgba(col.acc, 0))
          ctx!.fillStyle = hg; ctx!.beginPath(); ctx!.arc(p.x, p.y, r * 2.6, 0, Math.PI * 2); ctx!.fill()
          ctx!.beginPath(); ctx!.arc(p.x, p.y, r, 0, Math.PI * 2); ctx!.fillStyle = rgba(col.acc, al); ctx!.fill()
          ctx!.beginPath(); ctx!.arc(p.x, p.y, r * 0.38, 0, Math.PI * 2); ctx!.fillStyle = rgba([255, 255, 255], 0.95 * al); ctx!.fill()
        } else { ctx!.beginPath(); ctx!.arc(p.x, p.y, r, 0, Math.PI * 2); ctx!.setLineDash([2, 3]); ctx!.strokeStyle = rgba(col.dot, 0.5 * al); ctx!.lineWidth = 1; ctx!.stroke(); ctx!.setLineDash([]) }
        if (!label) return
        const fs = Math.max(11, S * 0.025); ctx!.font = `${a.live ? 600 : 500} ${fs}px ${col.font}`
        const tw = ctx!.measureText(a.t).width, bw = tw + 16, bh = fs * 1.9
        let bx = p.x + r + 10; if (bx + bw > W - 4) bx = p.x - r - 10 - bw
        const by = p.y - bh / 2
        ctx!.fillStyle = col.raise; ctx!.strokeStyle = col.line; ctx!.lineWidth = 1; ctx!.beginPath(); ctx!.roundRect(bx, by, bw, bh, bh / 2); ctx!.fill(); ctx!.stroke()
        ctx!.fillStyle = a.live ? col.text : col.faint; ctx!.textAlign = "left"; ctx!.textBaseline = "middle"; ctx!.fillText(a.t, bx + 8, by + bh / 2)
      }
      back.forEach((o) => { arc(o, 0.35); node(o, 0.3, false) })
      const cr = R * 0.17 * (1 + Math.sin(time / 800) * 0.04)
      g = ctx!.createRadialGradient(cx, cy, cr * 0.8, cx, cy, cr * 3); g.addColorStop(0, rgba(col.core, col.dark ? 0.45 : 0.22)); g.addColorStop(1, rgba(col.core, 0))
      ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(cx, cy, cr * 3, 0, Math.PI * 2); ctx!.fill()
      ctx!.beginPath(); ctx!.arc(cx, cy, cr + 5, 0, Math.PI * 2); ctx!.strokeStyle = rgba(col.core, 0.25); ctx!.lineWidth = 1; ctx!.stroke()
      ctx!.beginPath(); ctx!.arc(cx, cy, cr, 0, Math.PI * 2); ctx!.fillStyle = rgba(col.core, 1); ctx!.fill()
      ctx!.font = `600 ${Math.max(12, S * 0.03)}px ${col.font}`; ctx!.textAlign = "center"; ctx!.textBaseline = "middle"; ctx!.fillStyle = "#FFFFFF"; ctx!.fillText("Portal", cx, cy)
      front.sort((m, n) => n.p.z - m.p.z).forEach((o) => arc(o, 1))
      front.forEach((o) => node(o, 1, true))
    }
    function frame(now: number) {
      raf = 0
      if (document.hidden) return
      if (!W && !size()) { raf = requestAnimationFrame(frame); return }
      if (now - lastCol > 1200) { colors(); lastCol = now }
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05
      draw(reduce ? 0 : now - t0)
      if (!reduce) raf = requestAnimationFrame(frame)
    }
    const move = (e: PointerEvent) => { const r = host.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2 }
    const leave = () => { tx = 0; ty = 0 }
    const resize = () => { W = 0; if (!raf) raf = requestAnimationFrame(frame) }
    const vis = () => { if (!document.hidden && !raf) raf = requestAnimationFrame(frame) }
    host.addEventListener("pointermove", move); host.addEventListener("pointerleave", leave)
    addEventListener("resize", resize); document.addEventListener("visibilitychange", vis)
    colors(); raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); host.removeEventListener("pointermove", move); host.removeEventListener("pointerleave", leave); removeEventListener("resize", resize); document.removeEventListener("visibilitychange", vis) }
  }, [])
  return (
    <div className="relative aspect-square w-full max-w-[520px] justify-self-center" role="img" aria-label="Animación: una esfera de puntos con los agentes en construcción como nodos que envían trazos de luz al portal en el centro.">
      <canvas ref={ref} className="absolute inset-0 block h-full w-full" />
    </div>
  )
}
