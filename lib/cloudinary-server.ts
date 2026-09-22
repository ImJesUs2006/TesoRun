// Solo corre en el servidor (nunca importar desde un Client Component).
import "server-only";
import { v2 as cloudinary } from "cloudinary";

// Credenciales API secretas. Mismo cloud name que NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? "";
const API_KEY = process.env.CLOUDINARY_API_KEY ?? "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "";

/**
 * Extrae el public_id de una URL de Cloudinary, o null si no lo es.
 * Soporta: res.cloudinary.com/<cloud>/<tipo>/upload/v<VERSION>/<public_id>.<ext>
 * y variantes sin versión o sin extensión.
 */
export function extraerPublicId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname !== "res.cloudinary.com") return null;

    const partes = u.pathname.split("/").filter(Boolean);
    const idx = partes.indexOf("upload");
    if (idx === -1) return null;

    let resto = partes.slice(idx + 1);
    if (resto[0]?.startsWith("v") && /^\d+$/.test(resto[0].slice(1))) {
      resto = resto.slice(1);
    }
    if (resto.length === 0) return null;

    // Quitar la extensión del último segmento.
    const ultimo = resto[resto.length - 1];
    resto[resto.length - 1] = ultimo.replace(/\.[A-Za-z0-9]+$/, "");
    return resto.join("/");
  } catch {
    return null;
  }
}

let configurado = false;

/**
 * Destruye el archivo físico en Cloudinary dado su secure_url.
 * Nunca lanza: si no hay credenciales o la red falla, la eliminación en la BD
 * igual continúa (borrar el registro es lo prioritario).
 */
export async function destruirArchivoCloudinary(url: string | null | undefined): Promise<void> {
  const publicId = extraerPublicId(url);
  if (!publicId) return;

  if (!CLOUD_NAME || !API_KEY || !API_SECRET) return; // credenciales no configuradas

  if (!configurado) {
    cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET });
    configurado = true;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // No romper el borrado del comentario si Cloudinary está inalcanzable.
  }
}