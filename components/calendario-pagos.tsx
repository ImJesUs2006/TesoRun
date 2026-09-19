const DIA = 86_400_000;

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

/** Mapa de contribuciones estilo GitHub: ultimas 11 semanas + actual + 1 futura. */
export function calendarioPagos(pagos: Date[]): CeldaSemana[] {
  const lunes = inicioSemana(new Date());
  const celdas: CeldaSemana[] = [];

  for (let offset = -11; offset <= 1; offset++) {
    const inicio = new Date(lunes.getTime() + offset * 7 * DIA);
    const pagado = pagos.some((p) => mismaSemana(p, inicio));
    celdas.push({
      inicio,
      offset,
      estado: offset > 0 ? "futuro" : pagado ? "pagado" : "deuda",
    });
  }

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
};

export function CalendarioPagos({ pagos }: Props) {
  const celdas = calendarioPagos(pagos);

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