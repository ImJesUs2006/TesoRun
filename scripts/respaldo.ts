import { writeFileSync, mkdirSync, existsSync } from "node:fs";

const archivo = existsSync(".env.local") ? ".env.local" : ".env";
process.loadEnvFile(archivo);

async function main() {
  const { prisma } = await import("@/lib/prisma");
  const { calcularDeuda } = await import("@/lib/deuda");
  const { CUOTA_SEMANAL } = await import("@/lib/config");

const form = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  const fecha = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
  const dir = "backup";
  mkdirSync(dir, { recursive: true });
  const alumnos = await prisma.alumno.findMany({ orderBy: { nombre: "asc" } });
  const config = await prisma.configuracion.findUnique({ where: { id: 1 } });
  const [muro, encuestas, opciones, reacciones, sugerencias] = await Promise.all([
    prisma.comentario.count(),
    prisma.encuesta.count(),
    prisma.opcion.count(),
    prisma.reaccion.count(),
    prisma.sugerencia.count(),
  ]);

  const host = (process.env.DATABASE_URL ?? "").match(/@([^:/]+)/)?.[1] ?? "¿?";
  console.log(`Respaldo contra: ${host}`);
  if (host !== "postgres" && !host.includes("neon")) {
    console.warn(
      "[AVISO] El host no parece ser Neon ni el Docker local. Verifica la DATABASE_URL antes de confiar en este archivo.",
    );
  }

  const datos = {
    exportado: new Date().toISOString(),
    host,
    config: config ?? null,
    alumnos,
    totales: {
      alumnos: alumnos.length,
      comentarios: muro,
      encuestas,
      opciones,
      reacciones,
      sugerencias,
    },
  };
  const archivoJson = `${dir}/tesorun-${fecha}.json`;
  writeFileSync(archivoJson, JSON.stringify(datos, null, 2), "utf8");

  const sinBom = (s: string) => "\uFEFF" + s;
  const filas = alumnos
    .map((a) => {
      const deuda = calcularDeuda(config?.fechaInicio, a.semanasPagadas);
      return [
        a.nombre,
        a.semanasPagadas,
        a.rachaActual,
        a.mejorRacha,
        a.ultimoPago ? form.format(a.ultimoPago) : "",
        deuda,
        deuda * CUOTA_SEMANAL,
        deuda > 0 ? "Debe" : "Al dia",
      ].join(";");
    })
    .join("\n");
  const csv = [
    "Nombre;Semanas pagadas;Racha actual;Mejor racha;Ultimo pago;Deuda (sem);Deuda ($);Estado",
    filas,
    "",
  ].join("\n");
  const archivoCsv = `${dir}/alumnos-${fecha}.csv`;
  writeFileSync(archivoCsv, sinBom(csv), "utf8");

  let totalSemanas = 0;
  for (const a of alumnos) totalSemanas += a.semanasPagadas;
  console.log(`Alumnos: ${alumnos.length} | Semanas pagadas: ${totalSemanas} | Al dia: ${alumnos.length} (revisa CSV)`);
  console.log(`Creo: ${archivoJson}`);
  console.log(`Creo: ${archivoCsv}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});