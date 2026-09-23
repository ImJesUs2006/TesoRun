"use client";

import { useState, useTransition } from "react";
import { Plus, Vote, Trash2, Power } from "lucide-react";
import {
  crearEncuesta,
  eliminarEncuesta,
  eliminarEncuestasMasivo,
  alternarEncuestaActiva,
} from "@/app/admin-teso/actions";
import { reproducirError } from "@/lib/sound";
import { useToast } from "./toast-provider";

export type EncuestaAdmin = {
  id: string;
  pregunta: string;
  fecha: Date;
  activa: boolean;
  esAdmin: boolean;
  opciones: Array<{ id: string; texto: string; votos: number }>;
};

type Props = {
  encuestas: EncuestaAdmin[];
};

const formato = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function GestionEncuestas({ encuestas }: Props) {
  const { notificar } = useToast();
  const [pending, startTransition] = useTransition();
  const [pregunta, setPregunta] = useState("");
  const [opciones, setOpciones] = useState("");
  const [creando, setCreando] = useState(false);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());

  function alternarSeleccion(id: string) {
    setSeleccion((prev) => {
      const copia = new Set(prev);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return copia;
    });
  }

  function seleccionarTodas() {
    setSeleccion((prev) =>
      prev.size === encuestas.length ? new Set() : new Set(encuestas.map((e) => e.id)),
    );
  }

  function borrarMasivo() {
    const ids = Array.from(seleccion);
    if (ids.length === 0) return;
    if (!window.confirm(`¿Eliminar ${ids.length} encuesta${ids.length === 1 ? "" : "s"} con sus votos?`)) return;
    startTransition(async () => {
      const res = await eliminarEncuestasMasivo(ids);
      if (res.ok) {
        notificar("Eliminación masiva", "info", `${ids.length} encuesta(s) eliminadas.`);
        setSeleccion(new Set());
      } else {
        reproducirError();
        notificar("No se pudo eliminar", "error", res.error);
      }
    });
  }

  function crear() {
    const lista = opciones
      .split("\n")
      .map((o) => o.trim())
      .filter(Boolean);

    if (pregunta.trim().length < 3) {
      notificar("Falta la pregunta", "error", "Escribe una pregunta clara.");
      return;
    }
    if (lista.length < 2) {
      notificar("Faltan opciones", "error", "Pon al menos 2 opciones, una por línea.");
      return;
    }
    if (lista.length > 8) {
      notificar("Demasiadas opciones", "error", "Máximo 8 opciones.");
      return;
    }

    startTransition(async () => {
      const res = await crearEncuesta({ pregunta, opciones: lista });
      if (res.ok) {
        notificar("Encuesta creada", "info", "Ya aparece sobre el muro.");
        setPregunta("");
        setOpciones("");
      } else {
        reproducirError();
        notificar("No se pudo crear", "error", res.error);
      }
    });
  }

  function borrar(e: EncuestaAdmin) {
    if (!window.confirm(`¿Eliminar la encuesta "${e.pregunta}" con sus ${e.opciones.length} opciones y votos?`)) return;
    startTransition(async () => {
      const res = await eliminarEncuesta(e.id);
      if (!res.ok) {
        reproducirError();
        notificar("No se pudo eliminar", "error", res.error);
      }
    });
  }

  function alternar(e: EncuestaAdmin) {
    startTransition(async () => {
      const res = await alternarEncuestaActiva(e.id);
      if (!res.ok) {
        reproducirError();
        notificar("No se pudo cambiar", "error", res.error);
      }
    });
  }

  return (
    <section className="rounded-xl border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display flex items-center gap-2 text-xl uppercase text-black">
          <Vote className="h-5 w-5" /> Encuestas
        </h2>
        <div className="flex items-center gap-2">
          {encuestas.length > 0 && (
            <button
              type="button"
              onClick={seleccionarTodas}
              className="rounded-full border-2 border-black bg-yellow-100 px-3 py-1 text-xs font-black text-black transition hover:bg-yellow-200"
            >
              {seleccion.size === encuestas.length ? "Limpiar selección" : "Seleccionar todas"}
            </button>
          )}
          <span className="rounded-full border-2 border-black bg-black px-3 py-1 text-xs font-black text-white">
            {seleccion.size} seleccionadas
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setCreando((v) => !v)}
        className="mb-3 inline-flex items-center gap-2 rounded-full border-4 border-black bg-violet-400 px-4 py-2 font-display text-sm text-white shadow-[4px_4px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-violet-300 active:translate-x-1 active:translate-y-1 active:shadow-none"
      >
        <Plus className="h-4 w-4" /> {creando ? "Cerrar formulario" : "Nueva encuesta"}
      </button>

      {creando && (
        <div className="mb-4 grid gap-3 rounded-xl border-2 border-black bg-yellow-50 p-4">
          <input
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            maxLength={200}
            placeholder="Pregunta (ej. ¿Qué haremos con el fondo del grupo?)"
            className="w-full rounded-lg border-2 border-black px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-200"
          />
          <textarea
            value={opciones}
            onChange={(e) => setOpciones(e.target.value)}
            rows={4}
            placeholder={"Una opción por línea (máx. 8):\nComprar lonchera\nAhorrarlo\n"}
            className="w-full resize-none rounded-lg border-2 border-black px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-200"
          />
          <button
            type="button"
            onClick={crear}
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-full border-4 border-black bg-violet-400 px-5 py-2 font-black text-white shadow-[4px_4px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-violet-300 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
          >
            Crear encuesta
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {encuestas.length === 0 && (
          <li className="rounded-lg border-2 border-dashed border-black px-3 py-3 text-center text-sm font-bold text-black/50">
            Sin encuestas publicadas.
          </li>
        )}
        {encuestas.map((e) => {
          const total = e.opciones.reduce((acc, o) => acc + o.votos, 0);
          return (
            <li key={e.id} className="rounded-lg border-2 border-black bg-yellow-50 px-3 py-2">
              <div className="flex items-start gap-3">
                <label className="mt-0.5 flex items-center">
                  <input
                    type="checkbox"
                    checked={seleccion.has(e.id)}
                    onChange={() => alternarSeleccion(e.id)}
                    className="h-5 w-5 rounded border-2 border-black accent-black"
                  />
                  <span className="sr-only">Seleccionar encuesta {e.pregunta}</span>
                </label>

                <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-black">{e.pregunta}</p>
                    <span
                      className={`rounded-full border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase ${
                        e.activa ? "bg-green-300" : "bg-zinc-300"
                      }`}
                    >
                      {e.activa ? "Activa" : "Cerrada"}
                    </span>
                    {e.esAdmin && (
                      <span className="rounded-full border-2 border-black bg-violet-300 px-2 py-0.5 text-[10px] font-black uppercase">
                        Oficial
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-black/50">{formato.format(new Date(e.fecha))}</p>
                  <ul className="mt-1 space-y-0.5">
                    {e.opciones.map((o) => (
                      <li key={o.id} className="text-xs font-semibold text-black/70">
                        {o.texto} — <span className="font-black">{o.votos} voto{o.votos === 1 ? "" : "s"}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-xs font-bold text-black/40">{total} votos en total</p>
                </div>
                <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => alternar(e)}
                      disabled={pending}
                      title={e.activa ? "Cerrar encuesta" : "Reabrir encuesta"}
                      className="rounded-full border-2 border-black bg-white p-2 shadow-[3px_3px_0_0_#000] transition hover:bg-amber-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => borrar(e)}
                      disabled={pending}
                      title="Eliminar encuesta"
                      className="rounded-full border-2 border-black bg-white p-2 shadow-[3px_3px_0_0_#000] transition hover:bg-red-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
        })}
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