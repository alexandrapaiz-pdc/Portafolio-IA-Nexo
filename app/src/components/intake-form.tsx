import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStore } from "@/lib/store"

const QUESTIONS = [
  ["materials", "1. Materiales que ya tienes", "Comparte enlaces a presentaciones, diagramas, documentos o ejemplos. No hace falta preparar nada nuevo."],
  ["process", "2. Área y proceso", "Unidad de negocio, área y país o canal. ¿Para qué sirve el proceso? Describe sus grandes etapas o comparte el flujograma macro."],
  ["workflow", "3. La parte que queremos mejorar", "¿Qué inicia el workflow y cuándo termina? ¿Qué se atasca? Da un ejemplo reciente y explica qué debería mejorar."],
  ["steps", "4. Cómo se hace hoy", "Recorre un caso: pasos, personas, sistemas, decisiones, excepciones y aprobaciones. Si tienes un flujograma micro, comparte su enlace."],
  ["sources", "Fuentes y accesos por paso", "Para cada paso: información que necesita, fuente concreta y dónde queda el resultado. Por fuente: quién tiene acceso, quién autoriza, quién lo habilita y si se necesita leer o escribir. No incluyas contraseñas ni claves."],
  ["time", "Dónde se va el tiempo", "Indica tipo de caso, periodo y casos observados. Por paso: tiempo activo, espera, minutos-persona y qué se atasca o repite. Usa minutos por caso; no sumes duraciones que se superponen."],
  ["metrics", "5. Qué vamos a medir", "Volumen mensual, esfuerzo por caso, horas-persona al mes, duración, espera y errores. Para cada métrica: valor actual, unidad, periodo, meta y fuente (medido, estimado o por medir). Elige hasta 3 KPIs con responsable y fecha."],
  ["followup", "6. Seguimiento del proyecto", "Nombre, responsable, etapa actual, próximo hito y fecha. Indica bloqueos y quién puede resolverlos."],
  ["contacts", "7. Contactos", "Nombre, función y contacto de quienes coordinan, hacen el trabajo, aprueban cambios y autorizan o habilitan accesos. Si falta alguien, indica por identificar."],
  ["sharepoint", "8. Carpeta de SharePoint", "Enlace a la carpeta completa del workflow y contacto para habilitar lectura y descarga. No hace falta reorganizarla. Trabajaremos con copias, sin modificar los originales."],
] as const

type Answers = Partial<Record<(typeof QUESTIONS)[number][0], string>>

export function IntakeForm({ id, editable }: { id: string; editable: boolean }) {
  const { db } = useStore()
  const [answers, setAnswers] = useState<Answers>({})
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [loadError, setLoadError] = useState(false)
  useEffect(() => {
    if (!db) return
    let initialized = false
    return db.doc("intakes/" + id).onSnapshot((snap: { exists: boolean; data: () => { answers?: Answers } }) => {
      // Later polling must not overwrite a response the user is still writing.
      if (initialized) return
      initialized = true
      setAnswers(snap.exists ? snap.data().answers || {} : {})
      setLoaded(true)
      setLoadError(false)
    }, () => setLoadError(true))
  }, [db, id])
  return <section className="grid gap-5" aria-label="Formulario de intake">
    <div className="grid gap-2"><h2 className="text-3xl font-medium tracking-tight">Formulario de intake</h2><p className="text-sub">Todos los campos son opcionales. Completa lo que tengas y guarda tu avance; puedes volver desde el detalle de tu solicitud.</p></div>
    <p className="rounded-xl bg-group p-4 text-sm text-sub">Puedes usar IA para redactar a partir de tus notas. Revisa las respuestas antes de guardarlas. Si un dato falta, escribe «por definir» o déjalo vacío.</p>
    {import.meta.env.MODE === "nexo" && <a href="/api/solicitudes/formulario" className="text-sm text-accent-ink underline">Descargar la guía completa en Word</a>}
    {!loaded ? <p role="status">{loadError ? "No se pudo cargar el intake. Vuelve a abrir la solicitud para intentar de nuevo." : "Cargando formulario…"}</p> : <form className="grid gap-5" onSubmit={async e => {
      e.preventDefault()
      if (busy || !editable) return
      setBusy(true); setMessage("")
      try { await db.doc("intakes/" + id).set({ answers }); setMessage("Intake guardado. Puedes volver a completarlo cuando quieras.") }
      catch { setMessage("No se pudo guardar. Tus respuestas siguen aquí; intenta de nuevo.") }
      finally { setBusy(false) }
    }}>
      {QUESTIONS.map(([key, title, hint]) => <Label key={key} className="grid gap-2">{title}<span className="text-sm font-normal text-sub">{hint}</span><Textarea aria-label={title} maxLength={8000} rows={4} value={answers[key] || ""} readOnly={!editable} disabled={busy} onChange={e => { setAnswers(a => ({ ...a, [key]: e.target.value })); setMessage("") }} /></Label>)}
      <p role="status" className="text-sm text-sub">{message}</p>
      {editable && <Button type="submit" variant="accent" disabled={busy}>{busy ? "Guardando…" : "Guardar intake"}</Button>}
    </form>}
  </section>
}
