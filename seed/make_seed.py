"""Initial portfolio data (from Asana backlog + Granola meetings, Sep 2026). Writes one JSON per document."""
import json, pathlib
out = pathlib.Path(__file__).parent

components = [
 ("stack", 1, "Definición del stack (Azure como base)", "Alexandra", "en_curso", "Se acordó arrancar en Azure por integración con Microsoft, SharePoint y Entra ID."),
 ("azure", 2, "Suscripción Azure", "Luis Carlos", "pendiente", "Luis Carlos creará la suscripción."),
 ("github", 3, "GitHub corporativo", "Alexandra", "pendiente", "Repositorio y versionado estándar para todos los proyectos."),
 ("licencias", 4, "Licencias Claude", "Luisca", "en_curso", "Lista de solicitantes y alcance por definir; solicitud final 2 oct."),
 ("controles", 6, "Permisos Entra ID y controles de producción", "Alexandra · Benji", "pendiente", "Registro, políticas, escalamiento, bitácoras y revisión de ciberseguridad."),
 ("jde", 7, "Conector JD Edwards solo lectura (VPN)", "Vikingo · IT", "pendiente", "Vía ticket idea-to-launch con Vikingo."),
 ("datos", 8, "Capa de datos: Databricks · Postgres + pgvector", "Alexandra", "pendiente", "Responsable y calendario de Databricks por definir."),
 ("orquestacion", 9, "Orquestación y agentes: Temporal + LangGraph", "Alexandra", "pendiente", "Plantilla base para agentes formales."),
 ("dominio", 10, "Dominio del portal", "Luis Carlos · IT", "pendiente", "Dominio común para el portal de agentes y portales de mundos."),
]
for cid, order, name, owner, status, note in components:
    (out / "components").mkdir(exist_ok=True)
    json.dump({"order": order, "name": name, "owner": owner, "status": status, "note": note, "updated": "2026-09-30"},
              open(out / "components" / f"{cid}.json", "w"), ensure_ascii=False, indent=1)

def k(id, name, unit, baseline=None, target=None, current=None, note=""):
    return {"id": id, "name": name, "unit": unit, "baseline": baseline, "target": target, "current": current, "updated": "2026-09-30" if baseline is not None or current is not None else "", "note": note}
def d(label, due=None, done=False):
    return {"label": label, "due": due, "done": done}

