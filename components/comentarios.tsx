"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Send } from "lucide-react";
import { publicarComentario } from "@/app/admin-teso/actions";
import { reproducirCampanita, reproducirError } from "@/lib/sound";

type ComentarioVista = {
  id: string;
  contenido: string;
  fecha: Date;
  alumnoNombre: string;
};

type Props = {
  alumnos: Array<{ id: string; nombre: string }>;
  comentarios: ComentarioVista[];
};

const formatoFecha = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function TablonComentarios({ alumnos, comentarios }: Props) {
  const [alumnoId, setAlumnoId] = useState("");
  const [contenido, setContenido] = useState("");
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "error"; mensaje: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await publicarComentario({ alumnoId, contenido });
      if (res.ok) {
        reproducirCampanita();
        setFeedback({ tipo: "ok", mensaje: "Comentario publicado." });
        setContenido("");
      } else {
        reproducirError();
        setFeedback({ tipo: "error", mensaje: res.error });
      }
    });
  }

  return (
    <section className="rounded-xl border-4 border-black bg-white p-6 shadow-[10px_10px_0_0_#000]">
      <h2 className="font-display mb-4 flex items-center gap-2 text-3xl uppercase text-black">
        <MessageSquare className="h-7 w-7" /> Tablón de comentarios
      </h2>

      <form onSubmit={enviar} className="grid gap-3">
        <label className="sm:col-span-1">
          <span className="mb-1 block text-xs font-black uppercase text-black/60">Tu nombre</span>
          <select
            value={alumnoId}
            onChange={(e) => setAlumnoId(e.target.value)}
            className="w-full rounded-lg border-4 border-black bg-white px-3 py-2 font-semibold focus:outline-none focus:ring-4 focus:ring-yellow-200 sm:max-w-xs"
          >
            <option value="">Selecciona…</option>
            {alumnos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-1">
          <span className="mb-1 block text-xs font-black uppercase text-black/60">Mensaje</span>
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            maxLength={280}
            rows={2}
            placeholder="¿Alguien tiene los apuntes de hoy?"
            className="w-full resize-none rounded-lg border-4 border-black px-3 py-2 font-semibold focus:outline-none focus:ring-4 focus:ring-yellow-200"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full border-4 border-black bg-yellow-400 px-6 py-2.5 font-display text-lg text-black shadow-[5px_5px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-yellow-300 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> {pending ? "Publicando…" : "Publicar"}
          </button>
          {feedback && (
            <p
              className={`rounded-lg border-2 border-black px-3 py-1.5 text-sm font-black ${
                feedback.tipo === "ok" ? "bg-lime-300 text-black" : "bg-red-400 text-white"
              }`}
            >
              {feedback.mensaje}
            </p>
          )}
        </div>
        <p className="text-xs font-bold text-black/50">
          Máximo 3 comentarios por día por persona.
        </p>
      </form>

      <ul className="mt-6 space-y-3">
        {comentarios.length === 0 && (
          <li className="rounded-lg border-2 border-dashed border-black px-4 py-6 text-center font-bold text-black/50">
            Sin comentarios todavía. Abre la conversación.
          </li>
        )}
        {comentarios.map((c) => (
          <li
            key={c.id}
            className="rounded-lg border-2 border-black bg-yellow-50 px-4 py-3 shadow-[4px_4px_0_0_#000]"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-black text-violet-600">{c.alumnoNombre}</span>
              <span className="text-xs font-bold text-black/50">
                {formatoFecha.format(new Date(c.fecha))}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-black">{c.contenido}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}