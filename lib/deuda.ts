import { CUOTA_SEMANAL } from "@/lib/config";

const DIA_MS = 86_400_000;

/** Semanas transcurridas (enteras) entre la fecha de inicio y hoy. */
export function semanasTranscurridas(fechaInicio: Date | null | undefined): number {
  if (!fechaInicio) return 0;
  const t = fechaInicio.getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / (7 * DIA_MS)));
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