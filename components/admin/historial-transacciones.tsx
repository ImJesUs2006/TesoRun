"use client";

import { useState, useTransition } from "react";
import { Download, Receipt, Trash2 } from "lucide-react";
import { eliminarTransaccion, registrarGasto } from "@/app/admin-teso/actions";
import { reproducirCampanita, reproducirError } from "@/lib/sound";
import { useToast } from "./toast-provider";

export type TransaccionAdmin = {
  id: string;
  monto: number;
  tipo: string;
  descripcion: string;
  notaAdmin: string | null;
  fecha: Date;
  alumnoNombre?: string | null;
};

type Props = {
  transacciones: TransaccionAdmin[];
};

const formatoFecha = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function valorPesos(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function descripcionCorta(s: string): string {
  return s.length > 28 ? `${s.slice(0, 28)}…` : s;
}

function descargarCsv(items: TransaccionAdmin[]) {
  const filas = [
    ["fecha", "tipo", "monto", "descripcion", "nota", "alumno"],
    ...items.map((t) => [
      new Date(t.fecha).toISOString(),
      t.tipo,
      valorPesos(t.monto),
      t.descripcion,
      t.notaAdmin ?? "",
      t.alumnoNombre ?? "",
    ]),
  ]
    .map((f) => f.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + filas], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tesorun-transacciones-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function HistorialTransacciones({ transacciones }: Props) {
  const { notificar } = useToast();
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [pending, startTransition] = useTransition();

  function guardarGasto(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await registrarGasto(Number(monto), descripcion);
      if (res.ok) {
        reproducirCampanita();
        notificar("Gasto registrado", "ok", `-$${valorPesos(Number(monto))} · ${descripcion}`);
        setMonto("");
        setDescripcion("");
      } else {
        reproducirError();
        notificar("Gasto no registrado", "error", res.error);
      }
    });
  }

  function borrar(t: TransaccionAdmin) {
    const etiqueta = t.tipo === "INGRESO" ? "pago" : "gasto";
    if (!window.confirm(`¿Eliminar este ${etiqueta}?`)) return;
    startTransition(async () => {
      const res = await eliminarTransaccion(t.id);
      if (res.ok) notificar(`${etiqueta} eliminado`, "info", descripcionCorta(t.descripcion));
      else {
        reproducirError();
        notificar("No se pudo eliminar", "error", res.error);
      }
    });
  }

  return (
    <section className="rounded-xl border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display flex items-center gap-2 text-2xl uppercase text-black">
          <Receipt className="h-6 w-6" /> Movimientos
        </h2>
        <button
          type="button"
          onClick={() => descargarCsv(transacciones)}
          className="inline-flex items-center gap-2 rounded-full border-4 border-black bg-sky-300 px-4 py-1.5 font-display text-sm text-black shadow-[4px_4px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-sky-200 active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      <form onSubmit={guardarGasto} className="mb-4 flex flex-wrap items-end gap-3">
        <label className="w-28">
          <span className="mb-1 block text-xs font-black uppercase text-black/60">Monto $</span>
          <input
            type="number"
            min={1}
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="50"
            className="w-full rounded-lg border-4 border-black px-3 py-1.5 font-semibold focus:outline-none focus:ring-4 focus:ring-red-200"
          />
        </label>
        <label className="min-w-44 flex-1">
          <span className="mb-1 block text-xs font-black uppercase text-black/60">Descripción</span>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej. galletas para la junta"
            className="w-full rounded-lg border-4 border-black px-3 py-1.5 font-semibold focus:outline-none focus:ring-4 focus:ring-red-200"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border-4 border-black bg-red-400 px-5 py-1.5 font-display text-lg text-black shadow-[5px_5px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-red-300 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
        >
          {pending ? "…" : "− Registrar gasto"}
        </button>
      </form>

      <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
        {transacciones.map((t) => (
          <li
            key={t.id}
            className="rounded-lg border-2 border-black px-3 py-2"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-black">
                  {t.descripcion}
                  {t.alumnoNombre && (
                    <span className="ml-1 font-black text-violet-600">· {t.alumnoNombre}</span>
                  )}
                </p>
                <p className="text-xs font-bold text-black/50">
                  {formatoFecha.format(new Date(t.fecha))}
                </p>
                {t.notaAdmin && (
                  <p className="mt-0.5 truncate text-xs font-semibold italic text-black/60">
                    Nota: {t.notaAdmin}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full border-2 border-black px-2 py-0.5 text-sm font-black ${
                  t.tipo === "INGRESO" ? "bg-lime-300 text-black" : "bg-red-400 text-white"
                }`}
              >
                {t.tipo === "INGRESO" ? `+$${valorPesos(t.monto)}` : `−$${valorPesos(t.monto)}`}
              </span>
              <button
                type="button"
                onClick={() => borrar(t)}
                disabled={pending}
                title="Eliminar esta transacción"
                className="rounded-full border-2 border-black bg-white p-1.5 shadow-[3px_3px_0_0_#000] transition hover:bg-red-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}