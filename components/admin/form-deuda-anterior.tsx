"use client";

import { useState, useTransition } from "react";
import { Landmark } from "lucide-react";
import { asignarDeudaAnterior } from "@/app/admin-teso/actions";
import { reproducirError } from "@/lib/sound";
import { useToast } from "./toast-provider";

type Props = {
  alumnos: { id: string; nombre: string }[];
};

export function FormDeudaAnterior({ alumnos }: Props) {
  const { notificar } = useToast();
  const [pending, startTransition] = useTransition();
  const [alumnoId, setAlumnoId] = useState("");
  const [monto, setMonto] = useState("");

  function asignar() {
    const m = Number(monto);
    if (!alumnoId || !Number.isInteger(m) || m < 0) {
      reproducirError();
      notificar("Datos inválidos", "error", "Elige un alumno y un monto entero ≥ 0.");
      return;
    }
    startTransition(async () => {
      const res = await asignarDeudaAnterior(alumnoId, m);
      if (res.ok) {
        notificar("Deuda asignada", "ok", alumnos.find((a) => a.id === alumnoId)?.nombre ?? "");
        setMonto("");
      } else {
        reproducirError();
        notificar("No se asignó", "error", res.error);
      }
    });
  }

  return (
    <section className="rounded-2xl border-4 border-black bg-amber-100 p-5 shadow-[8px_8px_0_0_#000]">
      <h2 className="font-display mb-3 flex items-center gap-2 text-xl text-black">
        <Landmark className="h-6 w-6" /> Deudas de semestres anteriores
      </h2>
      <p className="mb-3 text-sm font-semibold text-black/60">
        Asigna una deuda histórica en pesos. No afecta las cuotas semanales ni las rachas.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-black uppercase tracking-wide text-black/60">Alumno</span>
          <select
            value={alumnoId}
            onChange={(e) => setAlumnoId(e.target.value)}
            disabled={pending}
            className="rounded-lg border-4 border-black bg-white px-3 py-2 font-bold text-black shadow-[3px_3px_0_0_#000] focus:outline-none focus:ring-4 focus:ring-violet-300"
          >
            <option value="">Selecciona…</option>
            {alumnos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-black uppercase tracking-wide text-black/60">Monto ($)</span>
          <input
            type="number"
            min={0}
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            disabled={pending}
            placeholder="0"
            className="w-32 rounded-lg border-4 border-black bg-white px-3 py-2 font-bold text-black shadow-[3px_3px_0_0_#000] focus:outline-none focus:ring-4 focus:ring-violet-300"
          />
        </label>

        <button
          type="button"
          onClick={asignar}
          disabled={pending}
          className="rounded-full border-4 border-black bg-violet-500 px-5 py-2 font-display text-sm text-white shadow-[4px_4px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-violet-400 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Asignar Deuda"}
        </button>
      </div>
    </section>
  );
}