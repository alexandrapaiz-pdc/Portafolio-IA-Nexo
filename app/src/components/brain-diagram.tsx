// Company Brain illustration, in the spirit of "agents are the new data consumers": a brain made of agents,
// fed by the cloud and the data of every mundo, with Databricks as the analytics engine. Nexo colors only.
const BRAIN = "M330 268 C292 258 286 210 314 190 C300 150 336 114 376 122 C388 84 436 70 470 88 C496 62 546 62 570 86 C612 70 656 92 660 128 C700 132 722 170 706 200 C732 226 716 268 680 272 C666 300 626 310 598 296 L402 296 C372 312 334 300 330 268 Z"
const FOLDS = [
  "M398 252 C 440 236 482 246 520 236 C 556 226 590 236 640 214", // lateral fissure
  "M352 182 C 372 168 392 186 412 172", "M346 226 C 368 214 382 232 400 224",
  "M470 98 C 476 120 462 136 474 156", "M540 94 C 532 116 548 128 540 150",
  "M600 104 C 612 124 600 140 616 154", "M666 150 C 650 162 668 178 652 192",
  "M690 230 C 672 236 678 254 660 258", "M452 270 C 470 260 486 276 504 266",
]
const NODES: [number, number][] = [[432, 142], [562, 118], [382, 212], [628, 190], [500, 222], [580, 262]]
const CIRCUIT = [
  "M432 142 H496 V118 H562", "M432 142 V212 H382", "M562 118 V160 H628 V190", "M382 212 V250 H500 V222",
  "M500 222 H580 V262", "M628 190 V262 H580", "M432 142 V180 H500 V222",
]
const STEM = [[500, 222, 470], [432, 142, 490], [580, 262, 520], [382, 212, 452], [562, 118, 540]] as const

function Agent({ x, y, i }: { x: number; y: number; i: number }) {
  return (
    <g className="cb-node" style={{ animationDelay: `${i * 0.35}s` }}>
      <circle cx={x} cy={y} r="19" fill="var(--accent)" opacity=".14" />
      <circle cx={x} cy={y} r="13" fill="#fff" stroke="var(--accent)" strokeWidth="2" />
      <rect x={x - 6.5} y={y - 4.5} width="13" height="9" rx="3" fill="none" stroke="var(--accent)" strokeWidth="1.6" />
      <circle cx={x - 2.4} cy={y} r="1.3" fill="var(--accent)" /><circle cx={x + 2.4} cy={y} r="1.3" fill="var(--accent)" />
    </g>
  )
}

