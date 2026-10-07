"""Las colecciones de esta app y cómo se guarda cada una.

Es el único archivo propio de cada app (junto con sus migraciones). Regla de Nexo:
- Documentos: apps que vienen de un artifact, tableros y campos que todavía cambian.
- Tabla: datos acordados que alimentan reportes, Databricks o decisiones de dinero.
"""
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from .almacen import Documentos, Regla, Tabla

MUNDOS = Literal["Nexo", "PDC Brands", "Vikingo Distribución", "Vikingo AI", "Mostro", "Corporativo"]
TIPOS = Literal[
    "Automatización o agente", "Portal o tablero", "Análisis de datos",
    "Licencia o acceso a Claude", "Quiero construirlo yo (autoservicio)", "Otro",
]


class Solicitud(BaseModel):
    """Una solicitud de IA. Los nombres son los que usa la app; las columnas, en COLUMNAS."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    code: str = Field(pattern=r"^SOL-[0-9A-Z-]{3,20}$")
    title: str = Field(min_length=1, max_length=120)
    area: MUNDOS
    type: TIPOS
    urgency: Literal["Baja", "Media", "Alta"]
    problem: str = Field(min_length=1, max_length=4000)
    current: str | None = Field(default=None, max_length=4000)
    hours: float | None = Field(default=None, ge=0, le=100000)
    people: int | None = Field(default=None, ge=0, le=100000)
    impact: str | None = Field(default=None, max_length=1000)
    systems: str | None = Field(default=None, max_length=1000)
    createdBy: str
    createdAt: datetime


SOLICITUDES = {
    "code": "codigo", "title": "titulo", "area": "mundo", "type": "tipo", "urgency": "urgencia",
    "problem": "problema", "current": "como_se_hace_hoy", "hours": "horas_mes", "people": "personas",
    "impact": "impacto", "systems": "sistemas", "createdBy": "creado_por", "createdAt": "creado_en",
}

COLECCIONES = {
    "projects": Documentos(),
    "components": Documentos(),
    "updates": Documentos(),
    "asana": Documentos(),
    "asanaMeta": Documentos(),
    "triage": Documentos(),
    # Cualquier persona de PDC puede enviar una solicitud; solo editores la cambian o la borran.
    # Quién la envía y cuándo los pone el servidor.
    "tickets": Tabla(
        tabla="solicitudes",
        modelo=Solicitud,
        columnas=SOLICITUDES,
        regla=Regla(crear="todos"),
        sellos={
            "createdBy": lambda persona: persona.id,
            "createdAt": lambda persona: datetime.now(timezone.utc).isoformat(),
        },
    ),
}
for _nombre, _coleccion in COLECCIONES.items():
    _coleccion.nombre = _nombre
