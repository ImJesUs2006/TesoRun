"use client";

import { useEffect, useRef, useState } from "react";
import { FileUp, Loader2, Mic, Square, Trash2 } from "lucide-react";
import { MAX_AUDIO_BYTES } from "@/lib/limites";
import { subirACloudinary } from "@/components/muro/cloudinary";
import { mostrarToast } from "@/components/muro/toast";

type Props = {
  audioUrl: string;
  onListo: (url: string) => void;
  onQuitar: () => void;
  onCargando: (cargando: boolean) => void;
};

/**
 * Nota de voz doble: grabar con el micrófono (MediaRecorder) o subir un
 * archivo de audio local. En ambos casos el Blob se sube DIRECTAMENTE a
 * Cloudinary (unsigned upload) y a la Server Action solo llega el secure_url
 * (evita el límite de payload de Vercel, 413). Avifa de errores de red y
 * de servidor con toasts.
 */
export function GrabadoraAudio({ audioUrl, onListo, onQuitar, onCargando }: Props) {
  const mediaRef = useRef<MediaRecorder | null>(null);
  const trozosRef = useRef<Blob[]>([]);
  const [grabando, setGrabando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subirBlob(blob: Blob, mensajePesado: string) {
    if (blob.size === 0) {
      setError("No se pudo capturar el audio.");
      return;
    }
    if (blob.size > MAX_AUDIO_BYTES) {
      setError(mensajePesado);
      mostrarToast(mensajePesado);
      return;
    }
    setSubiendo(true);
    onCargando(true);
    setError(null);
    const r = await subirACloudinary(blob, "audio");
    setSubiendo(false);
    onCargando(false);
    if (!r.ok) {
      setError(r.error);
      mostrarToast(r.error);
      return;
    }
    onListo(r.url);
  }

  async function empezar() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg"].find((t) =>
        MediaRecorder.isTypeSupported(t),
      );
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      trozosRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) trozosRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const tipo = rec.mimeType || "audio/webm";
        subirBlob(new Blob(trozosRef.current, { type: tipo }), "Audio muy largo. Graba una nota más corta (máx ~2 min).");
      };
      mediaRef.current = rec;
      rec.start();
      setGrabando(true);
    } catch {
      setError("No se pudo acceder al micrófono.");
    }
  }

  function detener() {
    const rec = mediaRef.current;
    if (!rec || rec.state === "inactive") return;
    setGrabando(false);
    rec.stop();
  }

  function subirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    subirBlob(archivo, "Archivo de audio muy pesado (máx 3 MB).");
  }

  useEffect(() => () => mediaRef.current?.stream.getTracks().forEach((t) => t.stop()), []);

  if (audioUrl) {
    return (
      <div className="flex items-center gap-2">
        <audio controls preload="metadata" src={audioUrl} className="h-10 max-w-[220px]" />
        <button
          type="button"
          onClick={onQuitar}
          title="Quitar nota de voz"
          className="rounded-full border-2 border-black bg-white p-1.5 shadow-[2px_2px_0_0_#000] transition hover:bg-red-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {grabando || subiendo ? (
        <>
          {grabando && (
            <>
              <span className="flex h-8 w-8 items-center justify-center">
                <span className="h-4 w-4 animate-ping rounded-full bg-red-500" />
              </span>
              <button
                type="button"
                onClick={detener}
                className="rounded-full border-2 border-black bg-red-400 p-2 text-white shadow-[2px_2px_0_0_#000] transition hover:bg-red-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                title="Detener y enviar"
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            </>
          )}
          <span className="flex items-center gap-1 text-xs font-black text-black/60">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {subiendo ? "Subiendo a Cloudinary…" : "Ho', grabando…"}
          </span>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={empezar}
            title="Nota de voz"
            className="rounded-full border-2 border-black bg-white p-2 shadow-[2px_2px_0_0_#000] transition hover:bg-yellow-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Mic className="h-4 w-4" />
          </button>
          <label
            title="Subir archivo de audio"
            className="inline-flex cursor-pointer items-center rounded-full border-2 border-black bg-white p-2 shadow-[2px_2px_0_0_#000] transition hover:bg-yellow-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <FileUp className="h-4 w-4" />
            <input
              type="file"
              accept="audio/*"
              aria-label="Subir archivo de audio"
              tabIndex={-1}
              className="absolute left-[-9999px] opacity-0"
              onChange={subirArchivo}
            />
          </label>
        </>
      )}
      {error && <span className="text-xs font-bold text-red-600">{error}</span>}
    </div>
  );
}