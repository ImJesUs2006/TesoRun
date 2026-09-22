"use client";

import { reportarErrorSubida } from "@/app/acciones-publicas";

// Subida directa (unsigned) a Cloudinary desde el navegador, sin pasar por
// Server Actions (evita el límite de payload de Vercel, error 413).
// Requiere en .env.local:
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
//   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

export type TipoSubida = "imagen" | "audio";

export type ResultadoSubida =
  | { ok: true; url: string }
  | { ok: false; error: string };

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

/** Fire-and-forget para que el fallo también aparezca en el server (dev terminal). */
function reportar(tipo: TipoSubida, status: number | undefined, mensaje: string) {
  reportarErrorSubida({ tipo, status, mensaje }).catch(() => {
    // si el reporte falla (el propio servidor caído), no hacemos nada más
  });
}

/**
 * Sube un Blob/File directamente a Cloudinary y devuelve el secure_url.
 * Nota: deja que Cloudinary detecte el tipo; la extensión es solo informativa.
 */
export async function subirACloudinary(
  archivo: Blob | File,
  tipo: TipoSubida,
): Promise<ResultadoSubida> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    // Las NEXT_PUBLIC_ se inyectan al arrancar el dev server: tras editar .env
    // hay que reiniciar `npm run dev`.
    console.error(
      "[Cloudinary] Faltan variables: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME y/o NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET. Reinicia el dev server si las acabas de editar.",
    );
    reportar(tipo, undefined, "Faltan NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME y/o UPLOAD_PRESET");
    return { ok: false, error: "Cloudinary no está configurado en el servidor." };
  }

  const nombre = tipo === "audio" ? "nota-de-voz" : `imagen-${Date.now()}`;
  const fd = new FormData();
  fd.append("file", new File([archivo], nombre, { type: archivo.type || "application/octet-stream" }));
  fd.append("upload_preset", UPLOAD_PRESET);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      { method: "POST", body: fd },
    );
    const texto = await res.text();
    if (!res.ok) {
      // Muestra el detalle real de Cloudinary (p. ej. "File size too large…")
      // en la consola del navegador, en el terminal del dev server (vía
      // reportarErrorSubida) y en el toast del usuario.
      let detalle = "Error del servidor al procesar el archivo";
      try {
        const j = JSON.parse(texto);
        if (typeof j?.error?.message === "string" && j.error.message) detalle = j.error.message;
      } catch {
        // cuerpo no JSON: solo loguear
      }
      console.error(
        "[Cloudinary] Estado " + res.status + " al subir " + tipo,
        texto.slice(0, 800),
      );
      reportar(tipo, res.status, detalle);
      return { ok: false, error: detalle };
    }

    const datos = JSON.parse(texto);
    if (typeof datos?.secure_url !== "string") {
      return { ok: false, error: "Cloudinary no devolvió una URL de imagen." };
    }
    return { ok: true, url: datos.secure_url };
  } catch {
    // fetch rechazó: sin internet, DNS, bloqueado, etc. ("Failed to fetch")
    console.error("[Cloudinary] fallo de red al subir " + tipo);
    reportar(tipo, undefined, "Red: Failed to fetch");
    return { ok: false, error: "Error de conexión: Revisa tu internet" };
  }
}