"use client";

import { useState } from "react";
import { Plus, Send, X } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { TextoSeguro } from "@/components/muro/texto-seguro";
import { EmojiPicker } from "@/components/muro/emoji-picker";
import { ImagenCensurable } from "@/components/muro/censura";
import { mostrarToast } from "@/components/muro/toast";
import { crearComentario, toggleReaccion } from "@/app/acciones-publicas";
import { leerNombreGuardado, guardarNombre, SelectorNombre } from "@/components/muro/selector-nombre";
import { MAX_CONTENIDO } from "@/lib/limites";

export type ComentarioVista = {
  id: string;
  alias: string;
  contenido: string | null;
  gifUrl: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  fecha: Date;
  alumnoNombre: string | null;
  parentId?: string | null;
  respuestas?: ComentarioVista[];
  reacciones: Array<{ emoji: string; votantes: string[] }>;
};

const formatoFecha = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function FilaReacciones({ reacciones, deviceActual, comentarioId }: { reacciones: ComentarioVista["reacciones"]; deviceActual: string | null; comentarioId: string }) {
  const [pickerAbierto, setPickerAbierto] = useState(false);
  const [procesando, setProcesando] = useState<string | null>(null);

  async function alternar(emoji: string) {
    setPickerAbierto(false);
    setProcesando(emoji);
    await toggleReaccion({ comentarioId, emoji });
    setProcesando(null);
  }

  const ordenadas = [...reacciones].sort((a, b) => b.votantes.length - a.votantes.length);

  return (
    <div className="relative mt-2 flex flex-wrap items-center gap-1.5">
      {ordenadas.map((r) => {
        const mia = deviceActual ? r.votantes.includes(deviceActual) : false;
        const pendiente = procesando === r.emoji;
        return (
          <button
            key={r.emoji}
            type="button"
            onClick={() => alternar(r.emoji)}
            disabled={procesando !== null}
            className={`inline-flex items-center gap-1 rounded-full border-2 border-black px-2 py-0.5 text-xs font-black transition active:translate-y-0.5 disabled:opacity-50 ${
              mia ? "bg-yellow-300" : "bg-white hover:bg-yellow-100"
            }`}
          >
            <span>{r.emoji}</span>
            <span className="text-black/60">{pendiente ? "…" : r.votantes.length}</span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => setPickerAbierto((v) => !v)}
        disabled={procesando !== null}
        title="Reaccionar con cualquier emoji"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-black bg-white text-xs transition hover:bg-yellow-100 active:translate-y-0.5 disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>

      {pickerAbierto && (
        <div className="absolute right-0 top-8 z-30">
          <EmojiPicker
            onElegir={(e) => {
              if (e) void alternar(e);
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Tarjeta de un comentario del muro. Las imágenes se renderizan con
 * censura por defecto (blur-xl + gris) controlada en localStorage; el
 * botón "Mostrar"/"Ver imagen" la quita por imagen concreta.
 * Los comentarios raíz muestran botón "Responder" y sus respuestas se
 * pintan anidadas (margen izquierdo con borde).
 */
function RespuestaForm({
  alias,
  parentId,
  onCerrar,
}: {
  alias: string;
  parentId: string;
  onCerrar: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [modoNombre, setModoNombre] = useState(() => leerNombreGuardado().length > 0);
  const [nombre, setNombre] = useState(leerNombreGuardado);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const limpiado = texto.trim();
    if (limpiado.length === 0) {
      mostrarToast("Escribe tu respuesta");
      return;
    }
    const nombreFinal = modoNombre ? nombre.trim() : "";
    if (modoNombre && nombreFinal.length === 0) {
      mostrarToast("Escribe tu nombre o elige Anónimo");
      return;
    }
    setEnviando(true);
    const res = await crearComentario({ contenido: limpiado, parentId, nombre: nombreFinal });
    setEnviando(false);
    if (res.ok) {
      if (nombreFinal.length > 0) guardarNombre(nombreFinal);
      setTexto("");
      onCerrar();
      mostrarToast("Respuesta publicada", "ok");
    } else {
      mostrarToast(res.error);
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border-2 border-black bg-white px-3 py-2"
    >
      <span className="text-xs font-black text-black/50">
        Respondiendo a <span className="text-violet-600">{alias}</span>…
      </span>
      <SelectorNombre
        modo={modoNombre}
        nombre={nombre}
        onChangeModo={setModoNombre}
        onChangeNombre={setNombre}
      />
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={MAX_CONTENIDO}
        placeholder="Escribe tu respuesta"
        aria-label={`Responder a ${alias}`}
        autoFocus
        className="min-w-0 flex-1 rounded-md border-2 border-black bg-yellow-50 px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-200"
      />
      <button
        type="submit"
        disabled={enviando}
        className="inline-flex items-center gap-1 rounded-full border-2 border-black bg-yellow-400 px-3 py-1 text-xs font-black text-black shadow-[2px_2px_0_0_#000] transition hover:bg-yellow-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
        title="Enviar respuesta"
      >
        <Send className="h-3 w-3" /> {enviando ? "…" : "Enviar"}
      </button>
      <button
        type="button"
        onClick={onCerrar}
        title="Cancelar respuesta"
        className="rounded-full border-2 border-black bg-white p-1 text-black/60 transition hover:bg-red-100"
      >
        <X className="h-3 w-3" />
      </button>
    </form>
  );
}

export function ComentarioCard({
  comentario: c,
  deviceActual,
}: {
  comentario: ComentarioVista;
  deviceActual: string | null;
}) {
  const [respondiendo, setRespondiendo] = useState(false);

  return (
    <div className="rounded-lg border-2 border-black bg-yellow-50 px-4 py-3 shadow-[4px_4px_0_0_#000]">
      <div className="flex items-start gap-3">
        <Avatar nombre={c.alias} size="sm" className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-black text-violet-600">{c.alias}</span>
            <span className="text-xs font-bold text-black/50">
              {formatoFecha.format(new Date(c.fecha))}
            </span>
          </div>

          {c.contenido && <TextoSeguro texto={c.contenido} />}

          {c.gifUrl && (
            <ImagenCensurable
              src={c.gifUrl}
              alt="GIF del muro"
              className="mt-2 max-h-40 rounded-lg border-2 border-black bg-white object-cover"
            />
          )}

          {c.imageUrl && (
            <ImagenCensurable
              src={c.imageUrl}
              alt="Imagen del muro"
              className="mt-2 max-h-64 rounded-lg border-2 border-black bg-white object-cover"
            />
          )}

          {c.audioUrl && (
            <audio controls preload="metadata" src={c.audioUrl} className="mt-2 h-10 w-full max-w-[260px]" />
          )}

          {c.alumnoNombre && (
            <span className="mt-1 inline-block rounded-full border-2 border-black bg-gray-100 px-2 py-0.5 text-[10px] font-black text-black/50">
              de {c.alumnoNombre}
            </span>
          )}

          <FilaReacciones reacciones={c.reacciones} deviceActual={deviceActual} comentarioId={c.id} />

          {!c.parentId && (
            <button
              type="button"
              onClick={() => setRespondiendo((v) => !v)}
              className="mt-1.5 rounded-full border-2 border-black bg-white px-2.5 py-0.5 text-xs font-black text-black/60 transition hover:bg-yellow-100 active:translate-y-0.5"
            >
               Responder
            </button>
          )}

          {respondiendo && (
            <RespuestaForm alias={c.alias} parentId={c.id} onCerrar={() => setRespondiendo(false)} />
          )}
        </div>
      </div>

      {c.respuestas && c.respuestas.length > 0 && (
        <div className="mt-3 space-y-3 border-l-4 border-dashed border-black/30 pl-4">
          {c.respuestas.map((r) => (
            <ComentarioCard key={r.id} comentario={r} deviceActual={deviceActual} />
          ))}
        </div>
      )}
    </div>
  );
}