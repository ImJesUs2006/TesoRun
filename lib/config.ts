export const CUOTA_SEMANAL = 20;

export const META_MENSUAL = Number(process.env.META_MENSUAL_PESOS ?? 2000);

export function mesesDeudaPesos(semanasDeuda: number): number {
  return semanasDeuda * CUOTA_SEMANAL;
}