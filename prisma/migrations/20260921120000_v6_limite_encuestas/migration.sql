-- Límite global diario de encuestas públicas (anti-spam, editable por admin).
ALTER TABLE "Configuracion" ADD COLUMN "maxEncuestasDiarias" INTEGER NOT NULL DEFAULT 5;