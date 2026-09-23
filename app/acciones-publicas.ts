"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { aliasPara } from "@/lib/alias";
import {
  obtenerDeviceId,
  obtenerClienteIP,
  permitirFrecuencia,
  primeraInvalidez,
  esquemaComentario,
  esquemaVoto,
  esquemaEncuestaId,
  esquemaReaccion,
  esquemaSugerencia,
  esquemaEncuesta,
  esquemaReporteSubida,
} from "@/lib/seguridad";
import { MAX_NIVELES_HILO } from "@/lib/limites";
import type { ResPublico } from "@/lib/tipos";

/**
 * Log de diagnóstico para el admin: el navegador sube directo a Cloudinary,
 * así que los fallos de subida llegan aquí fire-and-forget y se imprimen en
 * el terminal del dev server (o en las logs de Vercel en producción).
 */
export async function reportarErrorSubida(datos: unknown): Promise<ResPublico> {
  const parse = esquemaReporteSubida.safeParse(datos);
  if (!parse.success) return { ok: false, error: "Reporte inválido." };

  const ip = await obtenerClienteIP();
  const tope = permitirFrecuencia([`subida_err:${ip}`], 20, 60_000);
  if (!tope.permitido) return { ok: false, error: "Demasiados reportes." };

  const { tipo, status, mensaje } = parse.data;
  console.error(
    `[Cloudinary] fallo al subir ${tipo}` +
      (status ? ` · estado ${status}` : "") +
      (ip ? ` · ip ${ip}` : "") +
      (mensaje ? ` | ${mensaje}` : ""),
  );
  return { ok: true };
}

/**
 * Publica un comentario anónimo (alias estable por deviceId).
 * - Zod valida contenido (max 250), gif/image (allowlist), audio (data URL).
 * - Cooldown de 10 s por deviceId E IP; tope de 30/hora por IP.
 * - Si el autor escribe su nombre, ese es el alias; si no, apodo estable.
 * - parentId opcional = respuesta (hilo) a cualquier comentario, hasta MAX_NIVELES_HILO.
 */
export async function crearComentario(datos: unknown): Promise<ResPublico> {
  const parse = esquemaComentario.safeParse(datos);
  if (!parse.success) return { ok: false, error: primeraInvalidez(parse.error) };

  const [deviceId, ip] = await Promise.all([obtenerDeviceId(), obtenerClienteIP()]);

  const cooldown = permitirFrecuencia([`cmt_cd:${deviceId}`, `cmt_cd_ip:${ip}`], 1, 10_000);
  if (!cooldown.permitido) {
    return {
      ok: false,
      error: "Espera unos segundos entre comentario y comentario.",
      cooldownMs: cooldown.restanteMs,
    };
  }

  const topeHora = permitirFrecuencia([`cmt_h:${ip}`], 30, 3_600_000);
  if (!topeHora.permitido) {
    return { ok: false, error: "Demasiados comentarios por hoy. Descansa un momento." };
  }

  const data = parse.data;
  const nombre = data.nombre?.trim() ?? "";

  // Hilos: se puede responder a cualquier comentario, con tope de
// profundidad (MAX_NIVELES_HILO) para evitar anidación infinita.
let parentId: string | null = data.parentId ?? null;
  if (parentId) {
    let nodo: { parentId: string | null } | null = await prisma.comentario.findUnique({
      where: { id: parentId },
      select: { parentId: true },
    });
    if (!nodo) return { ok: false, error: "El comentario al que respondes ya no existe." };
    let profundidadPadre = 0;
    while (nodo.parentId && profundidadPadre < MAX_NIVELES_HILO) {
      nodo = await prisma.comentario.findUnique({
        where: { id: nodo.parentId },
        select: { parentId: true },
      });
      if (!nodo) return { ok: false, error: "El comentario al que respondes ya no existe." };
      profundidadPadre += 1;
    }
    if (profundidadPadre + 1 > MAX_NIVELES_HILO) {
      return {
        ok: false,
        error: `Los hilos llegan hasta ${MAX_NIVELES_HILO} niveles de profundidad.`,
      };
    }
  }

  await prisma.comentario.create({
    data: {
      alias: nombre.length > 0 ? nombre : aliasPara(deviceId),
      contenido: data.contenido.trim(), // "" (nunca null) si el comentario es solo multimedia
      gifUrl: data.gifUrl || null,
      imageUrl: data.imageUrl || null,
      audioUrl: data.audioUrl || null,
      parentId,
    },
  });

  revalidatePath("/");
  return { ok: true };
}

