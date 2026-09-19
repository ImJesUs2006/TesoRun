import { prisma } from "@/lib/prisma";
import { ToastProvider } from "@/components/admin/toast-provider";
import { BotonSonido } from "@/components/admin/boton-sonido";
import { ConfigFecha } from "@/components/admin/config-fecha";
import { FormNuevoAlumno } from "@/components/admin/form-nuevo-alumno";
import { GestionAnuncios } from "@/components/admin/gestion-anuncios";
import { GestionComentarios } from "@/components/admin/gestion-comentarios";
import { HistorialTransacciones } from "@/components/admin/historial-transacciones";
import { Resumen } from "@/components/admin/resumen";
import { TablaAdmin } from "@/components/admin/tabla-admin";
import { calcularDeuda } from "@/lib/deuda";

export const dynamic = "force-dynamic";

export default async function AdminTesoPage() {
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [alumnos, anuncios, transacciones, ingresosMes, gastosMes, comentarios, configuracion] =
    await Promise.all([
      prisma.alumno.findMany({ orderBy: { nombre: "asc" } }),
      prisma.anuncio.findMany({ orderBy: { fecha: "desc" }, take: 20 }),
      prisma.transaccion.findMany({
        orderBy: { fecha: "desc" },
        take: 60,
        include: { alumno: { select: { nombre: true } } },
      }),
      prisma.transaccion.aggregate({
        where: { tipo: "INGRESO", fecha: { gte: inicioMes } },
        _sum: { monto: true },
      }),
      prisma.transaccion.aggregate({
        where: { tipo: "GASTO", fecha: { gte: inicioMes } },
        _sum: { monto: true },
      }),
      prisma.comentario.findMany({
        orderBy: { fecha: "desc" },
        take: 50,
        include: { alumno: { select: { nombre: true } } },
      }),
      prisma.configuracion.findUnique({ where: { id: 1 } }),
    ]);

  const recaudado = ingresosMes._sum.monto ?? 0;
  const gastos = gastosMes._sum.monto ?? 0;

  // Deuda en tiempo real (no se guarda en BD).
  const alumnosConDeuda = alumnos.map((a) => ({
    ...a,
    deuda: calcularDeuda(configuracion?.fechaInicio, a.semanasPagadas),
  }));
  const morosos = alumnosConDeuda.filter((a) => a.deuda > 0).length;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <header className="flex flex-wrap items-center justify-center gap-4">
        <div className="rotate-[1.5deg] rounded-xl border-4 border-black bg-violet-500 px-8 py-3 shadow-[8px_8px_0_0_#000]">
          <h1 className="font-display text-5xl tracking-tight text-white">ÁREA RESTRINGIDA</h1>
        </div>
        <BotonSonido />
      </header>

      <p className="text-center font-bold text-black/70">
        Panel del tesorero · cada +$20 es una semana saldada
      </p>

      <ToastProvider>
        <Resumen recaudado={recaudado} gastos={gastos} morosos={morosos} alumnos={alumnos.length} />

        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="/api/reporte-excel"
            className="rounded-full border-4 border-black bg-emerald-400 px-6 py-3 font-display text-lg text-black shadow-[5px_5px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-emerald-300 active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            Descargar Excel
          </a>
          <a
            href="/"
            className="rounded-full border-4 border-black bg-white px-6 py-3 font-display text-lg text-black shadow-[5px_5px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-yellow-200"
          >
            ← Ver cancha
          </a>
          <a
            href="/api/logout"
            className="rounded-full border-4 border-black bg-red-400 px-6 py-3 font-display text-lg text-white shadow-[5px_5px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-red-300"
          >
            Cerrar sesión
          </a>
        </div>

        <ConfigFecha fechaInicio={configuracion?.fechaInicio ?? null} />

        <GestionAnuncios
          anuncios={anuncios.map((a) => ({
            id: a.id,
            mensaje: a.mensaje,
            activo: a.activo,
            fecha: a.fecha,
          }))}
        />

        <GestionComentarios
          comentarios={comentarios.map((c) => ({
            id: c.id,
            contenido: c.contenido,
            fecha: c.fecha,
            alumnoNombre: c.alumno.nombre,
          }))}
        />

        <FormNuevoAlumno />

        <TablaAdmin alumnos={alumnosConDeuda} />

        <HistorialTransacciones
          transacciones={transacciones.map((t) => ({
            id: t.id,
            monto: t.monto,
            tipo: t.tipo,
            descripcion: t.descripcion,
            notaAdmin: t.notaAdmin,
            fecha: t.fecha,
            alumnoNombre: t.alumno?.nombre,
          }))}
        />
      </ToastProvider>
    </main>
  );
}