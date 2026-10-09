"""Pruebas contra un PostgreSQL de verdad (variables PG*), en un esquema temporal.

    PGHOST=... PGPORT=... PGUSER=... PGDATABASE=... python -m pytest -q api/tests
"""
import base64
import json
import os
import secrets

import psycopg
import pytest

ESQUEMA = "prueba_" + secrets.token_hex(4)
os.environ["DB_SCHEMA"] = ESQUEMA
os.environ["NEXO_EDITORES"] = "editora@grupopdc.com"
os.environ.pop("DEV_USUARIO", None)
os.environ.pop("NEXO_CORREO_ACTIVO", None)  # las pruebas nunca envían correo real

from fastapi.testclient import TestClient  # noqa: E402

from app import conexion  # noqa: E402
from app.main import app, migrar  # noqa: E402

OID = "http://schemas.microsoft.com/identity/claims/objectidentifier"


def principal(correo: str, oid: str, nombre: str) -> dict:
    claims = [{"typ": OID, "val": oid}, {"typ": "preferred_username", "val": correo}, {"typ": "name", "val": nombre}]
    valor = base64.b64encode(json.dumps({"auth_typ": "aad", "claims": claims}).encode()).decode()
    return {"X-MS-CLIENT-PRINCIPAL": valor}


EDITORA = principal("editora@grupopdc.com", "oid-editora", "Ana Editora")
PERSONA = principal("persona@grupopdc.com", "oid-persona", "Luis Persona")

SOLICITUD = {
    "code": "SOL-1007-AB", "title": "Conciliar facturas", "area": "Nexo", "type": "Automatización o agente",
    "urgency": "Media", "problem": "Se hace a mano cada mes", "current": "Excel", "hours": 20, "people": 3,
    "impact": "Cerrar 3 días antes", "systems": "JDE, Excel",
}


@pytest.fixture(scope="module")
def cliente():
    with psycopg.connect(autocommit=True) as con:
        con.execute(f"CREATE SCHEMA {ESQUEMA}")
    with TestClient(app) as c:
        yield c
    conexion.cerrar()
    with psycopg.connect(autocommit=True) as con:
        con.execute(f"DROP SCHEMA {ESQUEMA} CASCADE")


def sql(q: str, *args):
    with psycopg.connect() as con:
        con.execute(f"SET search_path TO {ESQUEMA}")
        return con.execute(q, args).fetchall()


def test_salud_sin_sesion(cliente):
    assert cliente.get("/salud").json() == {"estado": "ok"}


def test_sin_identidad_es_401(cliente):
    assert cliente.get("/api/c/projects").status_code == 401
    assert cliente.get("/api/yo", headers={"X-MS-CLIENT-PRINCIPAL": "no-es-base64!"}).status_code == 401


def test_yo_y_editor(cliente):
    assert cliente.get("/api/yo", headers=EDITORA).json()["editor"] is True
    yo = cliente.get("/api/yo", headers=PERSONA).json()
    assert yo == {"id": "oid-persona", "nombre": "Luis Persona", "correo": "persona@grupopdc.com", "editor": False}


def test_documentos_reglas_version_e_historial(cliente):
    assert cliente.put("/api/c/projects/avon", json={"name": "AVON"}, headers=PERSONA).status_code == 403
    assert cliente.put("/api/c/projects/avon", json={"name": "AVON", "phase": "piloto"}, headers=EDITORA).status_code == 200
    assert cliente.patch("/api/c/projects/avon", json={"phase": "produccion"}, headers=EDITORA).status_code == 200
    doc = cliente.get("/api/c/projects/avon", headers=PERSONA).json()
    assert doc["datos"] == {"name": "AVON", "phase": "produccion"}
    assert sql("SELECT version FROM documentos WHERE id = 'avon'") == [(2,)]
    assert [a for (a,) in sql("SELECT accion FROM historial WHERE doc_id = 'avon' ORDER BY id")] == ["crear", "actualizar"]
    assert cliente.patch("/api/c/projects/no-existe", json={"x": 1}, headers=EDITORA).status_code == 404


