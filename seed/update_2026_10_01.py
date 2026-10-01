"""Oct 1: add GitHub findings (APT, BestPracticesAI, SIGO IA, Company Brain) and stack components."""
import json, pathlib
out = pathlib.Path(__file__).parent / "patch_1001"
def w(name, d): json.dump(d, open(out / f"{name}.json", "w"), ensure_ascii=False, indent=1)

w("c_foundry", {"order": 11, "name": "Microsoft Foundry (modelos)", "owner": "IT · Alexandra", "status": "pendiente", "note": "Modelos servidos dentro de Azure; LiteLLM rutea hacia ellos.", "updated": "2026-10-01"})
w("c_containerapps", {"order": 12, "name": "Azure Container Apps: LiteLLM, Langfuse, Presidio y servidores MCP", "owner": "Alexandra", "status": "pendiente", "note": "Todo corre en contenedores; nada suelto en laptops ni servidores.", "updated": "2026-10-01"})
w("u_azure", {"note": "Bloqueador principal. Suscripción pdc-nexo-ai (East US 2). Desbloquea Databricks, Entra ID, Key Vault y el marketplace de agentes; luego SharePoint y JD Edwards.", "updated": "2026-10-01"})
w("u_datos", {"name": "Capa de datos: Databricks (Unity Catalog, Lakeflow) · Postgres + pgvector", "note": "Plan de datos de Company Brain en borrador (30 sep). JD Edwards entra por Lakeflow vía VPN, nunca directo.", "updated": "2026-10-01"})

avon = json.load(open("/tmp/claude-0/-home-user-sigoai/ee5ac11f-cd50-5b95-bdcc-9bc1c113fc14/scratchpad/live/projects/avon.json"))
d = avon.get("data", avon)
pains = ["APT se apaga a mediados de octubre de 2026 (fin del TSA con Natura); el script actual muere con él."] + d["pains"]
kpis = d["kpis"] + [{"id": "golden", "name": "Acierto del motor vs. corrida de referencia", "unit": "%", "baseline": 74.7, "target": None, "current": 74.7, "updated": "2026-09-20",
  "note": "Mínimo exigido por la suite dorada: 1,463 pares campo por campo, 16 pruebas en verde (20 sep)."}]
w("u_avon", {"phase": "construccion", "pains": pains, "kpis": kpis,
  "blocker": "Fecha dura: APT se apaga a mediados de octubre. Falta un machote real (.xlsb) de C17'26 para construir el lector.",
  "next": "Fundación del camino interino antes del apagado: lector del machote, salida para facturación y macro MOSTRO.",
  "summary": d["summary"] + " Sustituto agéntico en construcción (Python, LangGraph, MCP, Postgres): motor portado y validado contra la corrida de referencia de Denis Martínez."})

proto = json.load(open("/tmp/claude-0/-home-user-sigoai/ee5ac11f-cd50-5b95-bdcc-9bc1c113fc14/scratchpad/live/projects/protocolos.json"))
pd_ = proto.get("data", proto)
disc = pd_["discovery"]
for x in disc:
    if x["label"].startswith(("Estándares Tier 1", "Estándares Tier 2", "Publicar protocolos")): x["done"] = True
w("u_protocolos", {"phase": "construccion", "discovery": disc, "blocker": "Revisión de ciberseguridad con Benji: reglas de datos sensibles y retención de los complementos de Office.",
  "summary": "Repositorio BestPracticesAI con estándares por nivel: 1 · Usuario de Claude (activo), 2 · Constructor de apps (activo), 2.5 · Backends (en construcción), 3 · Agentes (en construcción). Incluye biblioteca de skills de Nexo y reglas base: agentes solo lectura, repos nunca públicos, sin secretos en código.",
  "next": "Cerrar las decisiones pendientes de Nivel 1 y 2 y la revisión de ciberseguridad."})

w("u_mundos", {"summary": "Un tablero por mundo para reemplazar las presentaciones del comité. Plantilla SIGO IA: un HTML autocontenido con 7 bloques (Métricos, Planeadores, Cadenas de Valor, Proyectos clave, Estructura, Metas y Bonos, Proyecciones Financieras), todos funcionales salvo dos sub-pestañas de Estructura. Hoy lee Excel vía n8n y Microsoft Graph. Piloto: PDC Brands."})

w("p_companybrain", {"priority": 0.7, "wave": 0, "bu": "Nexo", "enabler": True, "noAzure": False, "paused": False,
  "name": "Company Brain", "sponsor": "Alexandra Paiz", "tagline": "Capa de conocimiento para agentes y personas", "impactLabel": "Datos y vocabulario para 4 proyectos",
  "phase": "construccion",
  "summary": "La capa de conocimiento de Grupo PDC: 1) vocabulario y ontología (glosario y mapa organizacional en GitHub), 2) documentos en SharePoint consultados en vivo, 3) datos operativos (JD Edwards, STEP, ventas de Avon, Asana, Jira) y 4) productos de datos (KPIs y líneas base) en Databricks.",
  "pains": ["Los agentes no entienden el vocabulario de la empresa ni quién es quién.", "Los datos operativos viven dispersos y se descargan a mano en Excel.", "Cada KPI se calcula en varios lugares y no da el mismo número."],
  "needs": ["azure", "datos", "controles", "github"], "blocker": "Cuenta admin de Azure para crear el workspace de Databricks.",
  "discovery": [{"label": "Glosario y mapa organizacional en GitHub", "due": None, "done": True},
                {"label": "Plan de datos en Databricks (borrador)", "due": "2026-09-30", "done": True},
                {"label": "Revisión del plan con IT y ciberseguridad", "due": None, "done": False},
                {"label": "Cargar el esquema semantic desde el repositorio", "due": None, "done": False},
                {"label": "Primeros productos gold: Kickoff Avon, Portal de Mundos, Contraloría y STEP", "due": None, "done": False}],
  "kpis": [{"id": "sources", "name": "Fuentes del inventario cargadas en Databricks", "unit": "", "baseline": 0, "target": None, "current": 0, "updated": "2026-10-01", "note": "Ver inventario_fuentes.yaml en el repositorio."}],
  "savings": {}, "next": "Revisar el plan de datos con IT."})

U = [("u-0920-avon", "avon", "2026-09-20", "Hito", "Motor de APT portado y suite dorada en verde: 16 pruebas contra la corrida de referencia de Denis Martínez (1,463 pares). Validaciones V01–V15 con 35 pruebas en verde."),
     ("u-0930-brain", "companybrain", "2026-09-30", "Avance", "Borrador del plan de datos de Company Brain en Databricks: Unity Catalog con catálogos dev y prod. Lo justifican Kickoff Avon, Portal de Mundos, Contraloría y STEP."),
     ("u-1001-proto", "protocolos", "2026-10-01", "Avance", "BestPracticesAI con guías Nivel 1 y 2 activas; Nivel 2.5 (backends) y 3 (agentes) en construcción.")]
for uid, pid, date, tag, text in U:
    w(uid, {"projectId": pid, "date": date, "tag": tag, "text": text, "kpiId": None, "value": None, "createdAt": date + "T18:00:00Z"})
print("ok")
