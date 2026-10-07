"""Quién hace cada solicitud.

En Azure, la autenticación integrada de Container Apps valida la sesión con Entra y
manda la identidad en el encabezado X-MS-CLIENT-PRINCIPAL. Ese encabezado solo es
confiable con la autenticación integrada activa: Container Apps lo reescribe en cada
solicitud. En local se usa DEV_USUARIO (nunca en Azure).

Los editores se definen con NEXO_EDITORES: correos separados por comas.
"""
import base64
import binascii
import json
import os
from dataclasses import dataclass

from fastapi import HTTPException, Request

OID = "http://schemas.microsoft.com/identity/claims/objectidentifier"


@dataclass(frozen=True)
class Persona:
    id: str  # id de objeto de Entra (estable aunque cambie el correo)
    nombre: str
    correo: str

    @property
    def editor(self) -> bool:
        editores = {c.strip().lower() for c in os.environ.get("NEXO_EDITORES", "").split(",") if c.strip()}
        return self.correo.lower() in editores


def _desde_principal(valor: str) -> Persona:
    try:
        datos = json.loads(base64.b64decode(valor))
    except (binascii.Error, ValueError) as e:
        raise HTTPException(401, "Identidad inválida") from e
    claims = {}
    for c in datos.get("claims", []):
        claims.setdefault(c.get("typ"), c.get("val"))
    oid = claims.get(OID) or claims.get("oid")
    correo = claims.get("preferred_username") or claims.get("email") or claims.get("upn") or ""
    if not oid or not correo:
        raise HTTPException(401, "Identidad incompleta")
    return Persona(id=oid, nombre=claims.get("name") or correo, correo=correo)


def persona_actual(request: Request) -> Persona:
    principal = request.headers.get("X-MS-CLIENT-PRINCIPAL")
    if principal:
        return _desde_principal(principal)
    dev = os.environ.get("DEV_USUARIO")  # formato: correo[|nombre], solo en local
    if dev:
        correo, _, nombre = dev.partition("|")
        return Persona(id="dev-" + correo, nombre=nombre or correo, correo=correo)
    raise HTTPException(401, "Inicia sesión con tu cuenta de Grupo PDC")
