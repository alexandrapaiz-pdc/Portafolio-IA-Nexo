-- Métricas trimestrales del trabajo de despliegue (Forward Deployed Engineering).
-- Una fila por trimestre; la app las ve como la colección "metricas" (id = trimestre, p. ej. 2026-Q4).
-- Solo los editores las cambian; cualquier persona con sesión las lee. Historial en "historial".
CREATE TABLE metricas_fde (
    id                       text        PRIMARY KEY CHECK (id ~ '^20[0-9]{2}-Q[1-4]$'),
    trimestre                text        NOT NULL CHECK (trimestre = id),
    dias_primer_valor        numeric     CHECK (dias_primer_valor >= 0),
    despliegues_con_usuarios integer     CHECK (despliegues_con_usuarios >= 0),
    pilotos                  integer     CHECK (pilotos >= 0),
    pilotos_a_produccion     integer     CHECK (pilotos_a_produccion >= 0),
    ahorro_usd               numeric     CHECK (ahorro_usd >= 0),
    horas_liberadas          numeric     CHECK (horas_liberadas >= 0),
    dias_bloqueado           numeric     CHECK (dias_bloqueado >= 0),
    nota                     text        CHECK (length(nota) <= 2000),
    version                  integer     NOT NULL DEFAULT 1,
    seq                      bigint      NOT NULL DEFAULT nextval('cambio_seq'),
    actualizado_por          text,
    actualizado_en           timestamptz NOT NULL DEFAULT now(),
    eliminado                boolean     NOT NULL DEFAULT false,
    CHECK (pilotos_a_produccion IS NULL OR pilotos IS NULL OR pilotos_a_produccion <= pilotos)
);
CREATE INDEX metricas_fde_seq ON metricas_fde (seq);