ALL = [c[0] for c in components]
projects = {
 "infra": dict(priority=1, wave=1, bu="Nexo", name="Infraestructura IA Nexo", sponsor="Alexandra Paiz", tagline="Habilitador de todo el portafolio", enabler=True,
   phase="habilitacion", summary="Stack propio de Nexo, independiente de Vikingo AI, para estandarizar el despliegue de unos 10 proyectos de automatización. Soporte de Vikingo vía tickets idea-to-launch.",
   pains=["Cada equipo usa herramientas y licencias distintas, sin estándar.", "Se crean soluciones con Claude sin documentación ni controles antes de producción.", "El acceso a JD Edwards requiere VPN y debe ser solo lectura."],
   needs=ALL, blocker="Suscripción Azure pendiente (Luis Carlos).",
   discovery=[d("Definir componentes del stack", "2026-10-02"), d("Ticket(s) idea-to-launch con Vikingo: JDE, data warehouse, dominio", "2026-10-02"), d("Solicitud final de licencias Claude a Luisca", "2026-10-02"), d("Responsable y calendario de Databricks", "2026-10-06"), d("Plantilla del portal de agentes", "2026-10-07"), d("Vista consolidada de los proyectos para Óscar", "2026-10-08"), d("Modelo de controles y permisos", "2026-10-09")],
   kpis=[k("stack_projects", "Proyectos corriendo en el stack Nexo", "", 0, 10, 0), k("licenses", "Licencias Claude asignadas", "", note="Lista de solicitantes en consolidación."), k("prod_checklist", "Checklist de producción completado", "%", 0, 100, 0)],
   savings={}, next="Stack definido y ticket con Vikingo abierto — 2 oct."),
 "contraloria": dict(priority=2, wave=1, bu="MegaMás", name="MegaMás · Contraloría", sponsor="César Paz", tagline="Documentos, IVA y cuentas por pagar",
   phase="descubrimiento", summary="Agente de conciliación documental y registro en ERP (incluye retenciones) para el flujo de compras de inventario Tráfico → Contraloría → ERP.",
   pains=["Facturas antiguas vuelven gastos no deducibles y se pierde crédito de IVA.", "Facturas de hasta un año quedan en prepasivo sin registrarse como cuenta por pagar.", "2 de 3 agentes nacionales suspendieron servicio por falta de pago.", "Documentos de Tráfico se extravían: 130–140 reubicados, 40 aún sin ubicar; llegan en lotes de 200–400.", "Un proyecto previo de RPA con Becker se canceló."],
   needs=["stack", "azure", "github", "controles", "jde", "orquestacion", "licencias"], blocker="Acceso a la vista de liquidaciones pendientes y a la carpeta compartida de Tráfico.",
   discovery=[d("Acceso a vista de liquidaciones y carpeta de Tráfico", "2026-10-02"), d("Mapa del flujo documental y alcance del agente", "2026-10-06"), d("Línea base: IVA no deducible, pagos vencidos, documentos faltantes", "2026-10-07"), d("Canal único de recepción de documentos (quick win)", "2026-10-08"), d("Ficha del proyecto", "2026-10-09"), d("Especificación del agente de conciliación + ERP", "2026-10-09"), d("Mini-curso de Claude (30 min) para el equipo", "2026-10-09")],
   kpis=[k("iva", "IVA no deducible", "Q", note="Monto no disponible en la reunión; se mide en la línea base."), k("docs_missing", "Documentos de Tráfico sin ubicar", "", 40, 0, 40, "130–140 ya reubicados al 29 sep."), k("aged_invoices", "Facturas en prepasivo > 30 días", "", note="Algunas con hasta un año de antigüedad."), k("agents_suspended", "Agentes nacionales con servicio suspendido", "", 2, 0, 2, "2 de 3 suspendieron por falta de pago.")],
   savings={"note": "Horas de conciliación y registro manual: línea base pendiente."}, next="Línea base de IVA, pagos vencidos y documentos — 7 oct."),
 "avon": dict(priority=3, wave=1, bu="Avon", name="Avon · APT y planeación de campaña", sponsor="Planeación Avon", tagline="Reemplazo de APT y fase 2 de reingeniería",
   phase="descubrimiento", summary="El APT heredado se retiró; el reemplazo lee, valida y transforma el archivo de colores para generar Macro Revista y Leader List. La fase 2 automatiza la planeación: base de ventas → tablas de KPIs → estimación → precios.",
   pains=["Los datos de ventas se descargan por campaña y país y se consolidan a mano en Excel.", "APT perdió funciones de paginación y depende de macros externas.", "Children no tiene clasificación propia; se separa a mano.", "La planeación de una campaña toma 15–20 días."],
   needs=["stack", "azure", "github", "datos"], blocker="Confirmar Vikingo Planeación como fuente de datos To-Be.",
   discovery=[d("Feedback crítico de la nueva herramienta", "2026-09-30"), d("Presentación kickoff C7 y acceso a carpetas de categoría", "2026-09-30"), d("Confirmar Vikingo Planeación como fuente To-Be", "2026-10-05"), d("Base histórica de campañas", "2026-10-06"), d("Mapa del proceso de planeación de 15 pasos", "2026-10-07"), d("Alcance de automatización Excel → KPIs (sprint de 7 semanas)", "2026-10-08"), d("Diseño To-Be de la reingeniería", "2026-10-09")],
   kpis=[k("cycle", "Ciclo de planeación por campaña", "días", 20, note="Hoy 15–20 días; meta por definir."), k("excel_kpi", "Base Excel → tablas de KPIs", "h", 2, 0.1, 2, "Hoy “un par de horas” por corrida; meta en minutos."), k("leader_acc", "Precisión de Leader List automatizada", "%", None, 100, 96, "PoC: 95–98%. No es medida final de producción.")],
   savings={"note": "~300 h de trabajo manual en alcance (estimado, sin fuente verificada en reuniones). Convertir a h/mes al medir la línea base."}, next="Mapa de 15 pasos y alcance Excel → KPIs — 7–8 oct."),
 "mundos": dict(priority=4, wave=1, bu="Grupo PDC", name="Portal de Mundos", sponsor="Sergio", tagline="Tablero de gestión por mundo para el comité ejecutivo",
   phase="piloto", summary="Un tablero por mundo con métricas semanales y mensuales, cadenas de valor, proyectos clave, metas y proyecciones, para reemplazar las presentaciones del comité. Piloto: PDC Brands.",
   pains=["El comité ejecutivo revisa el desempeño con presentaciones armadas a mano.", "Excel es una fuente de datos frágil (se mantiene por gestión del cambio).", "Cada portal tiene su propio enlace; la privacidad por creador limita la vista de portal de portales."],
   needs=["stack", "azure", "github", "dominio", "controles"], blocker="",
   discovery=[d("Acceso de Alexandra al hosting"), d("Dominio propio con IT"), d("Arquitectura de largo plazo con Edgar")],
   kpis=[k("worlds", "Mundos publicados en el portal", "", 1, None, 1, "Piloto PDC Brands. Total de mundos por confirmar."), k("reviews", "Revisiones del comité hechas desde el portal", "", 0, None, 0), k("flows_owned", "Flujos del portal en stack propio", "%", 0, 100, 0)],
   savings={"note": "Horas de preparación de presentaciones por revisión: línea base pendiente."}, next="Dominio propio con IT y arquitectura de largo plazo con Edgar."),
 "lexy": dict(priority=5, wave=2, bu="MegaMás", name="MegaMás · Lexy / Soporte IT", sponsor="Jackeline Luna", tagline="Base de conocimiento para soporte",
   phase="descubrimiento", summary="Base de conocimiento de soporte IT para que los agentes resuelvan tickets sin buscar entre documentos. El más fácil de arrancar cuando exista la capa de datos.",
   pains=["Los tickets llegan por correo a OTRS: correos sin asunto crean tickets sin título y las respuestas generan duplicados.", "Se perdió el repositorio compartido anterior.", "SharePoint es difícil de buscar (“mil documentos”).", "La validación de Item Data de Avon (folleto vs. IDF) es 100% manual y toma días."],
   needs=["stack", "azure", "datos", "orquestacion", "licencias"], blocker="Capa de datos del stack.",
   discovery=[d("Inventario de contenido: SharePoint + exportación de OTRS", "2026-10-09"), d("Alcance de la base de conocimiento", "2026-10-12"), d("Alcance del agente de validación Item Data de Avon", "2026-10-19")],
   kpis=[k("dup_tickets", "Tickets duplicados o sin título por mes", ""), k("kb_resolved", "Tickets resueltos con la base de conocimiento", "%", 0, None, 0), k("item_data", "Validación de Item Data Avon", "días", note="Hoy toma días; meta: minutos.")],
   savings={"note": "Tiempo de búsqueda de los agentes de soporte: línea base pendiente."}, next="Inventario de contenido — 9 oct."),
 "gh": dict(priority=6, wave=2, bu="MegaMás", name="MegaMás · Portal Gestión Humana", sponsor="Luis Fernando Chang", tagline="Alertas de vacaciones acumuladas",
   phase="descubrimiento", summary="Portal y agente de alertas para que las vacaciones acumuladas no aparezcan hasta la liquidación. Caso de costo evitado.",
   pains=["Los días de vacaciones se acumulan sin controles ni alertas y solo se ven en la liquidación.", "Hay vacaciones tomadas sin reportar; los registros no cuadran con lo real.", "El portal debe llegar al 100% del personal, incluido quien no tiene correo corporativo.", "El manejo de vacaciones y el reporte de costo de personal son manuales y no estandarizados entre países."],
   needs=["stack", "azure", "datos", "orquestacion", "dominio", "controles"], blocker="Recibir insumos: SharePoint, Excel de vacaciones y línea base de liquidaciones 2026.",
   discovery=[d("Insumos: SharePoint, Excel de vacaciones, videos, liquidaciones 2026", "2026-10-01"), d("Análisis: casos críticos por país y dinero en riesgo", "2026-10-07"), d("Ficha del proyecto (costo evitado, 3 hipótesis Q4)", "2026-10-08"), d("Acceso al portal sin correo corporativo", "2026-10-12"), d("Diseño del agente de alertas y reportes a líderes y CAM", "2026-10-19")],
   kpis=[k("critical", "Casos críticos (> 2 periodos acumulados)", ""), k("payout", "Vacaciones pagadas en liquidaciones 2026", "Q", note="Luis Fernando obtiene la línea base de planilla."), k("days", "Días de vacaciones acumulados", "días"), k("coverage", "Personal con acceso al portal", "%", None, 100)],
   savings={"note": "Horas de reporte manual de vacaciones y costo de personal: línea base pendiente."}, next="Análisis de casos críticos — 7 oct."),
 "step": dict(priority=7, wave=2, bu="Nexo", name="Generación de Códigos STEP", sponsor="Rodny", tagline="Creación y validación de códigos por área",
   phase="descubrimiento", summary="Flujo de validación por etapas (Marca → Soporte de marcas → Inventarios → Ingeniería → Manufactura → Catálogos) para crear códigos en STEP sin redigitar.",
   pains=["Artículos listos en bodega no se pueden facturar por atributos mal configurados en JD Edwards.", "El gerente de marca copia un Excel anterior porque no domina los campos técnicos.", "Catálogos vuelve a ingresar los datos en el sistema.", "Errores como costeo incorrecto o producto manufacturado registrado como comprado."],
   needs=["stack", "azure", "datos", "jde"], blocker="Decisión de Databricks.",
   discovery=[d("Revisar documentación y PoC de Rodny", "2026-10-09"), d("Flujo de validación por área", "2026-10-09")],
   kpis=[k("errors", "Códigos con errores de configuración por mes", ""), k("blocked", "Artículos bloqueados para facturar", ""), k("impact", "Impacto económico por errores", "US$", 33000, 0, 33000, "Estimación muy preliminar del caso Ayudín 3X."), k("time", "Tiempo de creación de un código", "días")],
   savings={"note": "Horas de redigitación y reproceso: línea base pendiente."}, next="Flujo de validación por área — 9 oct."),
 "cerebro": dict(priority=8, wave=2, bu="Nexo", name="Cerebro PMO", sponsor="Sebas Xoy", tagline="Agentes para la gestión de proyectos",
   phase="descubrimiento", summary="Agentes de apoyo a la PMO. Se define el alcance con Sebas Xoy cuando la infraestructura y MegaMás estén en marcha.",
   pains=["Solo 44% de los proyectos va a tiempo; la PMO está en rojo.", "Se mezclan entregables de sprint, tareas del MVP y backlog.", "Metodología y hoja de ruta macro por alinear."],
   needs=["stack", "azure", "orquestacion", "licencias"], blocker="Definición del stack.",
   discovery=[d("Sesión de alcance con Sebas Xoy"), d("Ficha del proyecto")],
   kpis=[k("ontime", "Proyectos a tiempo", "%", 44, None, 44), k("pmo_hours", "Horas de reporte PMO por mes", "h")],
   savings={"note": "Horas de reporte PMO: línea base pendiente."}, next="Sesión de alcance con Sebas Xoy."),
}
(out / "projects").mkdir(exist_ok=True)
for pid, p in projects.items():
    p.setdefault("paused", False)
    json.dump(p, open(out / "projects" / f"{pid}.json", "w"), ensure_ascii=False, indent=1)

