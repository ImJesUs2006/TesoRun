import { readFileSync } from "node:fs";

const normales = [".env", ".env.local"];

for (const archivo of normales) {
  try {
    process.loadEnvFile(archivo);
  } catch {
    // el archivo puede no existir
  }
}

async function main() {
  const { prisma } = await import("@/lib/prisma");
  const ruta = process.argv[2];
  if (!ruta) {
    console.error("Uso: npx tsx scripts/restaurar.ts <archivo.json>");
    process.exitCode = 1;
    return;
  }

  const datos = JSON.parse(readFileSync(ruta, "utf8")) as {
    config: { fechaInicio: string; maxEncuestasDiarias: number } | null;
    alumnos: Array<{
      id: string;
      nombre: string;
      avatarUrl: string | null;
      semanasPagadas: number;
      rachaActual: number;
      mejorRacha: number;
      ultimoPago: string | null;
    }>;
  };

  if (datos.config) {
    await prisma.configuracion.upsert({
      where: { id: 1 },
      update: {
        fechaInicio: new Date(datos.config.fechaInicio),
        maxEncuestasDiarias: datos.config.maxEncuestasDiarias,
      },
      create: {
        id: 1,
        fechaInicio: new Date(datos.config.fechaInicio),
        maxEncuestasDiarias: datos.config.maxEncuestasDiarias,
      },
    });
    console.log("Configuracion restaurada.");
  }

  const creados = await prisma.alumno.createMany({
    data: datos.alumnos.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      avatarUrl: a.avatarUrl,
      semanasPagadas: a.semanasPagadas,
      rachaActual: a.rachaActual,
      mejorRacha: a.mejorRacha,
      ultimoPago: a.ultimoPago ? new Date(a.ultimoPago) : null,
    })),
    skipDuplicates: true,
  });
  console.log(`Alumnos creados: ${creados.count} (de ${datos.alumnos.length} en el respaldo).`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});