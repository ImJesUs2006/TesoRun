const DIA = 86_400_000;
const MAX_SEMANAS = 16;

function inicioSemana(d: Date): Date {
  const copia = new Date(d);
  const dia = (copia.getDay() + 6) % 7; // lunes = 0
  copia.setDate(copia.getDate() - dia);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function mismaSemana(a: Date, b: Date): boolean {
  return inicioSemana(a).getTime() === inicioSemana(b).getTime();
}

export type CeldaSemana = {
  inicio: Date;
  offset: number;
  estado: "pagado" | "deuda" | "futuro";
};

/**
 * Mapa de contribuciones estilo GitHub, anclado a la fecha de inicio de recoleccion.
 * Cada celda es una semana de la tesoreria (semana 1 = fechaInicio..+6dias).
 * Si no hay fecha de inicio, cae al comportamiento anterior (ultimas 11 semanas).
 */
export function calendarioPagos(pagos: Date[], fechaInicio?: Date | null): CeldaSemana[] {
  const base = fechaInicio ? new Date(fechaInicio).getTime() : null;

  // Sin fecha configurada: ultimas 11 semanas + actual + 1 futura.
  if (!base || !Number.isFinite(base)) {
    const lunes = inicioSemana(new Date());
    const celdas: CeldaSemana[] = [];
    for (let offset = -11; offset <= 1; offset++) {
      const inicio = new Date(lunes.getTime() + offset * 7 * DIA);
      const pagado = pagos.some((p) => mismaSemana(p, inicio));
      celdas.push({ inicio, offset, estado: offset > 0 ? "futuro" : pagado ? "pagado" : "deuda" });
    }
    return celdas;
  }

  const dias = Math.floor((Date.now() - base) / DIA);
  if (dias < 0) return []; // la recolección aún no empieza

  // Semana en curso cuenta (misma lógica que la deuda).
  const total = Math.floor(dias / 7) + 1;
  const desde = Math.max(1, total - MAX_SEMANAS + 1);

  const celdas: CeldaSemana[] = [];
  for (let k = desde; k <= total; k++) {
    const inicio = new Date(base + (k - 1) * 7 * DIA);
    const pagado = pagos.some((p) => {
      const t = p.getTime();
      return t >= base && Math.floor((t - base) / (7 * DIA)) + 1 === k;
    });
    celdas.push({ inicio, offset: k - 1, estado: pagado ? "pagado" : "deuda" });
  }

  celdas.push({ inicio: new Date(base + total * 7 * DIA), offset: total, estado: "futuro" });

  return celdas;
}

const COLORES: Record<CeldaSemana["estado"], string> = {
  pagado: "bg-lime-400",
  deuda: "bg-red-400",
  futuro: "bg-gray-200",
};

const ETIQUETAS: Record<CeldaSemana["estado"], string> = {
  pagado: "Pagado",
  deuda: "En deuda",
  futuro: "Futuro",
};

const formato = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" });

type Props = {
  pagos: Date[];
  fechaInicio?: Date | null;
};

export function CalendarioPagos({ pagos, fechaInicio }: Props) {
  const celdas = calendarioPagos(pagos, fechaInicio);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {celdas.map((c) => (
          <span
            key={c.inicio.getTime()}
            title={`Semana del ${formato.format(c.inicio)} · ${ETIQUETAS[c.estado]}`}
            className={`h-6 w-6 rounded-sm border-2 border-black ${COLORES[c.estado]}`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold text-black/60">
        <span className="inline-flex items-center gap-1">
          <i className="h-3 w-3 rounded-sm border-2 border-black bg-lime-400" /> Pagado
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="h-3 w-3 rounded-sm border-2 border-black bg-red-400" /> Deuda
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="h-3 w-3 rounded-sm border-2 border-black bg-gray-200" /> Futuro
        </span>
      </div>
    </div>
  );
}