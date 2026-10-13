"""Las colecciones de esta app y cómo se guarda cada una.

Es el único archivo propio de cada app (junto con sus migraciones). Regla de Nexo:
- Documentos: apps que vienen de un artifact, tableros y campos que todavía cambian.
- Tabla: datos acordados que alimentan reportes, Databricks o decisiones de dinero.
"""
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

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

class MetricaTrimestre(BaseModel):
    """Métricas de despliegue de un trimestre. Vacío = aún no medido (nunca un valor inventado)."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    quarter: str = Field(pattern=r"^20[0-9]{2}-Q[1-4]$")
    daysToValue: float | None = Field(default=None, ge=0, le=3650)
    liveWithUsers: int | None = Field(default=None, ge=0, le=10000)
    pilots: int | None = Field(default=None, ge=0, le=10000)
    pilotsToProduction: int | None = Field(default=None, ge=0, le=10000)
    savingsUsd: float | None = Field(default=None, ge=0, le=1_000_000_000)
    hoursSaved: float | None = Field(default=None, ge=0, le=10_000_000)
    daysBlocked: float | None = Field(default=None, ge=0, le=36500)
    note: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def produccion_no_supera_pilotos(self):
        if self.pilots is not None and self.pilotsToProduction is not None and self.pilotsToProduction > self.pilots:
            raise ValueError("Los pilotos que pasaron a producción no pueden ser más que los pilotos")
        return self


METRICAS = {
    "quarter": "trimestre", "daysToValue": "dias_primer_valor", "liveWithUsers": "despliegues_con_usuarios",
    "pilots": "pilotos", "pilotsToProduction": "pilotos_a_produccion", "savingsUsd": "ahorro_usd",
    "hoursSaved": "horas_liberadas", "daysBlocked": "dias_bloqueado", "note": "nota",
}

COLECCIONES = {
    "projects": Documentos(),
    "components": Documentos(),
    "updates": Documentos(),
    "asana": Documentos(),
    "asanaMeta": Documentos(),
    # Métricas trimestrales de despliegue: todos leen, solo editores escriben.
    "metricas": Tabla(tabla="metricas_fde", modelo=MetricaTrimestre, columnas=METRICAS),
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
