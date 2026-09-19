import { CUOTA_SEMANAL } from "@/lib/config";

const DIA_MS = 86_400_000;

/** Semanas transcurridas (enteras) entre la fecha de inicio y hoy.
 *  La semana en curso cuenta: pones la fecha y esa misma semana ya es signada. */
export function semanasTranscurridas(fechaInicio: Date | null | undefined): number {
  if (!fechaInicio) return 0;
  const t = fechaInicio.getTime();
  if (!Number.isFinite(t)) return 0;
  const dias = Math.floor((Date.now() - t) / DIA_MS);
  if (dias < 0) return 0; // la recolección aún no empieza
  return Math.floor(dias / 7) + 1;
}

/**
 * Deuda calculada en tiempo real (en semanas):
 * Deuda = max(0, semanas transcurridas desde fechaInicio - semanasPagadas).
 */
export function calcularDeuda(fechaInicio: Date | null | undefined, semanasPagadas: number): number {
  return Math.max(0, semanasTranscurridas(fechaInicio) - semanasPagadas);
}

export function deudaEnPesos(semanasDeuda: number): number {
  return semanasDeuda * CUOTA_SEMANAL;
}