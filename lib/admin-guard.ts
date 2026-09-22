import { cookies } from "next/headers";
import { validarSesion, COOKIE_SESION } from "@/lib/auth";

/**
 * Verifica que la petición venga de una sesión de admin válida.
 * Se usa en TODAS las Server Actions del panel para que no puedan
 * invocarse directamente desde fuera de /admin-teso.
 */
export async function esAdminSesion(): Promise<boolean> {
  const tienda = await cookies();
  return validarSesion(tienda.get(COOKIE_SESION)?.value);
}