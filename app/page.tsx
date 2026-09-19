import { prisma } from "@/lib/prisma";
import { META_MENSUAL } from "@/lib/config";
import { calcularDeuda } from "@/lib/deuda";
import { ArrowDownToLine, Banknote, CalendarDays, FileSpreadsheet, Scale } from "lucide-react";
import { AnunciosCinta } from "@/components/anuncios-cinta";
import { CarruselSeBusca } from "@/components/carrusel-se-busca";
import { ListaAlumnos } from "@/components/lista-alumnos";
import { ListaNegra } from "@/components/lista-negra";
import { MuroGastos } from "@/components/muro-gastos";
import { PistaCarreras } from "@/components/pista-carreras";
import { PodioHeroes } from "@/components/podio-heroes";
import { TablonComentarios } from "@/components/comentarios";
import type { NotaTransaccion } from "@/lib/tipos";

export const dynamic = "force-dynamic";

const DIA_MS = 86_400_000;
const DIAS_PURGA_COMENTARIOS = 21;

export default async function HomePage() {
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const inicioVentana = new Date(Date.now() - 12 * 7 * DIA_MS);

  // Purga automática: los comentarios con más de 21 días se eliminan al consultar.
  await prisma.comentario.deleteMany({
    where: { fecha: { lt: new Date(Date.now() - DIAS_PURGA_COMENTARIOS * DIA_MS) } },
  });

  const [alumnos, anuncios, comentarios, pagos, ingresosMes, gastosMes, gastos, configuracion] =
    await Promise.all([
      prisma.alumno.findMany({
        orderBy: [{ semanasPagadas: "desc" }, { mejorRacha: "desc" }],
      }),
      prisma.anuncio.findMany({ where: { activo: true }, orderBy: { fecha: "desc" }, take: 5 }),
      prisma.comentario.findMany({
        orderBy: { fecha: "desc" },
        take: 25,
        include: { alumno: { select: { nombre: true } } },
      }),
      prisma.transaccion.findMany({
        where: { tipo: "INGRESO", fecha: { gte: inicioVentana } },
        orderBy: { fecha: "desc" },
        select: { id: true, fecha: true, monto: true, notaAdmin: true, alumnoId: true },
      }),
      prisma.transaccion.aggregate({
        where: { tipo: "INGRESO", fecha: { gte: inicioMes } },
        _sum: { monto: true },
      }),
      prisma.transaccion.aggregate({
        where: { tipo: "GASTO", fecha: { gte: inicioMes } },
        _sum: { monto: true },
      }),
      prisma.transaccion.findMany({
        where: { tipo: "GASTO" },
        orderBy: { fecha: "desc" },
        take: 12,
      }),
      prisma.configuracion.findUnique({ where: { id: 1 } }),
    ]);

  const pagosPorAlumno: Record<string, Date[]> = {};
  const notasPorAlumno: Record<string, NotaTransaccion[]> = {};

  for (const t of pagos) {
    if (!t.alumnoId) continue;
    (pagosPorAlumno[t.alumnoId] ??= []).push(t.fecha);
    if (t.notaAdmin) {
      (notasPorAlumno[t.alumnoId] ??= []).push({
        id: t.id,
        fecha: t.fecha,
        monto: t.monto,
        notaAdmin: t.notaAdmin,
      });
    }
  }

  const fechaBase = configuracion?.fechaInicio ?? new Date(Date.now() - 8 * 7 * DIA_MS);
  const alumnosConDeuda = alumnos.map((a) => ({
    ...a,
    deuda: calcularDeuda(fechaBase, a.semanasPagadas),
  }));

  const heroes = alumnosConDeuda.filter((a) => a.deuda === 0);
  const morosos = alumnosConDeuda.filter((a) => a.deuda > 0);
  const recaudado = ingresosMes._sum.monto ?? 0;
  const gastosTotal = gastosMes._sum.monto ?? 0;
  const saldo = recaudado - gastosTotal;

  const inicioRecoleccion = configuracion?.fechaInicio;
  const semanaActual = inicioRecoleccion
    ? Math.max(1, Math.floor((Date.now() - inicioRecoleccion.getTime()) / (7 * DIA_MS)) + 1)
    : null;

  return (
    <main className="mx-auto max-w-5xl space-y-14 px-4 py-10">
      <AnunciosCinta anuncios={anuncios} />

      <header className="flex flex-col items-center gap-4">
        <div className="rotate-[-2deg] rounded-full border-4 border-black bg-orange-400 px-8 py-3 shadow-[8px_8px_0_0_#000]">
          <h1 className="font-display text-6xl tracking-tight text-black sm:text-7xl">
            TESORUN
          </h1>
        </div>
        <p className="rounded-lg border-4 border-black bg-black px-4 py-2 font-bold text-yellow-300 shadow-[4px_4px_0_0_#000]">
          Cuota semanal: $20 · Sin morosos, sin dramas
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-lime-300 px-3 py-1 font-black text-black">
            <Banknote className="h-4 w-4" /> Recaudado: ${recaudado}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-red-300 px-3 py-1 font-black text-black">
            <ArrowDownToLine className="h-4 w-4" /> Gastos: ${gastosTotal}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-white px-3 py-1 font-black text-black">
            <Scale className="h-4 w-4" /> Saldo del mes: {saldo >= 0 ? "+" : ""}${saldo}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/api/reporte-excel"
            className="inline-flex items-center gap-2 rounded-full border-4 border-black bg-emerald-400 px-5 py-2.5 font-display text-base text-black shadow-[5px_5px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-emerald-300 active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            <FileSpreadsheet className="h-5 w-5" /> Descargar Excel
          </a>
          {semanaActual && inicioRecoleccion && (
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-white px-3 py-1 font-black text-black">
              <CalendarDays className="h-4 w-4" /> Semana {semanaActual} de recolección
            </span>
          )}
        </div>
      </header>

      <PistaCarreras recaudado={recaudado} meta={META_MENSUAL} />

      <PodioHeroes
        heroes={heroes}
        pagos={pagosPorAlumno}
        notas={notasPorAlumno}
      />

      {morosos.length > 0 ? (
        <CarruselSeBusca
          buscados={morosos}
          pagos={pagosPorAlumno}
          notas={notasPorAlumno}
        />
      ) : (
        <section className="flex flex-col items-center gap-3 rounded-xl border-4 border-black bg-white p-8 text-center shadow-[10px_10px_0_0_#000]">
          <p className="font-display text-3xl text-black">Todos al día</p>
          <p className="font-semibold text-black/70">Nadie debe. El grupo está imparable.</p>
        </section>
      )}

      <ListaNegra
        morosos={morosos}
        pagos={pagosPorAlumno}
        notas={notasPorAlumno}
      />

      <ListaAlumnos
        alumnos={alumnosConDeuda}
        pagos={pagosPorAlumno}
        notas={notasPorAlumno}
      />

      <MuroGastos
        gastos={gastos.map((g) => ({
          id: g.id,
          monto: g.monto,
          descripcion: g.descripcion,
          fecha: g.fecha,
        }))}
      />

      <TablonComentarios
        alumnos={alumnos.map((a) => ({ id: a.id, nombre: a.nombre }))}
        comentarios={comentarios.map((c) => ({
          id: c.id,
          contenido: c.contenido,
          fecha: c.fecha,
          alumnoNombre: c.alumno.nombre,
        }))}
      />
    </main>
  );
}