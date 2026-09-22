-- Los comentarios sin texto (solo GIF/imagen/audio) guardan "" en vez de NULL.
ALTER TABLE "Comentario" ALTER COLUMN "contenido" SET DEFAULT '';