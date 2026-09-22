"use server";

import { cookies, headers } from "next/headers";
import { safeEqual, firmarSesion, COOKIE_SESION, COOKIE_MAX_AGE } from "@/lib/auth";
import type { ResultadoLogin } from "@/lib/tipos";

const VENTANA_BLOQUEO_MS = 15 * 60_000;
const MAX_INTENTOS = 5;

// Tabla de intentos fallidos por IP (en memoria; por instancia en Vercel).
const intentos = new Map<string, number[]>();

function espera(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ipCliente(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

function registrarFallo(ip: string, ahora: number) {
  const sec = (intentos.get(ip) ?? []).filter((t) => ahora - t < VENTANA_BLOQUEO_MS);
  sec.push(ahora);
  intentos.set(ip, sec.length > 60 ? sec.slice(-60) : sec);
}

export async function entrar(pin: string): Promise<ResultadoLogin> {
  const objetivo = process.env.ADMIN_PASSWORD ?? "";
  const ahora = Date.now();
  const ip = await ipCliente();

  // Fuerza bruta: 5 fallos en 15 min bloquean la IP.
  const fallos = (intentos.get(ip) ?? []).filter((t) => ahora - t < VENTANA_BLOQUEO_MS);
  if (fallos.length >= MAX_INTENTOS) {
    await espera(600 + Math.random() * 400);
    return { ok: false, error: "Demasiados intentos. Espera 15 minutos." };
  }

  if (!objetivo) {
    await espera(400);
    return { ok: false, error: "El servidor no tiene PIN configurado (ADMIN_PASSWORD)." };
  }

  const correcto = safeEqual(objetivo, pin);

  // Retardo artificial: iguala el tiempo de respuesta en éxito y fracaso
  // (mitigación de ataques de timing y presión sobre fuerza bruta).
  await espera(350 + Math.random() * 250);

  if (!correcto) {
    registrarFallo(ip, ahora);
    return { ok: false, error: "PIN incorrecto. Revisa con el tesorero." };
  }

  // Éxito: limpia el historial de la IP.
  intentos.delete(ip);

  const tienda = await cookies();
  tienda.set(COOKIE_SESION, await firmarSesion(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return { ok: true };
}