def test_desde_evita_descargas_sin_cambios(cliente):
    r = cliente.get("/api/c/components", headers=PERSONA).json()
    assert cliente.get(f"/api/c/components?desde={r['seq']}", headers=PERSONA).json()["sin_cambios"] is True
    cliente.put("/api/c/components/azure", json={"name": "Azure", "status": "listo"}, headers=EDITORA)
    r2 = cliente.get(f"/api/c/components?desde={r['seq']}", headers=PERSONA).json()
    assert [d["id"] for d in r2["docs"]] == ["azure"]


def test_cualquiera_envia_solicitud_y_el_servidor_sella(cliente):
    falsa = {**SOLICITUD, "createdBy": "otra-persona", "createdAt": "2020-01-01T00:00:00Z"}
    r = cliente.post("/api/c/tickets", json=falsa, headers=PERSONA)
    assert r.status_code == 200, r.text
    doc = cliente.get(f"/api/c/tickets/{r.json()['id']}", headers=PERSONA).json()["datos"]
    assert doc["createdBy"] == "oid-persona"
    assert not doc["createdAt"].startswith("2020")
    assert doc["hours"] == 20 and doc["title"] == "Conciliar facturas"
    # Se guarda en columnas reales, listas para reportes.
    assert sql("SELECT codigo, mundo, urgencia, horas_mes, personas, creado_por FROM solicitudes") == [
        ("SOL-1007-AB", "Nexo", "Media", 20, 3, "oid-persona")]


def test_solicitud_invalida_no_se_guarda(cliente):
    for malo in ({"urgency": "Urgente"}, {"hours": -1}, {"title": ""}, {"area": "Marte"}, {"extra": "x"}):
        r = cliente.post("/api/c/tickets", json={**SOLICITUD, "code": "SOL-1007-ZZ", **malo}, headers=PERSONA)
        assert r.status_code == 422, (malo, r.text)
    assert sql("SELECT count(*) FROM solicitudes WHERE codigo = 'SOL-1007-ZZ'") == [(0,)]
    assert cliente.post("/api/c/tickets", json=SOLICITUD, headers=PERSONA).status_code == 409  # código repetido


def test_solo_editores_cambian_o_borran_solicitudes(cliente):
    tid = cliente.post("/api/c/tickets", json={**SOLICITUD, "code": "SOL-1007-CD"}, headers=PERSONA).json()["id"]
    assert cliente.patch(f"/api/c/tickets/{tid}", json={"title": "Otra"}, headers=PERSONA).status_code == 403
    assert cliente.delete(f"/api/c/tickets/{tid}", headers=PERSONA).status_code == 403
    # La editora corrige el título; quién la envió no cambia aunque lo intente.
    assert cliente.patch(f"/api/c/tickets/{tid}", json={"title": "Corregido", "createdBy": "x"}, headers=EDITORA).status_code == 200
    doc = cliente.get(f"/api/c/tickets/{tid}", headers=PERSONA).json()["datos"]
    assert doc["title"] == "Corregido" and doc["createdBy"] == "oid-persona"
    assert cliente.put(f"/api/c/triage/{tid}", json={"status": "evaluacion", "priority": 2}, headers=EDITORA).status_code == 200
    assert cliente.delete(f"/api/c/tickets/{tid}", headers=EDITORA).status_code == 200
    ids = [d["id"] for d in cliente.get("/api/c/tickets", headers=PERSONA).json()["docs"]]
    assert tid not in ids
    assert sql("SELECT eliminado FROM solicitudes WHERE id = %s", tid) == [(True,)]  # borrado lógico


def test_orden_y_limite(cliente):
    cliente.post("/api/c/tickets", json={**SOLICITUD, "code": "SOL-1007-EF"}, headers=PERSONA)
    docs = cliente.get("/api/c/tickets?orden=createdAt&sentido=desc&limite=1", headers=PERSONA).json()["docs"]
    assert len(docs) == 1 and docs[0]["datos"]["code"] == "SOL-1007-EF"
    assert cliente.get("/api/c/tickets?orden=columna_rara", headers=PERSONA).status_code == 400


