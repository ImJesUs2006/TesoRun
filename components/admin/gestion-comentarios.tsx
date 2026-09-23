"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, MessageSquare, Trash2 } from "lucide-react";
import { eliminarComentario, eliminarComentariosMasivo } from "@/app/admin-teso/actions";
import { reproducirError } from "@/lib/sound";
import { useToast } from "./toast-provider";

const POR_PAGINA = 10;

export type ComentarioAdmin = {
  id: string;
  alias: string;
  contenido: string | null;
  gifUrl: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  fecha: Date;
  alumnoNombre: string | null;
  reacciones: Array<{ emoji: string; votantes: string[] }>;
};

type Props = {
  comentarios: ComentarioAdmin[];
};

const formato = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function GestionComentarios({ comentarios }: Props) {
  const { notificar } = useToast();
  const [pending, startTransition] = useTransition();
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [pagina, setPagina] = useState(1);

  const totalPaginas = Math.max(1, Math.ceil(comentarios.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = comentarios.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  function irA(p: number) {
    if (p < 1 || p > totalPaginas) return;
    setPagina(p);
  }

  function alternar(id: string) {
    setSeleccion((prev) => {
      const copia = new Set(prev);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return copia;
    });
  }

  function todos() {
    setSeleccion((prev) =>
      visibles.every((c) => prev.has(c.id))
        ? new Set([...prev].filter((id) => !visibles.some((v) => v.id === id)))
        : new Set([...prev, ...visibles.map((c) => c.id)]),
    );
  }

  function borrarUno(c: ComentarioAdmin) {
    if (!window.confirm(`¿Eliminar el comentario de ${c.alias}?`)) return;
    startTransition(async () => {
      const res = await eliminarComentario(c.id);
      if (res.ok) notificar("Comentario eliminado", "info", c.alias);
      else {
        reproducirError();
        notificar("No se pudo eliminar", "error", res.error);
      }
    });
  }

  function borrarMasivo() {
    const ids = Array.from(seleccion);
    if (ids.length === 0) return;
    if (!window.confirm(`¿Eliminar ${ids.length} comentario${ids.length === 1 ? "" : "s"}?`)) return;
    startTransition(async () => {
      const res = await eliminarComentariosMasivo(ids);
      if (res.ok) {
        notificar("Eliminación masiva", "info", `${ids.length} comentario(s) eliminados.`);
        setSeleccion(new Set());
      } else {
        reproducirError();
        notificar("No se pudo eliminar", "error", res.error);
      }
    });
  }

  return (
    <section className="rounded-xl border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display flex items-center gap-2 text-xl uppercase text-black">
          <MessageSquare className="h-5 w-5" /> Comentarios del muro
        </h2>
        <div className="flex items-center gap-2">
          {comentarios.length > 0 && (
            <button
              type="button"
              onClick={todos}
              className="rounded-full border-2 border-black bg-yellow-100 px-3 py-1 text-xs font-black text-black transition hover:bg-yellow-200"
            >
              {visibles.every((c) => seleccion.has(c.id)) ? "Limpiar selección" : "Seleccionar todo"}
            </button>
          )}
          <span className="rounded-full border-2 border-black bg-black px-3 py-1 text-xs font-black text-white">
            {seleccion.size} seleccionados
          </span>
        </div>
      </div>

      <ul className="space-y-2">
        {comentarios.length === 0 && (
          <li className="rounded-lg border-2 border-dashed border-black px-3 py-3 text-center text-sm font-bold text-black/50">
            Sin comentarios publicados.
          </li>
        )}
        {visibles.map((c) => (
          <li key={c.id} className="rounded-lg border-2 border-black bg-yellow-50 px-3 py-2">
            <div className="flex items-center gap-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={seleccion.has(c.id)}
                  onChange={() => alternar(c.id)}
                  className="h-5 w-5 rounded border-2 border-black accent-black"
                />
                <span className="sr-only">Seleccionar comentario de {c.alias}</span>
              </label>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-black">
                  {c.contenido ||
                    (c.gifUrl ? "🧩 (GIF adjunto)" : c.imageUrl ? "🖼 (Imagen adjunta)" : c.audioUrl ? "🎙 Nota de voz" : "")}
                </p>
                <p className="truncate text-xs font-bold text-black/50">
                  {c.alias}{c.alumnoNombre ? ` · ex: ${c.alumnoNombre}` : ""} · {formato.format(new Date(c.fecha))}
                </p>
                {(c.gifUrl || c.imageUrl || c.audioUrl) && (
                  <p className="mt-1 flex flex-wrap items-center gap-2">
                    {c.gifUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.gifUrl} alt="" className="h-9 w-9 rounded border-2 border-black object-cover" />
                    )}
                    {c.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt="" className="h-9 w-9 rounded border-2 border-black object-cover" />
                    )}
                    {c.audioUrl && (
                      <audio controls preload="metadata" src={c.audioUrl} className="h-8 max-w-[180px]" />
                    )}
                  </p>
                )}
                {c.reacciones.length > 0 && (
                  <p className="mt-1 flex flex-wrap items-center gap-1.5">
                    {c.reacciones.map((r) => (
                      <span
                        key={r.emoji}
                        className="inline-flex items-center gap-1 rounded-full border-2 border-black bg-white px-1.5 py-0.5 text-[11px] font-black text-black"
                        title={`${r.votantes.length} persona${r.votantes.length === 1 ? "" : "s"}`}
                      >
                        {r.emoji} {r.votantes.length}
                      </span>
                    ))}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => borrarUno(c)}
                disabled={pending}
                title="Eliminar comentario"
                className="shrink-0 rounded-full border-2 border-black bg-white p-2 shadow-[3px_3px_0_0_#000] transition hover:bg-red-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {totalPaginas > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-4" aria-label="Paginación de comentarios">
          <button
            type="button"
            onClick={() => irA(paginaActual - 1)}
            disabled={paginaActual <= 1}
            className="inline-flex items-center gap-1 rounded-full border-4 border-black bg-white px-4 py-2 text-sm font-black text-black shadow-[4px_4px_0_0_#000] transition hover:bg-yellow-100 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:opacity-35"
          >
            <ArrowUp className="h-4 w-4" /> Anterior
          </button>
          <span className="rounded-full border-2 border-black bg-black px-3 py-1 text-sm font-black text-white">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => irA(paginaActual + 1)}
            disabled={paginaActual >= totalPaginas}
            className="inline-flex items-center gap-1 rounded-full border-4 border-black bg-white px-4 py-2 text-sm font-black text-black shadow-[4px_4px_0_0_#000] transition hover:bg-yellow-100 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:opacity-35"
          >
            Siguiente <ArrowDown className="h-4 w-4" />
          </button>
        </nav>
      )}

      {seleccion.size > 0 && (
        <button
          type="button"
          onClick={borrarMasivo}
          disabled={pending}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border-4 border-black bg-red-500 px-5 py-3 font-display text-white shadow-[6px_6px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-red-400 active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          <Trash2 className="h-5 w-5" /> Eliminar {seleccion.size} seleccionados
        </button>
      )}
    </section>
  );
}