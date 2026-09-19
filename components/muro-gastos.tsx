import { ArrowDownToLine } from "lucide-react";

export type GastoPublico = {
  id: string;
  monto: number;
  descripcion: string;
  fecha: Date;
};

const formato = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" });

type Props = {
  gastos: GastoPublico[];
};

export function MuroGastos({ gastos }: Props) {
  return (
    <section>
      <h2 className="font-display mb-6 flex items-center gap-2 text-3xl uppercase text-black">
        <ArrowDownToLine className="h-7 w-7" /> Muro de gastos
      </h2>
      <p className="mb-4 font-bold text-black/60">
        Todo lo que sale de la tesorería, a la vista de todos.
      </p>

      {gastos.length === 0 ? (
        <p className="rounded-xl border-4 border-dashed border-black bg-white p-8 text-center font-bold text-black/50 shadow-[8px_8px_0_0_#000]">
          Ningún gasto registrado todavía.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gastos.map((g) => (
            <li
              key={g.id}
              className="flex items-center gap-3 rounded-xl border-4 border-black bg-red-100 p-4 shadow-[6px_6px_0_0_#000]"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border-4 border-black bg-red-400">
                <ArrowDownToLine className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-black" title={g.descripcion}>
                    {g.descripcion}
                  </p>
                <p className="text-xs font-bold text-black/60">
                  {formato.format(new Date(g.fecha))}
                </p>
              </div>
              <span className="ml-auto shrink-0 rounded-full border-2 border-black bg-white px-2 py-1 text-sm font-black text-red-600">
                −${Number.isInteger(g.monto) ? g.monto : g.monto.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}