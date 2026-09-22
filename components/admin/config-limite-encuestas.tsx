"use client";

import { useState, useTransition } from "react";
import { Gauge } from "lucide-react";
import { actualizarConfiguracion } from "@/app/admin-teso/actions";
import { reproducirCampanita, reproducirError } from "@/lib/sound";
import { useToast } from "./toast-provider";

type Props = {
  maxEncuestasDiarias: number;
};

export function ConfigLimiteEncuestas({ maxEncuestasDiarias }: Props) {
  const { notificar } = useToast();
  const [valor, setValor] = useState(String(maxEncuestasDiarias ?? 5));
  const [pending, startTransition] = useTransition();

  const numero = Number(valor);

  function guardar() {
    if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
      reproducirError();
      notificar("Valor inválido", "error", "Usa un entero entre 1 y 100.");
      return;
    }
    startTransition(async () => {
      const res = await actualizarConfiguracion({ maxEncuestasDiarias: numero });
      if (res.ok) {
        reproducirCampanita();
        notificar("Límite actualizado", "ok", `${numero} encuestas por día como máximo.`);
      } else {
        reproducirError();
        notificar("No se pudo guardar", "error", res.error);
      }
    });
  }

  return (
    <section className="rounded-xl border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
      <h2 className="font-display mb-3 flex items-center gap-2 text-xl uppercase text-black">
        <Gauge className="h-5 w-5" /> Límite diario de encuestas
      </h2>
      <p className="mb-3 text-sm font-bold text-black/60">
        Total global por día. Al llegar al límite, el muro rechaza nuevas encuestas públicas.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <input
          type="number"
          min={1}
          max={100}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-28 rounded-lg border-4 border-black px-3 py-2 font-semibold focus:outline-none focus:ring-4 focus:ring-violet-300"
        />
        <button
          type="button"
          onClick={guardar}
          disabled={pending}
          className="rounded-full border-4 border-black bg-violet-400 px-5 py-2 font-display text-sm text-white shadow-[4px_4px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-violet-300 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
        >
          {pending ? "…" : "Guardar límite"}
        </button>
      </div>
    </section>
  );
}