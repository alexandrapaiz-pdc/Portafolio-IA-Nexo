"""Servidor de la app: la página (React compilada) y su API de datos, en un solo contenedor.

La API imita la base de datos de un artifact de Claude (colecciones de documentos con
id), para que una app hecha como artifact pase a Azure cambiando una línea. Detrás,
cada colección se guarda como documentos o como tabla (ver colecciones.py).

Rutas:
  GET    /salud                       estado, sin sesión (para las sondas de Azure)
  GET    /api/yo                      quién soy y si soy editor
  POST   /api/personas                nombres a partir de ids
  GET    /api/c/{col}                 lista (orden, sentido, limite, desde)
  GET    /api/c/{col}/{id}            un documento (desde)
  POST   /api/c/{col}                 crear con id nuevo
  PUT    /api/c/{col}/{id}            crear o reemplazar
  PATCH  /api/c/{col}/{id}            cambiar algunos campos
  DELETE /api/c/{col}/{id}            borrado lógico
  POST   /api/importar                carga inicial (solo editores)
  POST   /api/asana/tarea             lee una tarea de Asana (solo editores, solo lectura)
"""
import hashlib
import os
import re
import secrets
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated, Literal

import httpx
from fastapi import Body, Depends, FastAPI, HTTPException, Query
from fastapi.responses import FileResponse, HTMLResponse
from psycopg import errors

from . import conexion, correos
from .almacen import Coleccion
from .colecciones import COLECCIONES
from .identidad import Persona, persona_actual

MIGRACIONES = Path(os.environ.get("MIGRACIONES", Path(__file__).resolve().parent.parent / "migraciones"))
PAGINA = Path(os.environ.get("PAGINA", Path(__file__).resolve().parents[2] / "app" / "dist" / "index.html"))
ID_VALIDO = re.compile(r"^[A-Za-z0-9_\-.~:@+]{1,200}$")


def migrar() -> list[str]:
    """Aplica las migraciones pendientes, en orden, una sola réplica a la vez."""
    aplicadas = []
    esquema = conexion.ESQUEMA
    candado = int.from_bytes(hashlib.sha256(esquema.encode()).digest()[:8], "big", signed=True)
    with conexion.pool().connection() as con:
        con.execute("SELECT pg_advisory_lock(%s)", (candado,))
        try:
            con.execute("CREATE TABLE IF NOT EXISTS migraciones (nombre text PRIMARY KEY, aplicada_en timestamptz NOT NULL DEFAULT now())")
            con.commit()
            hechas = {f[0] for f in con.execute("SELECT nombre FROM migraciones").fetchall()}
            for archivo in sorted(MIGRACIONES.glob("*.sql")):
                if archivo.name in hechas:
                    continue
                with con.transaction():
                    con.execute(archivo.read_text(encoding="utf-8"))
                    con.execute("INSERT INTO migraciones (nombre) VALUES (%s)", (archivo.name,))
                aplicadas.append(archivo.name)
        finally:
            con.execute("SELECT pg_advisory_unlock(%s)", (candado,))
            con.commit()
    return aplicadas


@asynccontextmanager
async def ciclo(app: FastAPI):
    migrar()
    entregas = correos.Entregas()
    entregas.iniciar()
    try:
        yield
    finally:
        await entregas.cerrar()
        conexion.cerrar()


app = FastAPI(title="Portafolio IA Nexo", lifespan=ciclo, docs_url=None, redoc_url=None)
Yo = Annotated[Persona, Depends(persona_actual)]


def coleccion(col: str) -> Coleccion:
    if col not in COLECCIONES:
        raise HTTPException(404, f"Colección desconocida: {col}")
    return COLECCIONES[col]


def validar_id(doc_id: str) -> str:
    if not ID_VALIDO.match(doc_id):
        raise HTTPException(400, "Id inválido")
    return doc_id


def recordar(cur, persona: Persona) -> None:
    cur.execute(
        """INSERT INTO personas (id, nombre, correo) VALUES (%s, %s, %s)
           ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, correo = EXCLUDED.correo, visto_en = now()""",
        (persona.id, persona.nombre, persona.correo),
    )


@app.get("/salud")
def salud():
    return {"estado": "ok"}


@app.get("/api/yo")
def yo(persona: Yo):
    with conexion.pool().connection() as con, con.cursor() as cur:
        recordar(cur, persona)
    return {"id": persona.id, "nombre": persona.nombre, "correo": persona.correo, "editor": persona.editor}


@app.post("/api/personas")
def personas(persona: Yo, ids: Annotated[list[str], Body(embed=True, max_length=200)]):
    with conexion.pool().connection() as con, con.cursor() as cur:
        cur.execute("SELECT id, nombre FROM personas WHERE id = ANY(%s)", (ids,))
        return {i: {"name": n} for i, n in cur.fetchall()}