/**
 * Registra o CAMBIA el voto de una encuesta activa.
 * Si el deviceId ya votó en otra opción, el voto se mueve (1 voto por persona
 * siempre; puedes cambiar de opinión).
 */
export async function votarEncuesta(datos: unknown): Promise<ResPublico> {
  const parse = esquemaVoto.safeParse(datos);
  if (!parse.success) return { ok: false, error: primeraInvalidez(parse.error) };
  const { encuestaId, opcionId } = parse.data;

  const deviceId = await obtenerDeviceId();

  const encuesta = await prisma.encuesta.findUnique({
    where: { id: encuestaId },
    select: { activa: true },
  });
  if (!encuesta) return { ok: false, error: "Encuesta no encontrada." };
  if (!encuesta.activa) return { ok: false, error: "Esta encuesta ya está cerrada." };

  const opcion = await prisma.opcion.findUnique({
    where: { id: opcionId },
    select: { encuestaId: true },
  });
  if (!opcion || opcion.encuestaId !== encuestaId) {
    return { ok: false, error: "Opción inválida." };
  }

  const actual = await prisma.opcion.findFirst({
    where: { encuestaId, votantes: { has: deviceId } },
    select: { id: true, votantes: true },
  });
  if (actual) {
    // Ya votó en esta misma opción: no cambia nada.
    if (actual.id === opcionId) return { ok: true };
    // Cambia de voto: restar del anterior y sumar al nuevo.
    await prisma.$transaction([
      prisma.opcion.update({
        where: { id: actual.id },
        data: {
          votos: { decrement: 1 },
          votantes: { set: actual.votantes.filter((v) => v !== deviceId) },
        },
      }),
      prisma.opcion.update({
        where: { id: opcionId },
        data: { votos: { increment: 1 }, votantes: { push: deviceId } },
      }),
    ]);
  } else {
    await prisma.opcion.update({
      where: { id: opcionId },
      data: { votos: { increment: 1 }, votantes: { push: deviceId } },
    });
  }

  revalidatePath("/");
  return { ok: true };
}

/**
 * Encuestas públicas: límite GLOBAL diario (anti-spam) tomado de la tabla
 * Configuracion. El admin puede ajustarlo con actualizarConfiguracion.
 */
export async function crearEncuesta(datos: unknown): Promise<ResPublico> {
  const parse = esquemaEncuesta.safeParse(datos);
  if (!parse.success) return { ok: false, error: primeraInvalidez(parse.error) };

  const configuracion = await prisma.configuracion.findUnique({
    where: { id: 1 },
    select: { maxEncuestasDiarias: true },
  });
  const maxDiarias = configuracion?.maxEncuestasDiarias ?? 5;

  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);
  const creadasHoy = await prisma.encuesta.count({ where: { fecha: { gte: inicioDia } } });
  if (creadasHoy >= maxDiarias) {
    return {
      ok: false,
      error: `Límite de hoy alcanzado (${maxDiarias} encuestas). Vuelve mañana.`,
    };
  }

  const deviceId = await obtenerDeviceId();
  const { pregunta, opciones } = parse.data;
  await prisma.encuesta.create({
    data: {
      pregunta,
      creadorId: deviceId,
      opciones: { create: opciones.map((texto) => ({ texto })) },
    },
  });

  revalidatePath("/");
  return { ok: true };
}

/**
 * Cierra una encuesta propia (deviceId === creadorId). Verificado en servidor.
 */
