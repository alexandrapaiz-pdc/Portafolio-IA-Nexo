"""Cómo se guarda cada colección: como documentos JSON o como tabla con columnas.

La app (el navegador) no sabe cuál de las dos es: pide "tickets" o "projects" y
recibe documentos {id, datos}. Así una colección empieza como documentos y se
promueve a tabla con una migración y una línea en colecciones.py, sin tocar la app.

Las dos formas comparten las reglas de Nexo: versión por fila, número de cambio
(seq) para que los clientes sepan si hay algo nuevo, historial de cada cambio y
borrado lógico (nada se borra de verdad).
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal
from typing import Callable, Literal

from fastapi import HTTPException
from psycopg import sql
from psycopg.types.json import Jsonb
from pydantic import BaseModel, ValidationError

from .identidad import Persona

Quien = Literal["todos", "editores"]
LIMITE_DOCUMENTO = 256 * 1024  # bytes de JSON por documento


@dataclass(frozen=True)
class Regla:
    """Quién puede hacer qué. Leer siempre exige sesión de Entra."""

    crear: Quien = "editores"
    editar: Quien = "editores"
    borrar: Quien = "editores"

    def exigir(self, accion: str, persona: Persona) -> None:
        if getattr(self, accion) == "editores" and not persona.editor:
            raise HTTPException(403, "Solo los editores pueden hacer este cambio")


def _json(valor):
    if isinstance(valor, (datetime, date)):
        return valor.isoformat()
    if isinstance(valor, Decimal):
        return int(valor) if valor == valor.to_integral_value() else float(valor)
    return valor


def _historial(cur, coleccion: str, doc_id: str, accion: str, antes, despues, persona: Persona) -> None:
    cur.execute(
        "INSERT INTO historial (coleccion, doc_id, accion, antes, despues, usuario) VALUES (%s, %s, %s, %s, %s, %s)",
        (coleccion, doc_id, accion, Jsonb(antes) if antes is not None else None,
         Jsonb(despues) if despues is not None else None, persona.correo),
    )


@dataclass
class Coleccion:
    regla: Regla = field(default_factory=Regla)
    # Campos que pone el servidor al crear (nadie los puede falsificar desde el navegador).
    sellos: dict[str, Callable[[Persona], object]] = field(default_factory=dict)
    nombre: str = ""

    def sellar(self, datos: dict, persona: Persona) -> dict:
        return {**datos, **{k: f(persona) for k, f in self.sellos.items()}}


@dataclass
class Documentos(Coleccion):
    """Colección guardada como documentos JSON en la tabla `documentos`."""

    modelo: type[BaseModel] | None = None  # validación opcional por colección

    def _validar(self, datos: dict) -> dict:
        if len(json.dumps(datos)) > LIMITE_DOCUMENTO:
            raise HTTPException(413, "El documento es demasiado grande")
        if self.modelo:
            try:
                return self.modelo.model_validate(datos).model_dump(mode="json", exclude_none=False)
            except ValidationError as e:
                raise HTTPException(422, e.errors(include_url=False, include_context=False)) from e
        return datos

    def ultimo_seq(self, cur) -> int:
        cur.execute("SELECT coalesce(max(seq), 0) FROM documentos WHERE coleccion = %s", (self.nombre,))
        return cur.fetchone()[0]

    def listar(self, cur, orden: str | None, sentido: str, limite: int) -> list[tuple[str, dict]]:
        q = "SELECT id, datos FROM documentos WHERE coleccion = %s AND NOT eliminado"
        args: list = [self.nombre]
        if orden:
            q += f" ORDER BY datos->>%s {sentido} NULLS LAST, id"
            args.append(orden)
        else:
            q += " ORDER BY id"
        cur.execute(q + " LIMIT %s", (*args, limite))
        return cur.fetchall()

    def obtener(self, cur, doc_id: str, bloquear: bool = False) -> dict | None:
        cur.execute(
            "SELECT datos FROM documentos WHERE coleccion = %s AND id = %s AND NOT eliminado"
            + (" FOR UPDATE" if bloquear else ""),
            (self.nombre, doc_id),
        )
        fila = cur.fetchone()
        return fila[0] if fila else None

    def guardar(self, cur, doc_id: str, datos: dict, persona: Persona, accion: str, antes: dict | None) -> None:
        datos = self._validar(datos)
        cur.execute(
            """INSERT INTO documentos (coleccion, id, datos, creado_por, actualizado_por)
               VALUES (%(c)s, %(i)s, %(d)s, %(p)s, %(p)s)
               ON CONFLICT (coleccion, id) DO UPDATE
               SET datos = EXCLUDED.datos, version = documentos.version + 1, seq = nextval('cambio_seq'),
                   actualizado_por = EXCLUDED.actualizado_por, actualizado_en = now(), eliminado = false""",
            {"c": self.nombre, "i": doc_id, "d": Jsonb(datos), "p": persona.correo},
        )
        _historial(cur, self.nombre, doc_id, accion, antes, datos, persona)

    def eliminar(self, cur, doc_id: str, persona: Persona) -> bool:
        antes = self.obtener(cur, doc_id, bloquear=True)
        if antes is None:
            return False
        cur.execute(
            """UPDATE documentos SET eliminado = true, version = version + 1, seq = nextval('cambio_seq'),
               actualizado_por = %s, actualizado_en = now() WHERE coleccion = %s AND id = %s""",
            (persona.correo, self.nombre, doc_id),
        )
        _historial(cur, self.nombre, doc_id, "eliminar", antes, None, persona)
        return True


@dataclass
class Tabla(Coleccion):
    """Colección guardada en una tabla con columnas propias.

    `columnas` traduce cada campo que usa la app (JSON) a su columna en la base de
    datos; `modelo` valida los tipos antes de escribir (y la tabla vuelve a validar
    con sus restricciones).
    """

    tabla: str = ""
    modelo: type[BaseModel] | None = None
    columnas: dict[str, str] = field(default_factory=dict)

    def _a_json(self, fila: dict) -> dict:
        return {campo: _json(fila[col]) for campo, col in self.columnas.items() if fila.get(col) is not None}

    def _validar(self, datos: dict) -> dict:
        try:
            return self.modelo.model_validate(datos).model_dump()
        except ValidationError as e:
            raise HTTPException(422, e.errors(include_url=False, include_context=False)) from e

    def _select(self) -> sql.Composed:
        cols = sql.SQL(", ").join(sql.Identifier(c) for c in ["id", *self.columnas.values()])
        return sql.SQL("SELECT {} FROM {}").format(cols, sql.Identifier(self.tabla))

    def ultimo_seq(self, cur) -> int:
        cur.execute(sql.SQL("SELECT coalesce(max(seq), 0) FROM {}").format(sql.Identifier(self.tabla)))
        return cur.fetchone()[0]

    def _filas(self, cur) -> list[dict]:
        nombres = [d.name for d in cur.description]
        return [dict(zip(nombres, f)) for f in cur.fetchall()]

    def listar(self, cur, orden: str | None, sentido: str, limite: int) -> list[tuple[str, dict]]:
        q = self._select() + sql.SQL(" WHERE NOT eliminado")
        if orden:
            if orden not in self.columnas:
                raise HTTPException(400, f"No se puede ordenar por {orden}")
            q += sql.SQL(" ORDER BY {} {} NULLS LAST, id").format(sql.Identifier(self.columnas[orden]), sql.SQL(sentido))
        else:
            q += sql.SQL(" ORDER BY id")
        cur.execute(q + sql.SQL(" LIMIT %s"), (limite,))
        return [(f["id"], self._a_json(f)) for f in self._filas(cur)]

    def obtener(self, cur, doc_id: str, bloquear: bool = False) -> dict | None:
        q = self._select() + sql.SQL(" WHERE id = %s AND NOT eliminado") + sql.SQL(" FOR UPDATE" if bloquear else "")
        cur.execute(q, (doc_id,))
        filas = self._filas(cur)
        return self._a_json(filas[0]) if filas else None

    def guardar(self, cur, doc_id: str, datos: dict, persona: Persona, accion: str, antes: dict | None) -> None:
        valido = self._validar(datos)
        valores = {self.columnas[k]: v for k, v in valido.items() if k in self.columnas}
        cols = list(valores)
        insertar = sql.SQL("INSERT INTO {t} (id, {cols}, actualizado_por) VALUES (%s, {vals}, %s)").format(
            t=sql.Identifier(self.tabla),
            cols=sql.SQL(", ").join(map(sql.Identifier, cols)),
            vals=sql.SQL(", ").join(sql.Placeholder() * len(cols)),
        )
        actualizar = sql.SQL(
            " ON CONFLICT (id) DO UPDATE SET {sets}, version = {t}.version + 1, seq = nextval('cambio_seq'),"
            " actualizado_por = EXCLUDED.actualizado_por, actualizado_en = now(), eliminado = false"
        ).format(
            t=sql.Identifier(self.tabla),
            sets=sql.SQL(", ").join(sql.SQL("{c} = EXCLUDED.{c}").format(c=sql.Identifier(c)) for c in cols),
        )
        cur.execute(insertar + actualizar, (doc_id, *valores.values(), persona.correo))
        _historial(cur, self.nombre, doc_id, accion, antes, {k: _json(v) for k, v in valido.items()}, persona)

    def eliminar(self, cur, doc_id: str, persona: Persona) -> bool:
        antes = self.obtener(cur, doc_id, bloquear=True)
        if antes is None:
            return False
        cur.execute(
            sql.SQL("UPDATE {} SET eliminado = true, version = version + 1, seq = nextval('cambio_seq'),"
                    " actualizado_por = %s, actualizado_en = now() WHERE id = %s").format(sql.Identifier(self.tabla)),
            (persona.correo, doc_id),
        )
        _historial(cur, self.nombre, doc_id, "eliminar", antes, None, persona)
        return True
