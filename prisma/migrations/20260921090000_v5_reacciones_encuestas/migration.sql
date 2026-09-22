-- Comentario: imagen adjunta opcional.
ALTER TABLE "Comentario" ADD COLUMN "imageUrl" TEXT;

-- Reacciones por comentario (emoji libre, votantes = deviceIds).
CREATE TABLE "Reaccion" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "votantes" TEXT[] NOT NULL,
    "comentarioId" TEXT NOT NULL,
    CONSTRAINT "Reaccion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Reaccion_comentarioId_idx" ON "Reaccion"("comentarioId");

CREATE UNIQUE INDEX "Reaccion_comentarioId_emoji_key" ON "Reaccion"("comentarioId", "emoji");

ALTER TABLE "Reaccion" ADD CONSTRAINT "Reaccion_comentarioId_fkey" FOREIGN KEY ("comentarioId") REFERENCES "Comentario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Encuestas públicas: cierre por el creador y estado activa.
ALTER TABLE "Encuesta" ADD COLUMN "activa" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Encuesta" ADD COLUMN "creadorId" TEXT;