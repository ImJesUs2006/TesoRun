"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CUOTA_SEMANAL } from "@/lib/config";
import { calcularDeuda } from "@/lib/deuda";

export type Resultado = { ok: true } | { ok: false; error: string };

const DIA_MS = 86_400_000;

function refrescar() {
  revalidatePath("/");
  revalidatePath("/admin-teso");
}

/**
 * Registra el pago de la cuota semanal de $20 de un alumno.
 * Incrementa semanasPagadas (la deuda baja sola por la formula en vivo),
 * mantiene la racha, guarda la notaAdmin opcional y crea el INGRESO.
 */
export async function registrarPago(alumnoId: string, notaAdmin?: string): Promise<Resultado> {
  const [alumno, config] = await Promise.all([
    prisma.alumno.findUnique({
      where: { id: alumnoId },
      select: { id: true, semanasPagadas: true, rachaActual: true, mejorRacha: true, ultimoPago: true },
    }),
    prisma.configuracion.findUnique({ where: { id: 1 } }),
  ]);

  if (!alumno) return { ok: false, error: "Alumno no encontrado." };

  const deuda = calcularDeuda(config?.fechaInicio, alumno.semanasPagadas);
  // Bloqueo de deuda: no se puede cobrar a quien ya esta al dia.
  if (deuda <= 0) {
    return { ok: false, error: "Este alumno ya está al día. No se genera saldo negativo." };
  }

  const ahora = new Date();
  // Pagar dentro de los ultimos 15 dias mantiene la racha semanal.
  const enRacha = alumno.ultimoPago
    ? ahora.getTime() - alumno.ultimoPago.getTime() <= 15 * DIA_MS
    : false;
  const nuevaRacha = enRacha ? alumno.rachaActual + 1 : 1;
  const mejorRacha = Math.max(alumno.mejorRacha, nuevaRacha);
  const nota = notaAdmin?.trim();

  await prisma.$transaction([
    prisma.alumno.update({
      where: { id: alumno.id },
      data: {
        semanasPagadas: { increment: 1 },
        rachaActual: nuevaRacha,
        mejorRacha,
        ultimoPago: ahora,
      },
    }),
    prisma.transaccion.create({
      data: {
        monto: CUOTA_SEMANAL,
        tipo: "INGRESO",
        descripcion: `Cuota semanal ${CUOTA_SEMANAL} pesos`,
        notaAdmin: nota || null,
        alumnoId: alumno.id,
      },
    }),
  ]);

  refrescar();
  return { ok: true };
}

/**
 * Deshace el ultimo pago registrado del alumno.
 */
export async function deshacerPago(alumnoId: string): Promise<Resultado> {
  const ultimo = await prisma.transaccion.findFirst({
    where: { alumnoId, tipo: "INGRESO" },
    orderBy: { fecha: "desc" },
    select: { id: true },
  });
  if (!ultimo) return { ok: false, error: "No hay pagos que deshacer." };

  const alumno = await prisma.alumno.findUnique({
    where: { id: alumnoId },
    select: { id: true, rachaActual: true },
  });
  if (!alumno) return { ok: false, error: "Alumno no encontrado." };

  await prisma.$transaction([
    prisma.transaccion.delete({ where: { id: ultimo.id } }),
    prisma.alumno.update({
      where: { id: alumnoId },
      data: {
        semanasPagadas: { decrement: 1 },
        rachaActual: Math.max(0, alumno.rachaActual - 1),
      },
    }),
  ]);

  refrescar();
  return { ok: true };
}

/**
 * Actualiza nombre y/o URL de foto de un alumno.
 */
export async function actualizarAlumno(
  alumnoId: string,
  datos: { nombre?: string; avatarUrl?: string },
): Promise<Resultado> {
  const nombre = datos.nombre?.trim();
  if (nombre === "") return { ok: false, error: "El nombre no puede estar vacío." };

  await prisma.alumno.update({
    where: { id: alumnoId },
    data: {
      ...(nombre ? { nombre } : {}),
      ...(datos.avatarUrl !== undefined
        ? { avatarUrl: datos.avatarUrl.trim() || null }
        : {}),
    },
  });

  refrescar();
  return { ok: true };
}

