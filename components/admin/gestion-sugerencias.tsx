"use client";

import { useState, useTransition } from "react";
import { CheckCheck, Inbox, Trash2 } from "lucide-react";
import { alternarSugerenciaLeida, eliminarSugerencia, eliminarSugerenciasMasivo } from "@/app/admin-teso/actions";
import { reproducirError } from "@/lib/sound";
import { useToast } from "./toast-provider";

export type SugerenciaAdmin = {
  id: string;
  mensaje: string;
  leida: boolean;
  fecha: Date;
};

type Props = {
  sugerencias: SugerenciaAdmin[];
};

const formato = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function GestionSugerencias({ sugerencias }: Props) {
  const { notificar } = useToast();
  const [pending, startTransition] = useTransition();
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());

  function alternar(id: string) {
    setSeleccion((prev) => {
      const copia = new Set(prev);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return copia;
    });
  }

  function borrarMasivo() {
    const ids = Array.from(seleccion);
    if (ids.length === 0) return;
    if (!window.confirm(`¿Eliminar ${ids.length} sugerencia${ids.length === 1 ? "" : "s"}?`)) return;
    startTransition(async () => {
      const res = await eliminarSugerenciasMasivo(ids);
      if (res.ok) {
        notificar("Eliminación masiva", "info", `${ids.length} sugerencia(s) eliminadas.`);
        setSeleccion(new Set());
      } else {
        reproducirError();
        notificar("No se pudo eliminar", "error", res.error);
      }
    });
  }

  function marcar(s: SugerenciaAdmin) {
    startTransition(async () => {
      const res = await alternarSugerenciaLeida(s.id);
      if (!res.ok) {
        reproducirError();
        notificar("No se pudo actualizar", "error", res.error);
      }
    });
  }

  function borrarUno(s: SugerenciaAdmin) {
    if (!window.confirm("¿Eliminar esta sugerencia?")) return;
    startTransition(async () => {
      const res = await eliminarSugerencia(s.id);
      if (!res.ok) {
        reproducirError();
        notificar("No se pudo eliminar", "error", res.error);
      }
    });
  }

  return (
    <section className="rounded-xl border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display flex items-center gap-2 text-xl uppercase text-black">
          <Inbox className="h-5 w-5" /> Buzón de sugerencias
        </h2>
        <span className="rounded-full border-2 border-black bg-black px-3 py-1 text-xs font-black text-white">
          {seleccion.size} seleccionadas
        </span>
      </div>

      <ul className="space-y-2">
        {sugerencias.length === 0 && (
          <li className="rounded-lg border-2 border-dashed border-black px-3 py-3 text-center text-sm font-bold text-black/50">
            Buzón vacío. Los compañerxs aún no escriben ideas.
          </li>
        )}
        {sugerencias.map((s) => (
          <li
            key={s.id}
            className={`rounded-lg border-2 border-black px-3 py-2 ${s.leida ? "bg-gray-50 opacity-75" : "bg-yellow-50"}`}
          >
            <div className="flex items-center gap-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={seleccion.has(s.id)}
                  onChange={() => alternar(s.id)}
                  className="h-5 w-5 rounded border-2 border-black accent-black"
                />
                <span className="sr-only">Seleccionar sugerencia</span>
              </label>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-black">{s.mensaje}</p>
                <p className="text-xs font-bold text-black/50">
                  {s.leida ? "Leída" : "Nueva"} · {formato.format(new Date(s.fecha))}
                </p>
              </div>
              <button
                type="button"
                onClick={() => marcar(s)}
                disabled={pending}
                title={s.leida ? "Marcar como no leída" : "Marcar como leída"}
                className="shrink-0 rounded-full border-2 border-black bg-white p-2 shadow-[3px_3px_0_0_#000] transition hover:bg-lime-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => borrarUno(s)}
                disabled={pending}
                title="Eliminar sugerencia"
                className="shrink-0 rounded-full border-2 border-black bg-white p-2 shadow-[3px_3px_0_0_#000] transition hover:bg-red-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {seleccion.size > 0 && (
        <button
          type="button"
          onClick={borrarMasivo}
          disabled={pending}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border-4 border-black bg-red-500 px-5 py-3 font-display text-white shadow-[6px_6px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-red-400 active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          <Trash2 className="h-5 w-5" /> Eliminar {seleccion.size} seleccionadas
        </button>
      )}
    </section>
  );
}