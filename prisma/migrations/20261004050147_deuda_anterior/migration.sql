-- DropIndex
DROP INDEX "Reaccion_comentarioId_idx";

-- AlterTable
ALTER TABLE "Alumno" ADD COLUMN     "deudaAnterior" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Comentario" ALTER COLUMN "contenido" DROP NOT NULL,
ALTER COLUMN "alias" DROP DEFAULT;