export async function cerrarEncuesta(datos: unknown): Promise<ResPublico> {
  const parse = esquemaEncuestaId.safeParse(datos);
  if (!parse.success) return { ok: false, error: primeraInvalidez(parse.error) };

  const deviceId = await obtenerDeviceId();
  const encuesta = await prisma.encuesta.findUnique({
    where: { id: parse.data.encuestaId },
    select: { id: true, creadorId: true, activa: true },
  });
  if (!encuesta) return { ok: false, error: "Encuesta no encontrada." };
  if (!encuesta.activa) return { ok: true };
  if (encuesta.creadorId && encuesta.creadorId !== deviceId) {
    return { ok: false, error: "Solo el creador puede cerrar su encuesta." };
  }
  if (!encuesta.creadorId) return { ok: false, error: "Solo el admin puede cerrar encuestas oficiales." };

  await prisma.encuesta.update({ where: { id: encuesta.id }, data: { activa: false } });
  revalidatePath("/");
  return { ok: true };
}

/**
 * Elimina UNA encuesta propia (deviceId === creadorId). Verified en servidor.
 * Las encuestas oficiales del admin solo se borran desde el panel.
 */
export async function eliminarEncuestaPropia(datos: unknown): Promise<ResPublico> {
  const parse = esquemaEncuestaId.safeParse(datos);
  if (!parse.success) return { ok: false, error: primeraInvalidez(parse.error) };

  const deviceId = await obtenerDeviceId();
  const encuesta = await prisma.encuesta.findUnique({
    where: { id: parse.data.encuestaId },
    select: { id: true, creadorId: true },
  });
  if (!encuesta) return { ok: false, error: "Encuesta no encontrada." };
  if (!encuesta.creadorId) return { ok: false, error: "Solo el admin puede eliminar encuestas oficiales." };
  if (encuesta.creadorId !== deviceId) {
    return { ok: false, error: "Solo el creador puede eliminar su encuesta." };
  }

  await prisma.encuesta.delete({ where: { id: encuesta.id } });
  revalidatePath("/");
  return { ok: true };
}

/**
 * Reacciona con cualquier emoji (toggle). 1 deviceId por emoji; 12 toggles/min.
 */
export async function toggleReaccion(datos: unknown): Promise<ResPublico> {
  const parse = esquemaReaccion.safeParse(datos);
  if (!parse.success) return { ok: false, error: primeraInvalidez(parse.error) };
  const { comentarioId, emoji } = parse.data;

  const [deviceId, ip] = await Promise.all([obtenerDeviceId(), obtenerClienteIP()]);
  const tope = permitirFrecuencia([`reac:${deviceId}`, `reac_ip:${ip}`], 12, 60_000);
  if (!tope.permitido) return { ok: false, error: "Demasiadas reacciones por minuto." };

  const comentario = await prisma.comentario.findUnique({
    where: { id: comentarioId },
    select: { id: true },
  });
  if (!comentario) return { ok: false, error: "Comentario no encontrado." };

  const reaccion = await prisma.reaccion.findUnique({
    where: { comentarioId_emoji: { comentarioId, emoji } },
  });

  if (!reaccion) {
    await prisma.reaccion.create({ data: { comentarioId, emoji, votantes: [deviceId] } });
  } else {
    const ya = reaccion.votantes.includes(deviceId);
    const nuevos = ya
      ? reaccion.votantes.filter((v) => v !== deviceId)
      : [...reaccion.votantes, deviceId];
    if (nuevos.length === 0) {
      await prisma.reaccion.delete({ where: { id: reaccion.id } });
    } else {
      await prisma.reaccion.update({ where: { id: reaccion.id }, data: { votantes: nuevos } });
    }
  }

  revalidatePath("/");
  return { ok: true };
}

/**
 * Buzón de sugerencias: máximo 1 por hora por deviceId/IP.
 */
export async function crearSugerencia(datos: unknown): Promise<ResPublico> {
  const parse = esquemaSugerencia.safeParse(datos);
  if (!parse.success) return { ok: false, error: primeraInvalidez(parse.error) };

  const [deviceId, ip] = await Promise.all([obtenerDeviceId(), obtenerClienteIP()]);
  const hora = permitirFrecuencia([`sug:${deviceId}`, `sug_ip:${ip}`], 1, 3_600_000);
  if (!hora.permitido) {
    return { ok: false, error: "Solo puedes enviar una sugerencia por hora.", cooldownMs: hora.restanteMs };
  }

  await prisma.sugerencia.create({ data: { mensaje: parse.data.mensaje } });
  revalidatePath("/");
  return { ok: true };
}