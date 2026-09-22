// Límites compartidos entre cliente y servidor (módulo puro, sin Node APIs).
export const MAX_CONTENIDO = 250;
export const MAX_SUGERENCIA = 500;
export const MAX_AUDIO_BYTES = 3_000_000; // 3 MB como máximo antes de subir a Cloudinary
export const MAX_IMAGEN_BYTES = 1_500_000; // 1.5 MB como máximo antes de subir a Cloudinary
export const COOLDOWN_COMENTARIO_MS = 10_000;
export const UNA_SUGERENCIA_POR_HORA_MS = 3_600_000;