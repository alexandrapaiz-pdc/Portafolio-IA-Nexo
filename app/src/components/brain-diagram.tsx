import { useMemo } from "react"

// Company Brain, as a quiet illustration: a top-down brain drawn as a point network (two hemispheres),
// a few agents glowing inside it, and thin streams of data rising from a platform beneath. No text.
const CX = 510, CY = 205, GAP = 4
const hemis = [{ cx: CX - 80, sign: -1 }, { cx: CX + 80, sign: 1 }]
const RX = 96, RY = 128

function rng(seed: number) { let x = seed; return () => ((x = (x * 16807) % 2147483647) / 2147483647) }
function inside(x: number, y: number, h: (typeof hemis)[number], m = 0) {
  const dy = (y - CY) / RY, dx = (x - h.cx) / (RX * (1 + 0.1 * dy)), a = Math.atan2(dy, dx)
  const r = 1 + 0.022 * Math.sin(9 * a) + 0.014 * Math.sin(17 * a + 1)
  return dx * dx + dy * dy < (r - m) * (r - m) && (x - CX) * h.sign > GAP
}

export function BrainDiagram() {
  const { pts, links, outline } = useMemo(() => {
    const r = rng(7), pts: [number, number][] = []
    for (let y = CY - RY; y <= CY + RY; y += 15) for (let x = CX - 190; x <= CX + 190; x += 15) {
      const px = x + (r() - 0.5) * 9, py = y + (r() - 0.5) * 9
      if (hemis.some((h) => inside(px, py, h, 0.04))) pts.push([px, py])
    }
    const links: [number, number, number, number][] = []
    pts.forEach(([x, y], i) => { let n = 0; for (let j = i + 1; j < pts.length && n < 3; j++) { const [u, v] = pts[j]; if ((x - CX) * (u - CX) > 0 && Math.hypot(x - u, y - v) < 21) { links.push([x, y, u, v]); n++ } } })
    const outline = hemis.map((h) => {
      let d = ""
      for (let k = 0; k <= 160; k++) {
        const a = (k / 160) * Math.PI * 2, rr = 1 + 0.022 * Math.sin(9 * a) + 0.014 * Math.sin(17 * a + 1)
        const y = CY + Math.sin(a) * RY * rr; let x = h.cx + Math.cos(a) * RX * rr * (1 + 0.1 * Math.sin(a) * rr)
        if ((x - CX) * h.sign < GAP) x = CX + h.sign * GAP
        d += (k ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1)
      }
      return d + "Z"
    })
    return { pts, links, outline }
  }, [])
  const agents: [number, number][] = [[452, 140], [576, 122], [404, 222], [610, 214], [470, 286], [560, 300]]
  const agentLinks = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5], [0, 4], [1, 5]]
  const streams = [430, 470, 510, 550, 590]
  return (
    <figure className="m-0">
      <div className="overflow-hidden card px-3.5 py-6">
        <svg viewBox="250 40 520 480" className="mx-auto block h-auto w-full max-w-[560px]" role="img"
          aria-label="Ilustración del Company Brain: un cerebro hecho de una red de puntos con agentes que brillan dentro, alimentado por corrientes de datos que suben desde una plataforma.">
          <defs>
            <radialGradient id="cbHalo" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#4d6fff" stopOpacity=".16" /><stop offset=".6" stopColor="#4d6fff" stopOpacity=".05" /><stop offset="1" stopColor="#4d6fff" stopOpacity="0" /></radialGradient>
            <radialGradient id="cbAgent" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ff5100" stopOpacity=".45" /><stop offset="1" stopColor="#ff5100" stopOpacity="0" /></radialGradient>
            <linearGradient id="cbStream" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#4d6fff" stopOpacity=".05" /><stop offset=".5" stopColor="#4d6fff" stopOpacity=".55" /><stop offset="1" stopColor="#00216f" stopOpacity=".25" /></linearGradient>
            <linearGradient id="cbDisc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#e3e9ff" /></linearGradient>
          </defs>
          <ellipse cx={CX} cy={CY} rx="250" ry="200" fill="url(#cbHalo)" />
          {outline.map((d, i) => <path key={i} d={d} fill="#fff" fillOpacity=".55" stroke="#00216f" strokeOpacity=".22" strokeWidth="1" />)}
          {links.map(([x, y, u, v], i) => <line key={i} x1={x} y1={y} x2={u} y2={v} stroke="#00216f" strokeOpacity=".09" strokeWidth=".8" />)}
          {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1.3} fill="#00216f" fillOpacity={0.18 + ((i * 37) % 10) / 40} />)}
          {streams.map((x, i) => {
            const d = `M${x} 470 C ${x} 420, ${CX + (x - CX) * 0.4} 400, ${CX + (x - CX) * 0.4} 342`
            return <g key={x}><path d={d} fill="none" stroke="url(#cbStream)" strokeWidth="1.2" /><path d={d} className="cb-flow cb-up" style={{ animationDelay: `${i * 0.3}s` }} fill="none" stroke="#4d6fff" strokeWidth="1.6" strokeLinecap="round" /></g>
          })}
          {agentLinks.map(([a, b], i) => <line key={i} x1={agents[a][0]} y1={agents[a][1]} x2={agents[b][0]} y2={agents[b][1]} stroke="#ff5100" strokeOpacity=".35" strokeWidth="1" />)}
          {agentLinks.slice(0, 4).map(([a, b], i) => <path key={"f" + i} d={`M${agents[a][0]} ${agents[a][1]} L${agents[b][0]} ${agents[b][1]}`} className="cb-flow" style={{ animationDelay: `${i * 0.4}s` }} fill="none" stroke="#ff5100" strokeWidth="1.6" strokeLinecap="round" />)}
          {agents.map(([x, y], i) => (
            <g key={i} className="cb-node" style={{ animationDelay: `${i * 0.45}s` }}>
              <circle cx={x} cy={y} r="16" fill="url(#cbAgent)" />
              <circle cx={x} cy={y} r="5" fill="#fff" stroke="#ff5100" strokeWidth="1.6" />
              <circle cx={x} cy={y} r="2" fill="#ff5100" />
            </g>
          ))}
          <ellipse cx={CX} cy="482" rx="190" ry="24" fill="url(#cbDisc)" stroke="#00216f" strokeOpacity=".16" />
          <ellipse cx={CX} cy="478" rx="130" ry="16" fill="none" stroke="#00216f" strokeOpacity=".12" />
          <ellipse cx={CX} cy="475" rx="72" ry="9" fill="none" stroke="#4d6fff" strokeOpacity=".35" />
          {streams.map((x) => <circle key={x} cx={x} cy="472" r="2.2" fill="#4d6fff" fillOpacity=".7" />)}
        </svg>
      </div>
    </figure>
  )
}
