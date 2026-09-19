export type ClaveInsignia = "al-dia" | "racha" | "constante" | "veterano" | "peligro";

export type Insignia = {
  clave: ClaveInsignia;
  etiqueta: string;
  titulo: string;
};

type DatosAlumno = {
  deuda: number;
  semanasPagadas: number;
  rachaActual: number;
};

export function insigniasDe(alumno: DatosAlumno): Insignia[] {
  const out: Insignia[] = [];

  if (alumno.deuda <= 0) {
    out.push({ clave: "al-dia", etiqueta: "Al día", titulo: "Sin deudas pendientes" });
  }
  if (alumno.rachaActual >= 3) {
    out.push({
      clave: "racha",
      etiqueta: `Racha ${alumno.rachaActual}`,
      titulo: "Pagos semanales consecutivos",
    });
  }
  if (alumno.semanasPagadas >= 10) {
    out.push({ clave: "veterano", etiqueta: "Veterano", titulo: "10+ semanas pagadas" });
  } else if (alumno.semanasPagadas >= 4) {
    out.push({ clave: "constante", etiqueta: "Constante", titulo: "4+ semanas pagadas" });
  }
  if (alumno.deuda >= 4) {
    out.push({ clave: "peligro", etiqueta: "Peligro", titulo: "Deuda alta" });
  }

  return out;
}