def test_personas(cliente):
    cliente.get("/api/yo", headers=PERSONA)
    r = cliente.post("/api/personas", json={"ids": ["oid-persona", "no-existe"]}, headers=EDITORA).json()
    assert r == {"oid-persona": {"name": "Luis Persona"}}


def test_importar_solo_editores(cliente):
    carga = {"colecciones": {"updates": {"u-1": {"projectId": "avon", "date": "2026-10-01", "text": "Avance"}},
                             "asanaMeta": {"sync": {"syncedAt": "2026-10-06T00:00:00Z"}}}}
    assert cliente.post("/api/importar", json=carga, headers=PERSONA).status_code == 403
    assert cliente.post("/api/importar", json=carga, headers=EDITORA).json() == {"importados": {"updates": 1, "asanaMeta": 1}}
    assert cliente.get("/api/c/asanaMeta/sync", headers=PERSONA).json()["datos"]["syncedAt"].startswith("2026-10-06")


def test_asana_sin_token(cliente):
    os.environ.pop("ASANA_TOKEN", None)
    assert cliente.post("/api/asana/tarea", json={"task_id": "123"}, headers=PERSONA).status_code == 403
    r = cliente.post("/api/asana/tarea", json={"task_id": "123"}, headers=EDITORA)
    assert r.status_code == 503 and r.json()["detail"]["codigo"] == "no_configurado"


def test_coleccion_desconocida(cliente):
    assert cliente.get("/api/c/secretos", headers=EDITORA).status_code == 404


def test_migraciones_no_se_repiten(cliente):
    assert migrar() == []


def test_conexion_con_token_de_entra(cliente, monkeypatch):
    """En Azure la contraseña es un token de Entra pedido al conectar (aquí, simulado)."""
    pedidos = []
    monkeypatch.setattr(conexion, "_token_entra", lambda: pedidos.append(1) or "token-de-prueba")
    monkeypatch.setenv("NEXO_PG_ENTRA", "1")
    conexion.cerrar()
    try:
        assert cliente.get("/api/yo", headers=EDITORA).status_code == 200
        assert pedidos, "no se pidió token al abrir la conexión"
    finally:
        monkeypatch.delenv("NEXO_PG_ENTRA")
        conexion.cerrar()


def test_correo_encolado_una_vez_con_identidad_real(cliente):
    carga = {**SOLICITUD, 'code': 'SOL-EMAIL-1', 'createdBy': 'atacante', 'createdAt': '2020-01-01T00:00:00Z'}
    r = cliente.put('/api/c/tickets/email-1', json=carga, headers=PERSONA)
    assert r.status_code == 200
    assert sql('SELECT destinatario, nombre, estado FROM correos_solicitudes WHERE solicitud_id = %s', 'email-1') == [
        ('persona@grupopdc.com', 'Luis Persona', 'pendiente')]
    assert cliente.patch('/api/c/tickets/email-1', json={'title': 'Corregida'}, headers=EDITORA).status_code == 200
    assert cliente.put('/api/c/tickets/email-1', json=carga, headers=EDITORA).status_code == 200
    assert sql('SELECT count(*) FROM correos_solicitudes WHERE solicitud_id = %s', 'email-1') == [(1,)]
    # Un rechazo por validación o código duplicado tampoco encola.
    assert cliente.put('/api/c/tickets/email-malo', json={**carga, 'hours': -1}, headers=PERSONA).status_code == 422
    assert cliente.put('/api/c/tickets/email-duplicado', json=carga, headers=PERSONA).status_code == 409
    assert sql("SELECT count(*) FROM correos_solicitudes WHERE solicitud_id IN ('email-malo', 'email-duplicado')") == [(0,)]


