"""Apply the Sep 30 priority meeting (Benji + Óscar) to the seed documents."""
import json, pathlib
out = pathlib.Path(__file__).parent
def load(c, i): return json.load(open(out / c / f"{i}.json"))
def save(c, i, d): json.dump(d, open(out / c / f"{i}.json", "w"), ensure_ascii=False, indent=1)

# Components
c = load("components", "azure"); c.update(name="Cuenta admin de Azure", owner="IT · Luis Carlos", key=True,
  note="Bloqueador principal. Desbloquea Databricks, Entra ID, Key Vault y el marketplace de agentes; luego conexiones a SharePoint y JD Edwards."); save("components", "azure", c)
c = load("components", "github"); c.update(name="GitHub empresarial", note="Código solo en repositorios privados. Mientras tanto, GitHub personal privado y luego se migra."); save("components", "github", c)
c = load("components", "n8n"); c.update(note="Con la salida de Jorge se pierde su instancia local: independizar portal y flujos."); save("components", "n8n", c)
c = load("components", "orquestacion"); c.update(name="Orquestación y agentes: Temporal + LangGraph", note="Cuenta Temporal pay-as-you-go por abrir."); save("components", "orquestacion", c)
c = load("components", "controles"); c.update(owner="Alexandra · Benji"); save("components", "controles", c)

# Priorities (meeting of Sep 30)
order = {"avon": (1, 1), "mundos": (2, 1), "contraloria": (3, 1), "step": (4, 1), "gh": (5, 2), "lexy": (6, 2), "cerebro": (7, 2)}
for pid, (prio, wave) in order.items():
    p = load("projects", pid); p.update(priority=prio, wave=wave); save("projects", pid, p)

p = load("projects", "infra"); p.update(priority=0, wave=0, blocker="Cuenta admin de Azure con IT.", impactLabel="Habilita los 7 proyectos"); save("projects", "infra", p)

p = load("projects", "avon")
p.update(name="Avon · Kickoff y APT", tagline="Prioridad 1, acordada con Lisa",
  summary="Automatizar el kickoff de campaña: de la base de ventas a las tablas de KPIs sin extracción manual. Elimina 15 h de trabajo manual por campaña. Incluye el reemplazo de APT (Macro Revista y Leader List).",
  savings={"baseline": 15, "current": 15, "target": None, "unit": "h/campaña", "note": "Acordado con Lisa: el kickoff toma 15 h de trabajo manual por campaña. Meta por definir."})
p["pains"] = ["El kickoff de cada campaña toma 15 h de trabajo manual."] + p["pains"]
save("projects", "avon", p)

p = load("projects", "mundos"); p.update(noAzure=True, blocker="Salida de Jorge: su instancia local de n8n se pierde si no se independiza.")
p["pains"] = ["Con la salida de Jorge se pierde su instancia local de n8n."] + p["pains"]; save("projects", "mundos", p)

p = load("projects", "contraloria"); p["pains"] = ["Contratos vencen por falta de ejecución."] + p["pains"]; save("projects", "contraloria", p)
p = load("projects", "step"); p.update(noAzure=True); save("projects", "step", p)
p = load("projects", "lexy"); p.update(tagline="Menos urgente según prioridad del 30 sep"); save("projects", "lexy", p)

save("projects", "protocolos", dict(priority=0.5, wave=0, bu="Nexo", enabler=True, noAzure=True, paused=False,
  name="Protocolos de IA", sponsor="Benji (ciberseguridad) · Óscar", tagline="Estándares por tier de usuario",
  impactLabel="Uso seguro para todos los usuarios", phase="habilitacion",
  summary="Estándares y buenas prácticas por tier: Tier 1 usa Claude como chat, Tier 2 despliega portales y páginas estáticas con Claude Code, Tier 3 despliega agentes propios (no es prioridad inmediata).",
  pains=["Usuarios ya crean soluciones con Claude sin documentación ni estándar.", "Riesgo con API keys, secrets y archivos .env.", "El código no debe quedar en repositorios públicos.", "Todo el despliegue no puede centralizarse en el líder de IA."],
  needs=["github", "controles"], blocker="",
  discovery=[{"label": "Definir protocolos de ciberseguridad con Benji", "due": None, "done": False},
             {"label": "Estándares Tier 1: seguridad, settings recomendados, conectores y plugins", "due": None, "done": False},
             {"label": "Estándares Tier 2: portal de Diego Villatoro, GitHub privado, inner source", "due": None, "done": False},
             {"label": "Publicar protocolos en GitHub personal y migrar al empresarial", "due": None, "done": False},
             {"label": "Modelo escalable de despliegue de agentes: sandbox, portal y guía", "due": None, "done": False}],
  kpis=[{"id": "tier1", "name": "Usuarios Tier 1 con protocolo aplicado", "unit": "", "baseline": 0, "target": None, "current": 0, "updated": "2026-09-30", "note": ""},
        {"id": "tier2", "name": "Portales Tier 2 en el portal corporativo", "unit": "", "baseline": 0, "target": None, "current": 0, "updated": "2026-09-30", "note": "Requiere Entra ID."}],
  savings={}, next="Reunión con Benji para definir protocolos."))

save("updates", "u-0930-prio", {"projectId": "infra", "date": "2026-09-30", "tag": "Decisión", "kpiId": None, "value": None, "createdAt": "2026-09-30T18:30:00Z",
  "text": "Con Benji y Óscar se fijó el orden: 1) kickoff de Avon, 2) Portal de Mundos y n8n, 3) Contraloría, 4) STEP, 5) MegaMás vacaciones, 6) MegaMás Soporte IT. La cuenta admin de Azure es el bloqueador principal."})
save("updates", "u-0930-avon", {"projectId": "avon", "date": "2026-09-30", "tag": "Hito", "kpiId": None, "value": None, "createdAt": "2026-09-30T18:31:00Z",
  "text": "Prioridad 1 acordada con Lisa: automatizar el kickoff elimina 15 h de trabajo manual por campaña."})
save("updates", "u-0930-proto", {"projectId": "protocolos", "date": "2026-09-30", "tag": "Decisión", "kpiId": None, "value": None, "createdAt": "2026-09-30T18:32:00Z",
  "text": "Se definieron tres tiers de usuarios de IA. Se avanza sin Azure: protocolos Tier 1 y Tier 2 en GitHub personal, luego se migran al empresarial."})
print("ok")
