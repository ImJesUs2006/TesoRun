"use client";

import { useState, useTransition } from "react";
import { Check, Plus, Power, Trash2, Vote } from "lucide-react";
import { votarEncuesta, crearEncuesta, cerrarEncuesta, eliminarEncuestaPropia } from "@/app/acciones-publicas";
import { mostrarToast } from "./toast";

export type EncuestaVista = {
  id: string;
  pregunta: string;
  esAdmin: boolean;
  activa: boolean;
  creadorId: string | null;
  opciones: Array<{ id: string; texto: string; votos: number; votado: boolean }>;
};

type Props = {
  encuestas: EncuestaVista[];
  deviceActual: string | null;
};

export function Encuestas({ encuestas, deviceActual }: Props) {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pregunta, setPregunta] = useState("");
  const [opciones, setOpciones] = useState("");
  const [, startTransition] = useTransition();

  function votar(encuesta: EncuestaVista, opcionId: string) {
    setMensaje(null);
    setPendingId(opcionId);
    const yaHabiaVotado = encuesta.opciones.some((o) => o.votado);
    startTransition(async () => {
      const res = await votarEncuesta({ encuestaId: encuesta.id, opcionId });
      setPendingId(null);
      if (!res.ok) {
        mostrarToast(res.error);
        return;
      }
      mostrarToast(yaHabiaVotado ? "Voto actualizado" : "Voto registrado", "ok");
    });
  }

  function cerrar(encuestaId: string) {
    setMensaje(null);
    setPendingId(`cerrar:${encuestaId}`);
    startTransition(async () => {
      const res = await cerrarEncuesta({ encuestaId });
      setPendingId(null);
      if (!res.ok) mostrarToast(res.error);
      else mostrarToast("Encuesta cerrada", "ok");
    });
  }

  function eliminar(encuestaId: string) {
    if (!window.confirm("¿Eliminar tu encuesta? Se borran sus votos, no se puede deshacer.")) return;
    setMensaje(null);
    setPendingId(`borrar:${encuestaId}`);
    startTransition(async () => {
      const res = await eliminarEncuestaPropia({ encuestaId });
      setPendingId(null);
      if (!res.ok) mostrarToast(res.error);
      else mostrarToast("Encuesta eliminada", "ok");
    });
  }

  function crear() {
    setMensaje(null);
    const lista = opciones
      .split("\n")
      .map((o) => o.trim())
      .filter(Boolean);

    if (pregunta.trim().length < 3) {
      setMensaje("Escribe una pregunta clara (mínimo 3 letras).");
      return;
    }
    if (lista.length < 2) {
      setMensaje("Pon al menos 2 opciones, una por línea.");
      return;
    }
    if (lista.length > 8) {
      setMensaje("Máximo 8 opciones.");
      return;
    }

    setPendingId("crear");
    startTransition(async () => {
      const res = await crearEncuesta({ pregunta, opciones: lista });
      setPendingId(null);
      if (res.ok) {
        setMensaje("Encuesta creada. Comparte el link.");
        setPregunta("");
        setOpciones("");
      } else {
        setMensaje(res.error);
      }
    });
  }

  return (
    <section className="rounded-xl border-4 border-black bg-white p-6 shadow-[10px_10px_0_0_#000]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display flex items-center gap-2 text-3xl uppercase text-black">
          <Vote className="h-7 w-7" /> Encuestas
        </h2>
        <span className="rounded-full border-2 border-black bg-yellow-100 px-3 py-1 text-xs font-bold text-black/60">
          límite diario global
        </span>
      </div>

      <div className="mt-3 rounded-xl border-2 border-black bg-yellow-50 p-3">
        <p className="text-sm font-black text-black">Crea tu encuesta pública</p>
        <div className="mt-2 grid gap-2">
          <input
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            maxLength={200}
            placeholder="Pregunta (ej. ¿A dónde vamos el viernes?)"
            className="w-full rounded-lg border-2 border-black px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-200"
          />
          <textarea
            value={opciones}
            onChange={(e) => setOpciones(e.target.value)}
            rows={3}
            placeholder={"Una opción por línea:\nCine\nBolos\nPizza"}
            className="w-full resize-none rounded-lg border-2 border-black px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-200"
          />
          <button
            type="button"
            onClick={crear}
            disabled={pendingId !== null}
            className="inline-flex items-center justify-center gap-2 rounded-full border-4 border-black bg-violet-400 px-5 py-2 font-black text-white shadow-[4px_4px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-violet-300 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> {pendingId === "crear" ? "Creando…" : "Crear encuesta"}
          </button>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {encuestas.length === 0 && (
          <p className="rounded-lg border-2 border-dashed border-black px-3 py-6 text-center text-sm font-bold text-black/50 sm:col-span-2">
            Sin encuestas todavía. Crea la primera.
          </p>
        )}
        {encuestas.map((encuesta) => {
          const total = encuesta.opciones.reduce((acc, o) => acc + o.votos, 0);
          const esCreador = Boolean(encuesta.creadorId && deviceActual && encuesta.creadorId === deviceActual);

          return (
            <div key={encuesta.id} className="rounded-xl border-2 border-black bg-yellow-50 p-4 shadow-[4px_4px_0_0_#000]">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-lg text-black">{encuesta.pregunta}</p>
                <span
                  className={`shrink-0 rounded-full border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase ${
                    encuesta.activa ? "bg-green-300" : "bg-zinc-300"
                  }`}
                >
                  {encuesta.activa ? "Activa" : "Cerrada"}
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {encuesta.opciones.map((opcion) => {
                  const pct = total > 0 ? Math.round((opcion.votos / total) * 100) : 0;
                  const activo = pendingId === opcion.id;
                  // Activas: se puede votar y CAMBIAR de voto. Cerradas: solo resultado.
                  return (
                    <button
                      key={opcion.id}
                      type="button"
                      onClick={() => votar(encuesta, opcion.id)}
                      disabled={!encuesta.activa || activo || pendingId !== null}
                      className={`relative block w-full overflow-hidden rounded-lg border-2 border-black text-left transition active:translate-y-0.5 disabled:cursor-not-allowed ${
                        encuesta.activa ? "hover:bg-yellow-100" : ""
                      } ${opcion.votado ? "bg-lime-200" : "bg-white"}`}
                    >
                      <span
                        className={`absolute inset-y-0 left-0 ${opcion.votado ? "bg-lime-300" : "bg-yellow-200"} ${pct === 0 ? "" : "border-r-2 border-black"}`}
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                      <span className="relative z-10 flex items-center justify-between gap-2 px-3 py-2 text-sm font-black text-black">
                        <span className="truncate">{opcion.texto}</span>
                        <span className="flex items-center gap-1 text-xs">
                          {opcion.votado && <Check className="h-4 w-4 text-green-600" />}
                          {total > 0 ? `${pct}%` : "0%"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-black/50">
                  {total} voto{total === 1 ? "" : "s"}
                  {" · "}
                  {encuesta.activa ? "cambia tu voto cuando quieras" : "Resultados finales"}
                </p>
                {esCreador && (
                  <div className="flex items-center gap-2">
                    {encuesta.activa && (
                      <button
                        type="button"
                        onClick={() => cerrar(encuesta.id)}
                        disabled={pendingId !== null}
                        className="inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-black px-3 py-1 text-xs font-black text-yellow-300 transition hover:bg-zinc-800 disabled:opacity-50"
                      >
                        <Power className="h-3.5 w-3.5" /> Cerrar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => eliminar(encuesta.id)}
                      disabled={pendingId !== null}
                      title="Eliminar mi encuesta"
                      className="inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-black text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {mensaje && (
        <p className="mt-3 rounded-lg border-2 border-black bg-red-400 px-3 py-2 text-sm font-black text-white">
          {mensaje}
        </p>
      )}
    </section>
  );
}