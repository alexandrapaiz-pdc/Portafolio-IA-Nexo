/* Methodology documents copied from each project's Claude Doc (claude.ai pages can't be embedded).
   Each tab is exported as HTML to data/metodologia/<project>/<slug>.html and refreshed by re-exporting. */
const FILES = import.meta.glob("../data/metodologia/*/*.html", { query: "?raw", import: "default", eager: true }) as Record<string, string>

export interface DocTab { slug: string; label: string; group?: string; html: string }

// Reading order and names; a slug not listed here still shows, after these.
const ORDER: [string, string, string?][] = [
  ["metodologia", "Metodología"], ["vap", "VAP"], ["task-register", "Task Register"],
  ["vsm-gt", "Guatemala", "VSM por país"], ["vsm-sv", "El Salvador", "VSM por país"], ["vsm-hn", "Honduras", "VSM por país"],
  ["vsm-ni", "Nicaragua", "VSM por país"], ["vsm-pa", "Panamá", "VSM por país"], ["vsm-do", "Rep. Dominicana", "VSM por país"],
  ["inventario", "Inventario de sistemas"], ["eval-set", "Eval set y guardrails"], ["contrato", "Contrato de éxito"], ["portal-plan", "Plan del portal"],
]

/** Link to the source doc per project, for "abrir en Claude". */
export const DOC_URL: Record<string, string> = { regulatorio: "https://claude.ai/artifact/StKwkdfZDz4R4KBcpT3EgL" }

// People mentioned in the docs appear as ids; known ids get their name.
const PEOPLE: Record<string, string> = { u_gy3dGkozKAHmoYWwdKyikg: "Alexandra Paiz" }

export function docTabs(project: string): DocTab[] {
  const tabs = Object.entries(FILES)
    .filter(([path]) => path.split("/").at(-2) === project)
    .map(([path, html]) => { const slug = path.split("/").at(-1)!.replace(/\.html$/, ""); const o = ORDER.find((x) => x[0] === slug); return { slug, label: o?.[1] || slug, group: o?.[2], html } })
  const rank = (s: string) => { const i = ORDER.findIndex((x) => x[0] === s); return i < 0 ? 99 : i }
  return tabs.sort((a, b) => rank(a.slug) - rank(b.slug))
}
export const hasDocs = (project: string) => docTabs(project).length > 0

/** Make exported doc HTML safe and readable here: no scripts or handlers, links open outside,
    photos (stored in the doc) become a note, mentions become names. */
export function cleanDoc(html: string): string {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html")
  const root = doc.body.firstElementChild as HTMLElement
  root.querySelectorAll("script, style, iframe, object, embed, form, link, meta").forEach((n) => n.remove())
  root.querySelectorAll("*").forEach((el) => {
    for (const a of [...el.attributes]) if (/^on/i.test(a.name) || (a.name === "href" && /^\s*javascript:/i.test(a.value))) el.removeAttribute(a.name)
  })
  root.querySelectorAll("a[href]").forEach((a) => { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener noreferrer") })
  root.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || ""
    if (/^https:\/\//.test(src)) return
    const note = doc.createElement("span"); note.className = "mdoc-photo"; note.textContent = `Foto en el documento: ${img.getAttribute("alt") || "imagen"}`
    img.replaceWith(note)
  })
  root.querySelectorAll("[data-atom=mention]").forEach((m) => { m.textContent = PEOPLE[m.getAttribute("data-principal") || ""] || "una persona del equipo" })
  root.querySelectorAll("table").forEach((t) => { const w = doc.createElement("div"); w.className = "mdoc-table"; t.replaceWith(w); w.appendChild(t) })
  return root.innerHTML
}
