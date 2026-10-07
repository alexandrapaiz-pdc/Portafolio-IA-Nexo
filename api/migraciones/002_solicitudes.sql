-- Solicitudes como tabla con columnas (no como documentos): sus campos ya están
-- acordados y alimentan reportes. La app sigue viéndolas como la colección "tickets".
CREATE TABLE solicitudes (
    id               text        PRIMARY KEY,
    codigo           text        NOT NULL UNIQUE,
    titulo           text        NOT NULL CHECK (length(btrim(titulo)) BETWEEN 1 AND 120),
    mundo            text        NOT NULL,
    tipo             text        NOT NULL,
    urgencia         text        NOT NULL CHECK (urgencia IN ('Baja', 'Media', 'Alta')),
    problema         text        NOT NULL CHECK (length(btrim(problema)) > 0),
    como_se_hace_hoy text,
    horas_mes        numeric     CHECK (horas_mes >= 0),
    personas         integer     CHECK (personas >= 0),
    impacto          text,
    sistemas         text,
    creado_por       text        NOT NULL,
    creado_en        timestamptz NOT NULL DEFAULT now(),
    version          integer     NOT NULL DEFAULT 1,
    seq              bigint      NOT NULL DEFAULT nextval('cambio_seq'),
    actualizado_por  text,
    actualizado_en   timestamptz NOT NULL DEFAULT now(),
    eliminado        boolean     NOT NULL DEFAULT false
);
CREATE INDEX solicitudes_seq ON solicitudes (seq);