export function BrainDiagram() {
  return (
    <figure className="m-0 grid gap-3">
      <div className="overflow-hidden card px-3.5 py-[18px]">
        <svg viewBox="200 40 720 520" className="mx-auto block h-auto w-full max-w-[660px]" role="img"
          aria-label="Ilustración del Company Brain: un cerebro formado por agentes conectados, alimentado por la nube y por los datos de cada mundo, con Databricks como motor analítico.">
          <defs>
            <linearGradient id="cbCloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e9eeff" /><stop offset="1" stopColor="#d4ddff" /></linearGradient>
            <linearGradient id="cbLake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#eef2ff" /><stop offset="1" stopColor="#dbe3ff" /></linearGradient>
            <radialGradient id="cbGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#4d6fff" stopOpacity=".18" /><stop offset="1" stopColor="#4d6fff" stopOpacity="0" /></radialGradient>
          </defs>
          <ellipse cx="510" cy="190" rx="260" ry="170" fill="url(#cbGlow)" />
          {[1.1, 1.06, 1.03].map((s, i) => <path key={s} d={BRAIN} fill="none" stroke="var(--navy)" strokeOpacity={0.08 + i * 0.07} strokeWidth="1.5" transform={`translate(510 190) scale(${s}) translate(-510 -190)`} />)}
          <path d={BRAIN} fill="#fff" fillOpacity=".7" stroke="var(--navy)" strokeWidth="2" />
          {FOLDS.map((d) => <path key={d} d={d} fill="none" stroke="var(--navy)" strokeOpacity=".22" strokeWidth="1.6" strokeLinecap="round" />)}
          <path d="M610 296 C 640 300 676 296 690 278 C 704 300 690 326 656 330 C 630 333 612 318 610 296 Z" fill="#fff" fillOpacity=".7" stroke="var(--navy)" strokeWidth="1.8" />
          {["M626 306 C 646 312 668 310 684 300", "M622 318 C 640 324 660 322 676 314"].map((d) => <path key={d} d={d} fill="none" stroke="var(--navy)" strokeOpacity=".25" strokeWidth="1.4" />)}
          {[...Array(7)].map((_, r) => [...Array(11)].map((_, c) => <circle key={`${r}-${c}`} cx={360 + c * 30} cy={130 + r * 24} r="1.2" fill="var(--navy)" opacity=".12" />))}
          {CIRCUIT.map((d) => <path key={d} d={d} fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeOpacity=".75" />)}
          {CIRCUIT.slice(0, 4).map((d) => <path key={"f" + d} d={d} className="cb-flow" fill="none" stroke="var(--accent)" strokeWidth="1.8" />)}
          {STEM.map(([x, y, tx], i) => <path key={i} d={`M${x} ${y} V 300 C ${x} 330, ${tx} 330, ${tx} 360 V 384`} fill="none" stroke={i % 2 ? "#4d6fff" : "var(--navy)"} strokeWidth="1.5" strokeOpacity=".6" />)}
          {STEM.map(([x, y, tx], i) => <path key={"s" + i} d={`M${x} ${y} V 300 C ${x} 330, ${tx} 330, ${tx} 360 V 384`} className="cb-flow cb-slow" fill="none" stroke="#4d6fff" strokeWidth="1.8" />)}
          <path d="M628 190 H760 V376" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeOpacity=".75" />
          <path d="M628 190 H760 V376" className="cb-flow" fill="none" stroke="var(--accent)" strokeWidth="1.8" />
          {NODES.map(([x, y], i) => <Agent key={i} x={x} y={y} i={i} />)}
          <path d="M392 446 C360 446 352 410 382 404 C380 378 414 366 434 380 C446 352 494 348 510 374 C528 356 566 362 570 388 C600 384 616 414 596 432 C608 446 590 452 580 446 Z" fill="url(#cbCloud)" stroke="var(--navy)" strokeWidth="1.8" />
          <text x="482" y="424" textAnchor="middle" className="dg-t" style={{ fill: "var(--navy)", fontSize: 16 }}>Azure</text>
          {[440, 466, 492, 518, 544].map((x, i) => <path key={x} d={`M${x} 446 C ${x} 466, ${x - 10 + i * 4} 470, ${x - 10 + i * 4} 492`} fill="none" stroke="#4d6fff" strokeWidth="1.5" strokeOpacity=".7" />)}
          <path d="M290 500 V 528 A 210 26 0 0 0 710 528 V 500" fill="url(#cbLake)" stroke="var(--navy)" strokeWidth="1.8" />
          <ellipse cx="500" cy="500" rx="210" ry="26" fill="#f4f6ff" stroke="var(--navy)" strokeWidth="1.8" />
          {[...Array(14)].map((_, i) => <circle key={i} cx={320 + i * 28} cy={500 + Math.sin(i) * 8} r="1.6" fill="#4d6fff" opacity=".5" />)}
          <text x="500" y="548" textAnchor="middle" className="dg-s" style={{ fill: "var(--navy)", fontSize: 12 }}>Datos de cada mundo</text>
          <g transform="translate(724 380)">
            <path d="M0 18 L36 0 L84 14 L48 32 Z" fill="#fff4ee" stroke="var(--accent)" strokeWidth="1.6" />
            <path d="M0 18 V 66 L48 84 V 32 Z" fill="#ffe6d9" stroke="var(--accent)" strokeWidth="1.6" />
            <path d="M48 32 L84 14 V 62 L48 84 Z" fill="#ffd8c4" stroke="var(--accent)" strokeWidth="1.6" />
            {[0, 9, 18].map((d) => <path key={d} d={`M12 ${38 + d} L24 ${44 + d} L36 ${38 + d}`} fill="none" stroke="var(--accent)" strokeWidth="1.6" />)}
          </g>
          <text x="766" y="484" textAnchor="middle" className="dg-s" style={{ fill: "var(--accent-ink)", fontSize: 12 }}>Databricks</text>
          <text x="510" y="62" textAnchor="middle" className="dg-g" style={{ fill: "var(--navy)", fontSize: 12 }}>AGENTES · LOS NUEVOS CONSUMIDORES DE DATOS</text>
        </svg>
      </div>
    </figure>
  )
}
