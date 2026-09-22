-- Comentario anónimo: alias generado + GIF + audio, alumnoId pasa a opcional (legado).
ALTER TABLE "Comentario" ADD COLUMN "alias" TEXT NOT NULL DEFAULT '';

-- Backfill: usa el nombre del alumno para los comentarios antiguos.
UPDATE "Comentario" c
SET "alias" = COALESCE(a."nombre", 'Compañero')
FROM "Alumno" a
WHERE c."alumnoId" = a."id";

UPDATE "Comentario" SET "alias" = 'Compañero' WHERE "alias" = '';

ALTER TABLE "Comentario" ADD COLUMN "gifUrl" TEXT;
ALTER TABLE "Comentario" ADD COLUMN "audioUrl" TEXT;

ALTER TABLE "Comentario" ALTER COLUMN "alumnoId" DROP NOT NULL;

ALTER TABLE "Comentario" DROP CONSTRAINT "Comentario_alumnoId_fkey";
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Encuesta" (
    "id" TEXT NOT NULL,
    "pregunta" TEXT NOT NULL,
    "esAdmin" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Encuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opcion" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "votos" INTEGER NOT NULL DEFAULT 0,
    "votantes" TEXT[],
    "encuestaId" TEXT NOT NULL,
    CONSTRAINT "Opcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sugerencia" (
    "id" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sugerencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Encuesta_fecha_idx" ON "Encuesta"("fecha");

-- CreateIndex
CREATE INDEX "Opcion_encuestaId_idx" ON "Opcion"("encuestaId");

-- CreateIndex
CREATE INDEX "Sugerencia_fecha_idx" ON "Sugerencia"("fecha");

-- AddForeignKey
ALTER TABLE "Opcion" ADD CONSTRAINT "Opcion_encuestaId_fkey" FOREIGN KEY ("encuestaId") REFERENCES "Encuesta"("id") ON DELETE CASCADE ON UPDATE CASCADE;