updates = [
 ("u-0929-infra", "infra", "2026-09-29", "Decisión", "Se acordó arrancar el stack en Azure por su integración con Microsoft, SharePoint y Entra ID."),
 ("u-0929-mundos", "mundos", "2026-09-29", "Avance", "Reunión de Portal de Mundos: el piloto PDC Brands se afina antes de replicar a otros mundos."),
 ("u-0929-contra", "contraloria", "2026-09-29", "Avance", "Kickoff con César Paz. 130–140 documentos de Tráfico reubicados; 40 siguen sin ubicar. 2 de 3 agentes nacionales suspendieron servicio por falta de pago."),
 ("u-0928-lexy", "lexy", "2026-09-28", "Avance", "Reunión con Jackeline Luna: los correos a OTRS generan tickets duplicados o sin título, y se perdió el repositorio de conocimiento anterior."),
 ("u-0924-step", "step", "2026-09-24", "Avance", "Reunión con Rodny: el caso Ayudín 3X se estima en ~US$33k (preliminar) por atributos mal configurados en JD Edwards."),
]
(out / "updates").mkdir(exist_ok=True)
for uid, pid, date, tag, text in updates:
    json.dump({"projectId": pid, "date": date, "tag": tag, "text": text, "kpiId": None, "value": None, "createdAt": date + "T12:00:00Z"},
              open(out / "updates" / f"{uid}.json", "w"), ensure_ascii=False, indent=1)
print("ok")