@app.get("/api/c/{col}")
def listar(
    col: str, persona: Yo,
    orden: str | None = Query(None, max_length=64),
    sentido: Literal["asc", "desc"] = "asc",
    limite: int = Query(500, ge=1, le=1000),
    desde: int | None = None,
):
    c = coleccion(col)
    with conexion.pool().connection() as con, con.cursor() as cur:
        seq = c.ultimo_seq(cur)
        if desde is not None and desde >= seq:
            return {"seq": seq, "sin_cambios": True}
        docs = [{"id": i, "datos": d} for i, d in c.listar(cur, orden, sentido, limite)]
    return {"seq": seq, "docs": docs}


@app.get("/api/c/{col}/{doc_id}")
def obtener(col: str, doc_id: str, persona: Yo, desde: int | None = None):
    c = coleccion(col)
    with conexion.pool().connection() as con, con.cursor() as cur:
        seq = c.ultimo_seq(cur)
        if desde is not None and desde >= seq:
            return {"seq": seq, "sin_cambios": True}
        datos = c.obtener(cur, validar_id(doc_id))
    return {"seq": seq, "existe": datos is not None, "datos": datos}


def _escribir(c: Coleccion, doc_id: str, persona: Persona, nuevo, parcial: bool = False):
    """Crea, reemplaza o actualiza un documento, con reglas, sellos e historial."""
    if not isinstance(nuevo, dict):
        raise HTTPException(422, "Los datos deben ser un objeto")
    try:
        with conexion.pool().connection() as con, con.cursor() as cur:
            recordar(cur, persona)
            antes = c.obtener(cur, doc_id, bloquear=True)
            if antes is None:
                if parcial:
                    raise HTTPException(404, "No existe")
                c.regla.exigir("crear", persona)
                datos, accion = c.sellar(nuevo, persona), "crear"
            else:
                c.regla.exigir("editar", persona)
                datos = {**antes, **nuevo} if parcial else dict(nuevo)
                datos.update({k: antes[k] for k in c.sellos if k in antes})  # lo sellado no cambia
                accion = "actualizar" if parcial else "reemplazar"
            c.guardar(cur, doc_id, datos, persona, accion, antes)
            if c.nombre == "tickets" and accion == "crear":
                correos.encolar(cur, doc_id, datos, persona)
            seq = c.ultimo_seq(cur)
    except errors.UniqueViolation as e:
        raise HTTPException(409, "Ya existe un registro con ese código") from e
    except errors.CheckViolation as e:
        raise HTTPException(422, "Los datos no cumplen las reglas de la tabla") from e
    return {"id": doc_id, "seq": seq}


@app.post("/api/c/{col}")
def crear(col: str, persona: Yo, datos: Annotated[dict, Body()]):
    return _escribir(coleccion(col), secrets.token_hex(10), persona, datos)


@app.put("/api/c/{col}/{doc_id}")
def reemplazar(col: str, doc_id: str, persona: Yo, datos: Annotated[dict, Body()]):
    return _escribir(coleccion(col), validar_id(doc_id), persona, datos)


@app.patch("/api/c/{col}/{doc_id}")
def actualizar(col: str, doc_id: str, persona: Yo, datos: Annotated[dict, Body()]):
    return _escribir(coleccion(col), validar_id(doc_id), persona, datos, parcial=True)


@app.delete("/api/c/{col}/{doc_id}")
def eliminar(col: str, doc_id: str, persona: Yo):
    c = coleccion(col)
    c.regla.exigir("borrar", persona)
    with conexion.pool().connection() as con, con.cursor() as cur:
        recordar(cur, persona)
        c.eliminar(cur, validar_id(doc_id), persona)
        return {"id": doc_id, "seq": c.ultimo_seq(cur)}


@app.post("/api/importar")
def importar(persona: Yo, colecciones: Annotated[dict[str, dict[str, dict]], Body(embed=True)]):
    """Carga inicial desde una exportación: {"colecciones": {"projects": {"id": {...}}}}.

    Solo editores. Guarda tal cual (sin sellos) y deja cada documento en el historial.
    """
    if not persona.editor:
        raise HTTPException(403, "Solo los editores pueden importar")
    cuenta = {}
    with conexion.pool().connection() as con, con.cursor() as cur:
        recordar(cur, persona)
        for col, docs in colecciones.items():
            c = coleccion(col)
            for doc_id, datos in docs.items():
                c.guardar(cur, validar_id(doc_id), datos, persona, "importar", c.obtener(cur, doc_id, bloquear=True))
            cuenta[col] = len(docs)
    return {"importados": cuenta}


