"""Conexión a PostgreSQL.

En Azure la app entra al PostgreSQL de Nexo con su identidad administrada: pide un
token de Entra y lo usa como contraseña. No hay contraseñas guardadas en ningún lado.
En local se usa una base de datos de prueba con las variables PG* de siempre.

Variables:
  PGHOST, PGPORT, PGDATABASE, PGUSER, PGSSLMODE   conexión (estándar de PostgreSQL)
  PGPASSWORD                                       solo en local
  NEXO_PG_ENTRA=1                                  en Azure: usar token de Entra
  AZURE_CLIENT_ID                                  id de cliente de la identidad id-<app>
  DB_SCHEMA                                        esquema propio de la app
"""
import os
import re
import threading
import time

import psycopg
from psycopg_pool import ConnectionPool

ESQUEMA = os.environ.get("DB_SCHEMA", "app_portafolio_ia")
if not re.fullmatch(r"[a-z_][a-z0-9_]{0,62}", ESQUEMA):
    raise RuntimeError("DB_SCHEMA no es un nombre de esquema válido")

_ALCANCE = "https://ossrdbms-aad.database.windows.net/.default"
_token = {"valor": None, "vence": 0.0}
_candado = threading.Lock()


def _token_entra() -> str:
    """Token de Entra para PostgreSQL, renovado 5 minutos antes de vencer."""
    with _candado:
        if _token["valor"] and time.time() < _token["vence"] - 300:
            return _token["valor"]
        from azure.identity import ManagedIdentityCredential

        cred = ManagedIdentityCredential(client_id=os.environ.get("AZURE_CLIENT_ID"))
        t = cred.get_token(_ALCANCE)
        _token.update(valor=t.token, vence=float(t.expires_on))
        return t.token


class _ConexionEntra(psycopg.Connection):
    """Cada conexión nueva usa un token vigente como contraseña."""

    @classmethod
    def connect(cls, conninfo: str = "", **kwargs):
        kwargs["password"] = _token_entra()
        return super().connect(conninfo, **kwargs)


def _preparar(con: psycopg.Connection) -> None:
    con.execute(f"SET search_path TO {ESQUEMA}")
    con.commit()


_pool: ConnectionPool | None = None


def pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        entra = os.environ.get("NEXO_PG_ENTRA") == "1"
        _pool = ConnectionPool(
            conninfo="",
            connection_class=_ConexionEntra if entra else psycopg.Connection,
            min_size=0,
            max_size=int(os.environ.get("DB_CONEXIONES", "5")),
            max_lifetime=45 * 60,  # renueva conexiones antes de que el token sea viejo
            configure=_preparar,
            open=True,
        )
    return _pool


def cerrar() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None
