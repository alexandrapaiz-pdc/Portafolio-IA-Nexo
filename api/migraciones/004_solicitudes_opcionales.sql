-- Los campos que completa el usuario son opcionales; identidad y código siguen sellados.
ALTER TABLE solicitudes DROP CONSTRAINT solicitudes_titulo_check;
ALTER TABLE solicitudes ADD CONSTRAINT solicitudes_titulo_check CHECK (length(titulo) <= 120);
ALTER TABLE solicitudes DROP CONSTRAINT solicitudes_problema_check;
ALTER TABLE solicitudes ADD CONSTRAINT solicitudes_problema_check CHECK (length(problema) <= 4000);
ALTER TABLE solicitudes ALTER COLUMN mundo DROP NOT NULL;
ALTER TABLE solicitudes ALTER COLUMN tipo DROP NOT NULL;
ALTER TABLE solicitudes ALTER COLUMN urgencia DROP NOT NULL;
