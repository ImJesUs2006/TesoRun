-- Hilos (respuestas): un comentario puede responder a otro comentario.
ALTER TABLE "Comentario" ADD COLUMN "parentId" TEXT;

-- Borrar el padre borra sus respuestas; actualizar el id del padre se propaga.
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comentario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Comentario_parentId_idx" ON "Comentario"("parentId");