import { cookies, headers } from "next/headers";
import { z } from "zod";
import {
  MAX_CONTENIDO,
  MAX_SUGERENCIA,
  MAX_AUDIO_BYTES,
  MAX_IMAGEN_BYTES,
} from "./limites";

export { MAX_CONTENIDO, MAX_SUGERENCIA, MAX_AUDIO_BYTES, MAX_IMAGEN_BYTES };

export const COOKIE_DEVICE = "tesorun_device";

const HOSTS_MULTIMEDIA_PERMITIDOS = [
  "media.giphy.com",
  "media0.giphy.com",
  "media1.giphy.com",
  "media2.giphy.com",
  "media3.giphy.com",
  "media4.giphy.com",
  "media0.giphy-media.com",
  "media1.giphy-media.com",
  "media2.giphy-media.com",
  "media3.giphy-media.com",
  "media4.giphy-media.com",
  "i.giphy.com",
  "res.cloudinary.com",
];

/** ID de dispositivo autogenerado (cookie httpOnly). Se crea bajo demanda. */
export async function obtenerDeviceId(): Promise<string> {
  const tienda = await cookies();
  const vigente = tienda.get(COOKIE_DEVICE)?.value;
  if (vigente && vigente.startsWith("dev_")) return vigente;

  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const nuevo = "dev_" + Buffer.from(bytes).toString("base64url");
  tienda.set(COOKIE_DEVICE, nuevo, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return nuevo;
}

/** IP del cliente (proxy-friendly). Fallback a "local" en desarrollo local. */
export async function obtenerClienteIP(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

// ---------------------------------------------------------------------------
// Rate limiting en memoria (por instancia). Suficiente para el cooldown
// anti-script; en Vercel cada instancia aporta su propia valla.
// ---------------------------------------------------------------------------
const marcas = new Map<string, number[]>();
const TAM_SECUENCIA_MAX = 60;

export type Frecuencia = { permitido: boolean; restanteMs: number };

export function permitirFrecuencia(
  claves: readonly string[],
  limitePorVentana: number,
  ventanaMs: number,
  ahora: number = Date.now(),
): Frecuencia {
  let minRestante = 0;
  for (const clave of claves) {
    if (!clave) continue;
    const sec = (marcas.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
    if (sec.length >= limitePorVentana) {
      minRestante = Math.max(minRestante, sec[0] + ventanaMs - ahora);
    }
  }
  if (minRestante > 0) return { permitido: false, restanteMs: minRestante };

  for (const clave of claves) {
    if (!clave) continue;
    const sec = (marcas.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
    sec.push(ahora);
    marcas.set(clave, sec.length > TAM_SECUENCIA_MAX ? sec.slice(-TAM_SECUENCIA_MAX) : sec);
  }
  return { permitido: true, restanteMs: 0 };
}

// ---------------------------------------------------------------------------
// Validación estricta (Zod) de todo lo que entra por Server Actions públicas.
// ---------------------------------------------------------------------------

/** URL multimedia permitida: catálogo local o HTTPS en hosts confiables (nada de HTTP/MITM). */
function esUrlMultimediaPermitida(url: string): boolean {
  if (url.startsWith("/gifs/")) return true; // catálogo local
  try {
    const u = new URL(url);
    return u.protocol === "https:" && HOSTS_MULTIMEDIA_PERMITIDOS.includes(u.hostname);
  } catch {
    return false;
  }
}

export const esquemaComentario = z
  .object({
    contenido: z.string().trim().max(MAX_CONTENIDO).or(z.literal("")),
    gifUrl: z.string().trim().max(600).or(z.literal("")).optional(),
    imageUrl: z.string().trim().max(600).or(z.literal("")).optional(),
    audioUrl: z.string().trim().max(600).or(z.literal("")).optional(),
  })
  .refine(
    (v) =>
      v.contenido.trim().length > 0 ||
      (v.gifUrl ?? "").length > 0 ||
      (v.imageUrl ?? "").length > 0 ||
      (v.audioUrl ?? "").length > 0,
    { message: "Escribe un mensaje, agrega un GIF o graba una nota de voz." },
  )
  .refine((v) => !v.gifUrl || esUrlMultimediaPermitida(v.gifUrl), {
    message: "Ese GIF no está permitido.",
  })
  .refine((v) => !v.imageUrl || esUrlMultimediaPermitida(v.imageUrl), {
    message: "Esa imagen no está permitida.",
  })
  .refine((v) => !v.audioUrl || esUrlMultimediaPermitida(v.audioUrl), {
    message: "Ese audio no está permitido.",
  });

export const esquemaConfiguracion = z.object({
  maxEncuestasDiarias: z.number().int().min(1).max(100),
});

export const esquemaVoto = z.object({
  encuestaId: z.string().min(1).max(64),
  opcionId: z.string().min(1).max(64),
});

export const esquemaEncuestaId = z.object({
  encuestaId: z.string().min(1).max(64),
});

/** Cualquier emoji UTF-8: periodos de secuencia ZWJ, tonos de piel, banderas… */
export function esEmojiValido(emoji: string): boolean {
  if (emoji.length === 0 || emoji.length > 16) return false;
  if (/[\u0000-\u001F\u007F]/.test(emoji)) return false;
  return /\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Regional_Indicator}/u.test(emoji);
}

export const esquemaReaccion = z.object({
  comentarioId: z.string().min(1).max(64),
  emoji: z
    .string()
    .min(1)
    .max(16)
    .refine(esEmojiValido, { message: "Eso no parece un emoji." }),
});

export const esquemaSugerencia = z.object({
  mensaje: z.string().trim().min(1).max(MAX_SUGERENCIA),
});

export const esquemaIds = z.array(z.string().min(1).max(64)).max(200);

/** Telémetro del cliente para reportar fallos de subida a Cloudinary (diagnóstico). */
export const esquemaReporteSubida = z.object({
  tipo: z.enum(["imagen", "audio"]),
  status: z.number().int().min(100).max(599).optional(),
  mensaje: z.string().trim().max(500).optional(),
});

export const esquemaEncuesta = z.object({
  pregunta: z.string().trim().min(3).max(200),
  opciones: z.array(z.string().trim().min(1).max(120)).min(2).max(8),
});

export function primeraInvalidez(e: z.ZodError): string {
  return e.issues[0]?.message ?? "Datos inválidos.";
}