/**
 * Da de alta a un compañero nuevo.
 */
export async function crearAlumno(datos: { nombre: string; avatarUrl?: string }): Promise<Resultado> {
  const nombre = datos.nombre.trim();
  if (!nombre) return { ok: false, error: "El nombre es obligatorio." };

  const avatarUrl = datos.avatarUrl?.trim();

  await prisma.alumno.create({
    data: { nombre, avatarUrl: avatarUrl || null },
  });

  refrescar();
  return { ok: true };
}

/**
 * Da de baja a un alumno. Su historial se conserva (alumnoId -> null).
 */
export async function eliminarAlumno(alumnoId: string): Promise<Resultado> {
  const existe = await prisma.alumno.findUnique({ where: { id: alumnoId }, select: { id: true } });
  if (!existe) return { ok: false, error: "Alumno no encontrado." };

  await prisma.alumno.delete({ where: { id: alumnoId } });

  refrescar();
  return { ok: true };
}

/**
 * Registra un gasto de la tesoreria.
 */
export async function registrarGasto(monto: number, descripcion: string): Promise<Resultado> {
  const montoLimpio = Number(monto);
  if (!Number.isFinite(montoLimpio) || montoLimpio <= 0) {
    return { ok: false, error: "El monto debe ser mayor a $0." };
  }

  const detalle = descripcion.trim();
  if (!detalle) return { ok: false, error: "Describe brevemente el gasto." };

  await prisma.transaccion.create({
    data: { monto: montoLimpio, tipo: "GASTO", descripcion: detalle },
  });

  refrescar();
  return { ok: true };
}

/**
 * Publica un comentario en el tablon publico.
 * Sin PIN: el alumno solo se selecciona. Limite de 3 comentarios por dia por alumno.
 */
export async function publicarComentario(datos: {
  alumnoId: string;
  contenido: string;
}): Promise<Resultado> {
  const contenido = datos.contenido.trim();
  if (!contenido) return { ok: false, error: "Escribe un mensaje antes de publicar." };
  if (contenido.length > 280) return { ok: false, error: "Máximo 280 caracteres." };
  if (!datos.alumnoId) return { ok: false, error: "Selecciona tu nombre." };

  const alumno = await prisma.alumno.findUnique({
    where: { id: datos.alumnoId },
    select: { id: true },
  });
  if (!alumno) return { ok: false, error: "Selecciona tu nombre." };

  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);

  const hoy = await prisma.comentario.count({
    where: { alumnoId: datos.alumnoId, fecha: { gte: inicioHoy } },
  });
  if (hoy >= 3) {
    return { ok: false, error: "Límite alcanzado: máximo 3 comentarios por día." };
  }

  await prisma.comentario.create({
    data: { alumnoId: datos.alumnoId, contenido },
  });

  refrescar();
  return { ok: true };
}

/**
 * Elimina un comentario (basura visible en el panel del tesorero).
 */
export async function eliminarComentario(comentarioId: string): Promise<Resultado> {
  const existe = await prisma.comentario.findUnique({
    where: { id: comentarioId },
    select: { id: true },
  });
  if (!existe) return { ok: false, error: "Comentario no encontrado." };

  await prisma.comentario.delete({ where: { id: comentarioId } });

  refrescar();
  return { ok: true };
}

/**
 * Crea un anuncio para el tablon publico.
 */
export async function crearAnuncio(mensaje: string): Promise<Resultado> {
  const limpio = mensaje.trim();
  if (!limpio) return { ok: false, error: "Escribe el aviso." };

  await prisma.anuncio.create({ data: { mensaje: limpio } });

  refrescar();
  return { ok: true };
}

/**
 * Muestra/oculta un anuncio del tablon publico.
 */
export async function alternarAnuncio(anuncioId: string): Promise<Resultado> {
  const anuncio = await prisma.anuncio.findUnique({
    where: { id: anuncioId },
    select: { id: true, activo: true },
  });
  if (!anuncio) return { ok: false, error: "Anuncio no encontrado." };

  await prisma.anuncio.update({
    where: { id: anuncioId },
    data: { activo: !anuncio.activo },
  });

  refrescar();
  return { ok: true };
}

