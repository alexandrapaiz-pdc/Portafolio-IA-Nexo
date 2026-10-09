-- Una entrega pendiente por solicitud, guardada en la misma transacción.
-- No se generan correos al importar solicitudes históricas.
CREATE TABLE correos_solicitudes (
    solicitud_id text PRIMARY KEY REFERENCES solicitudes(id),
    destinatario text NOT NULL,
    nombre text NOT NULL,
    codigo text NOT NULL,
    titulo text NOT NULL,
    estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptado', 'fallido')),
    intentos integer NOT NULL DEFAULT 0,
    proximo_intento timestamptz NOT NULL DEFAULT now(),
    creado_en timestamptz NOT NULL DEFAULT now(),
    aceptado_en timestamptz,
    ultimo_error text
);
CREATE INDEX correos_solicitudes_pendientes ON correos_solicitudes (proximo_intento)
    WHERE estado = 'pendiente';