@app.get("/api/solicitudes/formulario")
def formulario(persona: Yo):
    return FileResponse(correos.FORMULARIO, media_type=correos.MIME_DOCX, filename="Guia-workflow-IA.docx")


@app.get("/api/solicitudes/correos")
def estado_correos(persona: Yo):
    if not persona.editor:
        raise HTTPException(403, "Solo los editores pueden revisar entregas")
    with conexion.pool().connection() as con, con.cursor() as cur:
        cur.execute("""SELECT solicitud_id, codigo, estado, intentos, ultimo_error, aceptado_en
                       FROM correos_solicitudes ORDER BY creado_en DESC LIMIT 100""")
        claves = [c.name for c in cur.description]
        return {"activo": os.environ.get("NEXO_CORREO_ACTIVO") == "1",
                "entregas": [dict(zip(claves, fila)) for fila in cur.fetchall()]}


@app.post("/api/solicitudes/correos/{doc_id}/reintentar")
def reintentar_correo(doc_id: str, persona: Yo):
    if not persona.editor:
        raise HTTPException(403, "Solo los editores pueden reintentar entregas")
    with conexion.pool().connection() as con, con.cursor() as cur:
        cur.execute("""UPDATE correos_solicitudes SET estado = 'pendiente', intentos = 0,
                       proximo_intento = now(), ultimo_error = NULL
                       WHERE solicitud_id = %s AND estado = 'fallido' RETURNING solicitud_id""",
                    (validar_id(doc_id),))
        if not cur.fetchone():
            raise HTTPException(409, "La entrega no está fallida o no existe")
    return {"estado": "pendiente"}


ASANA = "https://app.asana.com/api/1.0/tasks/"


@app.post("/api/asana/tarea")
def asana_tarea(persona: Yo, task_id: Annotated[str, Body(pattern=r"^\d{1,30}$")], opt_fields: Annotated[str, Body(max_length=500)] = ""):
    """Lee una tarea de Asana con el token de la app (Key Vault). Solo lectura, solo editores."""
    if not persona.editor:
        raise HTTPException(403, "Solo los editores pueden sincronizar Asana")
    token = os.environ.get("ASANA_TOKEN")
    if not token:
        raise HTTPException(503, {"codigo": "no_configurado"})
    try:
        r = httpx.get(ASANA + task_id, params={"opt_fields": opt_fields} if opt_fields else None,
                      headers={"Authorization": f"Bearer {token}"}, timeout=20)
    except httpx.HTTPError as e:
        raise HTTPException(503, {"codigo": "server_unavailable"}) from e
    if r.status_code in (401, 403):
        raise HTTPException(502, {"codigo": "asana_rechazo"})
    if r.status_code >= 400:
        raise HTTPException(502, {"codigo": "tool_error", "mensaje": f"Asana respondió {r.status_code}"})
    return {"payload": r.json()}


IMPORTAR = """<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Importar datos</title>
<style>body{font:16px system-ui,sans-serif;max-width:560px;margin:48px auto;padding:0 16px;color:#0F141B}
h1{color:#00216F;font-size:22px}button{font:inherit;padding:8px 16px;border-radius:8px;border:0;background:#00216F;color:#fff}
pre{background:#F3F5F9;padding:12px;border-radius:8px;white-space:pre-wrap}</style>
<h1>Importar datos</h1>
<p>Sube la exportación (JSON) del artifact. Solo editores. Cada documento queda en el historial.</p>
<input id="f" type="file" accept="application/json"> <button id="b">Importar</button>
<pre id="r" hidden></pre>
<script>
document.getElementById("b").onclick = async () => {
  const r = document.getElementById("r"); r.hidden = false; r.textContent = "Importando…";
  try {
    const texto = await document.getElementById("f").files[0].text();
    const res = await fetch("/api/importar", {method: "POST", headers: {"Content-Type": "application/json"}, body: texto});
    r.textContent = JSON.stringify(await res.json(), null, 2);
  } catch (e) { r.textContent = "Elige un archivo JSON válido."; }
};
</script></html>"""


@app.get("/importar", response_class=HTMLResponse)
def pagina_importar(persona: Yo):
    if not persona.editor:
        raise HTTPException(403, "Solo los editores pueden importar")
    return IMPORTAR


@app.get("/{ruta:path}", include_in_schema=False)
def pagina(ruta: str):
    if ruta.startswith("api/"):
        raise HTTPException(404, "No existe")
    if not PAGINA.exists():
        raise HTTPException(503, "La página no está compilada")
    return FileResponse(PAGINA, headers={"Cache-Control": "no-cache"})