/**
 * Edita el texto de un anuncio existente.
 */
export async function actualizarAnuncio(anuncioId: string, mensaje: string): Promise<Resultado> {
  const limpio = mensaje.trim();
  if (!limpio) return { ok: false, error: "El aviso no puede quedar vacío." };

  const existe = await prisma.anuncio.findUnique({ where: { id: anuncioId }, select: { id: true } });
  if (!existe) return { ok: false, error: "Anuncio no encontrado." };

  await prisma.anuncio.update({ where: { id: anuncioId }, data: { mensaje: limpio } });

  refrescar();
  return { ok: true };
}

/**
 * Elimina un anuncio del tablon publico.
 */
export async function eliminarAnuncio(anuncioId: string): Promise<Resultado> {
  const existe = await prisma.anuncio.findUnique({ where: { id: anuncioId }, select: { id: true } });
  if (!existe) return { ok: false, error: "Anuncio no encontrado." };

  await prisma.anuncio.delete({ where: { id: anuncioId } });

  refrescar();
  return { ok: true };
}

/**
 * Recalcula rachaActual, mejorRacha y ultimoPago de un alumno
 * a partir de sus ingresos registrados en la BD.
 */
async function recalcularHistorial(alumnoId: string) {
  const pagos = await prisma.transaccion.findMany({
    where: { alumnoId, tipo: "INGRESO" },
    orderBy: { fecha: "asc" },
    select: { fecha: true },
  });

  const ultimoPago = pagos.length > 0 ? pagos[pagos.length - 1].fecha : null;

  // Mejor racha: secuencia mas larga de pagos espaciados <= 15 dias.
  let mejorRacha = 0;
  let corrida = 0;
  let prev: number | null = null;
  for (const p of pagos) {
    const t = p.fecha.getTime();
    corrida = prev === null || t - prev <= 15 * DIA_MS ? corrida + 1 : 1;
    prev = t;
    if (corrida > mejorRacha) mejorRacha = corrida;
  }

  // Racha actual: corrida que termina en el pago mas reciente y sin vencer.
  let rachaActual = 0;
  if (ultimoPago && Date.now() - ultimoPago.getTime() <= 15 * DIA_MS) {
    let corrida = 0;
    let prev2: number | null = null;
    for (let i = pagos.length - 1; i >= 0; i--) {
      const t = pagos[i].fecha.getTime();
      if (prev2 === null || prev2 - t <= 15 * DIA_MS) corrida += 1;
      else break;
      prev2 = t;
    }
    rachaActual = corrida;
  }

  await prisma.alumno.update({
    where: { id: alumnoId },
    data: { ultimoPago, rachaActual, mejorRacha },
  });
}

/**
 * Elimina una transaccion. Si es un INGRESO, revierte la semana
 * correspondiente y recalcula las rachas del alumno.
 */
export async function eliminarTransaccion(transaccionId: string): Promise<Resultado> {
  const t = await prisma.transaccion.findUnique({ where: { id: transaccionId } });
  if (!t) return { ok: false, error: "Transacción no encontrada." };

  if (t.tipo === "INGRESO" && t.alumnoId) {
    await prisma.$transaction([
      prisma.transaccion.delete({ where: { id: transaccionId } }),
      prisma.alumno.update({
        where: { id: t.alumnoId },
        data: {
          semanasPagadas: { decrement: 1 },
        },
      }),
    ]);
    await recalcularHistorial(t.alumnoId);
  } else {
    await prisma.transaccion.delete({ where: { id: transaccionId } });
  }

  refrescar();
  return { ok: true };
}

/**
 * Actualiza la fecha de inicio oficial de recoleccion (fila unica de Configuracion).
 */
export async function actualizarFechaInicio(fechaIso: string): Promise<Resultado> {
  const fecha = fechaIso ? new Date(fechaIso) : null;
  if (!fecha || Number.isNaN(fecha.getTime())) {
    return { ok: false, error: "Fecha inválida." };
  }

  await prisma.configuracion.upsert({
    where: { id: 1 },
    update: { fechaInicio: fecha },
    create: { id: 1, fechaInicio: fecha },
  });

  refrescar();
  return { ok: true };
}