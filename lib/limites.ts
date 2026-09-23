// Límites compartidos entre cliente y servidor (módulo puro, sin Node APIs).
export const MAX_CONTENIDO = 250;
export const MAX_NOMBRE = 24; // longitud máxima del nombre/apodo elegido en un comentario
export const MAX_SUGERENCIA = 500;
export const MAX_AUDIO_BYTES = 3_000_000; // 3 MB como máximo antes de subir a Cloudinary
export const MAX_IMAGEN_BYTES = 1_500_000; // 1.5 MB como máximo antes de subir a Cloudinary
export const COOLDOWN_COMENTARIO_MS = 10_000;
export const UNA_SUGERENCIA_POR_HORA_MS = 3_600_000;
export const MAX_NIVELES_HILO = 3; // profundidad máxima de un hilo: raíz (1) + respuestas (2) + respuestas de respuestas (3)
export const COMENTARIOS_ADMIN_POR_PAGINA = 10; // página de comentarios del panel admin