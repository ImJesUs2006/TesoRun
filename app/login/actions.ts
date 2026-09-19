"use server";

import { cookies } from "next/headers";
import { safeEqual, firmarSesion, COOKIE_SESION, COOKIE_MAX_AGE } from "@/lib/auth";

export type ResultadoLogin = { ok: true } | { ok: false; error: string };

export async function entrar(pin: string): Promise<ResultadoLogin> {
  const objetivo = process.env.ADMIN_PASSWORD ?? "";
  if (!objetivo) {
    return { ok: false, error: "El servidor no tiene PIN configurado (ADMIN_PASSWORD)." };
  }
  if (!safeEqual(objetivo, pin)) {
    return { ok: false, error: "PIN incorrecto. Revisa con el tesorero." };
  }

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