import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { cleanDoc, docTabs, DOC_URL, type DocTab } from "@/lib/metodologia"

/** Reads a project's methodology doc here: one tab at a time, the VSM countries grouped under one pill. */
export function DocReader({ project, only, start }: { project: string; only?: string[]; start?: string }) {
  const tabs = docTabs(project).filter((t) => !only || only.includes(t.slug))
  const [slug, setSlug] = useState(start && tabs.some((t) => t.slug === start) ? start : tabs[0]?.slug)
  const cur = tabs.find((t) => t.slug === slug) || tabs[0]
  const html = useMemo(() => (cur ? cleanDoc(cur.html) : ""), [cur])
  if (!cur) return null
  const groups: (DocTab | { group: string; items: DocTab[] })[] = []
  tabs.forEach((t) => {
    if (!t.group) return groups.push(t)
    const g = groups.find((x) => "items" in x && x.group === t.group) as { group: string; items: DocTab[] } | undefined
    if (g) g.items.push(t); else groups.push({ group: t.group, items: [t] })
  })
  const pill = (active: boolean) => cn("whitespace-nowrap rounded-full border-0 px-3 py-[6px] text-[13px] font-medium", active ? "bg-text text-bg" : "bg-group text-sub hover:text-text")
  return (
    <div className="grid min-w-0 gap-3">
      {tabs.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Pestañas del documento">
          {groups.map((g) => "items" in g ? (
            <span key={g.group} className="flex flex-wrap items-center gap-1 rounded-full bg-group/60 py-0.5 pl-3 pr-0.5">
              <span className="text-xs text-faint">{g.group}</span>
              {g.items.map((t) => <button key={t.slug} type="button" role="tab" aria-selected={t.slug === cur.slug} onClick={() => setSlug(t.slug)} className={pill(t.slug === cur.slug)}>{t.label}</button>)}
            </span>
          ) : <button key={g.slug} type="button" role="tab" aria-selected={g.slug === cur.slug} onClick={() => setSlug(g.slug)} className={pill(g.slug === cur.slug)}>{g.label}</button>)}
          {DOC_URL[project] && <a href={DOC_URL[project]} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs font-medium text-accent-ink hover:underline">Abrir el documento en Claude ↗</a>}
        </div>
      )}
      <article className="mdoc group-box min-w-0 px-7 py-6 max-sm:px-4" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
