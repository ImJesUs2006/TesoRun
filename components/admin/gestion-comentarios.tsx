"use client";

import { useTransition } from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import { eliminarComentario } from "@/app/admin-teso/actions";
import { reproducirError } from "@/lib/sound";
import { useToast } from "./toast-provider";

export type ComentarioAdmin = {
  id: string;
  contenido: string;
  fecha: Date;
  alumnoNombre: string;
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

  function borrar(c: ComentarioAdmin) {
    if (!window.confirm(`¿Eliminar el comentario de ${c.alumnoNombre}?`)) return;
    startTransition(async () => {
      const res = await eliminarComentario(c.id);
      if (res.ok) notificar("Comentario eliminado", "info", c.alumnoNombre);
      else {
        reproducirError();
        notificar("No se pudo eliminar", "error", res.error);
      }
    });
  }

  return (
    <section className="rounded-xl border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
      <h2 className="font-display mb-3 flex items-center gap-2 text-xl uppercase text-black">
        <MessageSquare className="h-5 w-5" /> Comentarios del tablón
      </h2>

      <ul className="space-y-2">
        {comentarios.length === 0 && (
          <li className="rounded-lg border-2 border-dashed border-black px-3 py-3 text-center text-sm font-bold text-black/50">
            Sin comentarios publicados.
          </li>
        )}
        {comentarios.map((c) => (
          <li key={c.id} className="rounded-lg border-2 border-black bg-yellow-50 px-3 py-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-black">{c.contenido}</p>
                <p className="text-xs font-bold text-black/50">
                  {c.alumnoNombre} · {formato.format(new Date(c.fecha))}
                </p>
              </div>
              <button
                type="button"
                onClick={() => borrar(c)}
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
    </section>
  );
}