def test_importar_no_manda_correos(cliente):
    datos = {**SOLICITUD, 'code': 'SOL-EMAIL-IMPORT', 'createdBy': 'historico', 'createdAt': '2026-01-01T00:00:00Z'}
    assert cliente.post('/api/importar', json={'colecciones': {'tickets': {'historico': datos}}}, headers=EDITORA).status_code == 200
    assert sql("SELECT count(*) FROM correos_solicitudes WHERE solicitud_id = 'historico'") == [(0,)]


def test_correo_rollback_si_falla_encolado(cliente, monkeypatch):
    from app import correos
    def falla(*args):
        raise RuntimeError('simulada')
    monkeypatch.setattr(correos, 'encolar', falla)
    with pytest.raises(RuntimeError, match='simulada'):
        cliente.post('/api/c/tickets', json={**SOLICITUD, 'code': 'SOL-EMAIL-ROLLBACK'}, headers=PERSONA)
    assert sql("SELECT count(*) FROM solicitudes WHERE codigo = 'SOL-EMAIL-ROLLBACK'") == [(0,)]


def test_entrega_reintentos_y_permisos(cliente, monkeypatch):
    from app import correos
    from concurrent.futures import ThreadPoolExecutor
    import time
    # Aislar la cola de esta prueba sin enviar los tickets de otras pruebas.
    sql("UPDATE correos_solicitudes SET proximo_intento = now() + interval '1 day' RETURNING solicitud_id")
    cliente.put('/api/c/tickets/email-worker', json={**SOLICITUD, 'code': 'SOL-EMAIL-WORKER'}, headers=PERSONA)
    def falla(*args):
        raise correos.ErrorEnvio('graph_503')
    monkeypatch.setattr(correos, 'enviar', falla)
    assert correos.procesar_uno('remitente@example.com')
    assert sql("SELECT estado, intentos, ultimo_error, proximo_intento > now() FROM correos_solicitudes WHERE solicitud_id = 'email-worker'") == [
        ('pendiente', 1, 'graph_503', True)]
    assert not correos.procesar_uno('remitente@example.com')
    sql("UPDATE correos_solicitudes SET intentos = 4, proximo_intento = now() WHERE solicitud_id = 'email-worker' RETURNING solicitud_id")
    assert correos.procesar_uno('remitente@example.com')
    assert sql("SELECT estado, intentos FROM correos_solicitudes WHERE solicitud_id = 'email-worker'") == [('fallido', 5)]
    assert cliente.get('/api/solicitudes/correos', headers=PERSONA).status_code == 403
    assert cliente.post('/api/solicitudes/correos/email-worker/reintentar', headers=PERSONA).status_code == 403
    assert cliente.post('/api/solicitudes/correos/email-worker/reintentar', headers=EDITORA).status_code == 200
    enviados = []
    def exito(*args):
        time.sleep(.1)
        enviados.append(args)
    monkeypatch.setattr(correos, 'enviar', exito)
    # Dos réplicas concurrentes: solo una toma la fila.
    with ThreadPoolExecutor(2) as ex:
        resultados = list(ex.map(correos.procesar_uno, ['remitente@example.com'] * 2))
    assert sorted(resultados) == [False, True]
    assert len(enviados) == 1 and enviados[0][1] == 'persona@grupopdc.com'
    assert sql("SELECT estado, aceptado_en IS NOT NULL FROM correos_solicitudes WHERE solicitud_id = 'email-worker'") == [('aceptado', True)]
    assert not correos.procesar_uno('remitente@example.com')
    assert cliente.post('/api/solicitudes/correos/email-worker/reintentar', headers=EDITORA).status_code == 409
    assert cliente.get('/api/solicitudes/correos', headers=EDITORA).status_code == 200


def test_formulario_descargable_con_sesion(cliente):
    assert cliente.get('/api/solicitudes/formulario').status_code == 401
    r = cliente.get('/api/solicitudes/formulario', headers=PERSONA)
    assert r.status_code == 200
    assert r.content.startswith(b'PK')
    assert 'Guia-workflow-IA.docx' in r.headers['content-disposition']
