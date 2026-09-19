"use client";

import { useState, useTransition } from "react";
import { CalendarDays } from "lucide-react";
import { actualizarFechaInicio } from "@/app/admin-teso/actions";
import { reproducirCampanita, reproducirError } from "@/lib/sound";
import { useToast } from "./toast-provider";

type Props = {
  fechaInicio: Date | null;
};

function aIsoLocal(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const formato = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "long", year: "numeric" });

export function ConfigFecha({ fechaInicio }: Props) {
  const { notificar } = useToast();
  const [valor, setValor] = useState(fechaInicio ? aIsoLocal(fechaInicio) : "");
  const [pending, startTransition] = useTransition();
  const mostrada = fechaInicio ? formato.format(fechaInicio) : "sin definir";

  function guardar() {
    startTransition(async () => {
      const res = await actualizarFechaInicio(valor);
      if (res.ok) {
        reproducirCampanita();
        notificar("Fecha actualizada", "ok", "La recolección arranca desde el día señalado.");
      } else {
        reproducirError();
        notificar("Fecha no guardada", "error", res.error);
      }
    });
  }

  return (
    <section className="rounded-xl border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
      <h2 className="font-display mb-3 flex items-center gap-2 text-xl uppercase text-black">
        <CalendarDays className="h-5 w-5" /> Fecha de inicio de recolección
      </h2>
      <p className="mb-3 text-sm font-bold text-black/60">
        Actual: <span className="text-violet-600">{mostrada}</span>
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <input
          type="date"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="rounded-lg border-4 border-black px-3 py-2 font-semibold focus:outline-none focus:ring-4 focus:ring-violet-300"
        />
        <button
          type="button"
          onClick={guardar}
          disabled={pending}
          className="rounded-full border-4 border-black bg-violet-400 px-5 py-2 font-display text-sm text-white shadow-[4px_4px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-violet-300 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
        >
          {pending ? "…" : "Guardar fecha"}
        </button>
      </div>
    </section>
  );
}