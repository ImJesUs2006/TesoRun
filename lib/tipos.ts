export type AlumnoPublico = {
  id: string;
  nombre: string;
  avatarUrl: string | null;
  semanasPagadas: number;
  deuda: number;
  rachaActual: number;
  mejorRacha: number;
};

export type NotaTransaccion = {
  id: string;
  fecha: Date;
  monto: number;
  notaAdmin: string;
};

// Resultados de Server Actions (viven aquí, NUNCA en archivos "use server").
export type Resultado = { ok: true } | { ok: false; error: string };

export type ResPublico = { ok: true } | { ok: false; error: string; cooldownMs?: number };

export type ResultadoLogin = { ok: true } | { ok: false; error: string };