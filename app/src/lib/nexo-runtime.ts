/* Runtime de Nexo: la misma forma que window.claude (db, user, mcp) de un artifact,
   pero contra la API de la app en Azure (/api). Así las vistas no cambian al salir
   del artifact: store.tsx elige este runtime cuando se compila con --mode nexo.

   - db: colecciones y documentos; los cambios de otras personas llegan por consulta
     cada pocos segundos (solo pide datos si algo cambió, con el número de cambio "seq").
   - user: identidad de Entra (la pone Container Apps) y permiso de edición.
   - mcp: solo la lectura de tareas de Asana, que hace el servidor con su propio token. */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any
type Snap = { docs: { id: string; data: () => Any }[] }
type DocSnap = { id: string; exists: boolean; data: () => Any }

const CADA_MS = 5000
const avisar = new EventTarget() // "cambio": algo se escribió desde esta pestaña

async function api(metodo: string, ruta: string, cuerpo?: unknown) {
  const r = await fetch(ruta, {
    method: metodo,
    headers: cuerpo === undefined ? undefined : { "Content-Type": "application/json" },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    credentials: "same-origin",
  })
  if (r.status === 401) { location.reload(); throw { code: "unauthenticated" } } // sesión vencida: Entra la renueva
  const datos = await r.json().catch(() => ({}))
  if (!r.ok) {
    const d = datos?.detail
    if (r.status === 403) throw { code: "invalid_argument", message: d }
    throw { code: d?.codigo || (r.status === 409 ? "conflicto" : r.status === 422 ? "invalido" : "error"), message: d?.mensaje || d }
  }
  return datos
}

async function escribir(metodo: string, ruta: string, cuerpo?: unknown) {
  const r = await api(metodo, ruta, cuerpo)
  avisar.dispatchEvent(new Event("cambio"))
  return r
}

/* Consulta periódica: llama a `pedir(seq)` y avisa solo cuando hay cambios. */
function suscribir(pedir: (desde: number | null) => Promise<Any>, alCambiar: (r: Any) => void, alFallar?: (e: unknown) => void) {
  let seq: number | null = null, vivo = true, fallos = 0, ocupado = false
  const tic = async () => {
    if (!vivo || ocupado || (document.hidden && seq !== null)) return
    ocupado = true
    try {
      const r = await pedir(seq)
      fallos = 0
      if (!r.sin_cambios) { seq = r.seq; alCambiar(r) }
    } catch (e) {
      if (++fallos === 3) alFallar?.(e) // avisa una vez, sigue intentando
    } finally { ocupado = false }
  }
  const ahora = () => { tic() }
  const t = window.setInterval(tic, CADA_MS)
  avisar.addEventListener("cambio", ahora)
  document.addEventListener("visibilitychange", ahora)
  tic()
  return () => { vivo = false; window.clearInterval(t); avisar.removeEventListener("cambio", ahora); document.removeEventListener("visibilitychange", ahora) }
}

const enc = encodeURIComponent

function consulta(col: string, orden?: string, sentido: "asc" | "desc" = "asc", limite = 500) {
  return {
    orderBy: (campo: string, dir: "asc" | "desc" = "asc") => consulta(col, campo, dir, limite),
    limit: (n: number) => consulta(col, orden, sentido, n),
    add: async (datos: Any) => ({ id: (await escribir("POST", `/api/c/${enc(col)}`, datos)).id }),
    onSnapshot: (cb: (s: Snap) => void, err?: (e: unknown) => void) => suscribir(
      (desde) => {
        const q = new URLSearchParams({ sentido, limite: String(limite) })
        if (orden) q.set("orden", orden)
        if (desde !== null) q.set("desde", String(desde))
        return api("GET", `/api/c/${enc(col)}?${q}`)
      },
      (r) => cb({ docs: r.docs.map((d: Any) => ({ id: d.id, data: () => d.datos })) }),
      err,
    ),
  }
}

function documento(ruta: string) {
  const [col, id] = ruta.split("/")
  const url = `/api/c/${enc(col)}/${enc(id)}`
  return {
    set: (datos: Any) => escribir("PUT", url, datos),
    update: (datos: Any) => escribir("PATCH", url, datos),
    delete: () => escribir("DELETE", url),
    onSnapshot: (cb: (s: DocSnap) => void, err?: (e: unknown) => void) => suscribir(
      (desde) => api("GET", desde === null ? url : `${url}?desde=${desde}`),
      (r) => cb({ id, exists: r.existe, data: () => r.datos }),
      err,
    ),
  }
}

let yo: Promise<{ id: string; nombre: string; correo: string; editor: boolean }> | null = null
const quienSoy = () => (yo ??= api("GET", "/api/yo"))

const db = { collection: (col: string) => consulta(col), doc: (ruta: string) => documento(ruta) }

const user = {
  id: async () => (await quienSoy()).id,
  canEdit: async () => (await quienSoy()).editor,
  profiles: (ids: string[]) => api("POST", "/api/personas", { ids }),
}

const mcp = {
  callTool: async (servidor: string, herramienta: string, args: Any) => {
    if (servidor !== "Asana" || herramienta !== "asana_get_task") throw { code: "not_in_manifest" }
    return api("POST", "/api/asana/tarea", { task_id: String(args.task_id), opt_fields: args.opt_fields || "" })
  },
}

export const nexoRuntime = { use: async (nombre: string) => ({ db, user, mcp } as Record<string, Any>)[nombre] ?? null }
