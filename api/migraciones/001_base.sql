-- Base de toda app de Nexo: documentos, historial y personas.
-- Corre dentro del esquema propio de la app (search_path).

-- Cada cambio toma un número creciente; los clientes preguntan "¿hay algo después del N?".
CREATE SEQUENCE cambio_seq;

-- Colecciones guardadas como documentos JSON (mismo modelo que la base de datos de un artifact).
CREATE TABLE documentos (
    coleccion       text        NOT NULL,
    id              text        NOT NULL,
    datos           jsonb       NOT NULL,
    version         integer     NOT NULL DEFAULT 1,
    seq             bigint      NOT NULL DEFAULT nextval('cambio_seq'),
    creado_por      text,
    creado_en       timestamptz NOT NULL DEFAULT now(),
    actualizado_por text,
    actualizado_en  timestamptz NOT NULL DEFAULT now(),
    eliminado       boolean     NOT NULL DEFAULT false,
    PRIMARY KEY (coleccion, id)
);
CREATE INDEX documentos_seq ON documentos (coleccion, seq);

-- Quién cambió qué y cuándo, para documentos y tablas. Nunca se borra.
CREATE TABLE historial (
    id          bigserial   PRIMARY KEY,
    coleccion   text        NOT NULL,
    doc_id      text        NOT NULL,
    accion      text        NOT NULL CHECK (accion IN ('crear', 'reemplazar', 'actualizar', 'eliminar', 'importar')),
    antes       jsonb,
    despues     jsonb,
    usuario     text        NOT NULL,
    fecha       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX historial_doc ON historial (coleccion, doc_id);

-- Nombres de quienes usan la app, para mostrar "Solicitante: Ana López" a partir del id.
CREATE TABLE personas (
    id       text        PRIMARY KEY,
    nombre   text        NOT NULL,
    correo   text        NOT NULL,
    visto_en timestamptz NOT NULL DEFAULT now()
);
