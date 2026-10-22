-- Entradas con comentario por métrica (p. ej. 24 días · Avon). El valor del trimestre se
-- calcula a partir de ellas en la API; una métrica sin entradas conserva su valor directo.
ALTER TABLE metricas_fde ADD COLUMN entradas jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(entradas) = 'object');
