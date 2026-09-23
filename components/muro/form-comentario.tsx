"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { crearComentario } from "@/app/acciones-publicas";
import { GrabadoraAudio } from "./grabadora-audio";
import { SelectorGifs } from "./selector-gifs";
import { ImagenCensurable } from "./censura";
import { subirACloudinary } from "./cloudinary";
import { mostrarToast } from "./toast";
import { leerNombreGuardado, guardarNombre, SelectorNombre } from "./selector-nombre";
import { MAX_CONTENIDO, COOLDOWN_COMENTARIO_MS, MAX_IMAGEN_BYTES } from "@/lib/limites";

const formatoEspera = new Intl.DateTimeFormat("es-MX", { minute: "2-digit", second: "2-digit" });

type Feedback = { tipo: "ok" | "error"; mensaje: string };

export function FormComentario() {
  const [contenido, setContenido] = useState("");
  const [gifUrl, setGifUrl] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [subiendoAudio, setSubiendoAudio] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [modoNombre, setModoNombre] = useState(() => leerNombreGuardado().length > 0);
  const [nombre, setNombre] = useState(leerNombreGuardado);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pending, startTransition] = useTransition();

  const subiendo = subiendoImagen || subiendoAudio;

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  function esperar(ms: number) {
    setCooldown(Math.max(0, Math.min(ms, COOLDOWN_COMENTARIO_MS)));
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return c - 1000;
      });
    }, 1000);
  }

  async function procesarImagen(archivo: File | undefined) {
    if (!archivo) return;
    setFeedback(null);
    if (!archivo.type.startsWith("image/")) {
      mostrarToast("Solo se permiten imágenes");
      return;
    }
    if (archivo.size > MAX_IMAGEN_BYTES) {
      mostrarToast("Imagen muy pesada (máx ~1.5 MB)");
      return;
    }
    setSubiendoImagen(true);
    try {
      const r = await subirACloudinary(archivo, "imagen");
      if (!r.ok) {
        mostrarToast(r.error);
        return;
      }
      setImagenUrl(r.url);
      setGifUrl("");
    } finally {
      setSubiendoImagen(false);
    }
  }

  function subirImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    void procesarImagen(archivo);
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const nombreFinal = modoNombre ? nombre.trim() : "";
    if (modoNombre && nombreFinal.length === 0) {
      mostrarToast("Escribe tu nombre o elige Anónimo");
      return;
    }

    const vacio =
      contenido.trim().length === 0 && gifUrl === "" && imagenUrl === "" && audioUrl === "";
    if (vacio) {
      mostrarToast("Escribe un mensaje, agrega un GIF o una imagen / nota de voz");
      return;
    }

    startTransition(async () => {
      const res = await crearComentario({ contenido, gifUrl, imageUrl: imagenUrl, audioUrl, nombre: nombreFinal });
      if (res.ok) {
        if (nombreFinal.length > 0) guardarNombre(nombreFinal);
        setContenido("");
        setGifUrl("");
        setImagenUrl("");
        setAudioUrl("");
        setFeedback(null);
        mostrarToast("Comentario publicado", "ok");
      } else {
        setFeedback({ tipo: "error", mensaje: res.error });
        mostrarToast(res.error);
        if (res.cooldownMs) esperar(res.cooldownMs);
      }
    });
  }

  const vacio =
    contenido.trim().length === 0 && gifUrl === "" && imagenUrl === "" && audioUrl === "";

  return (
    <form onSubmit={enviar} className="grid gap-3 rounded-xl border-4 border-black bg-yellow-50 p-4 shadow-[5px_5px_0_0_#000]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-black uppercase text-black/50">Publica como:</span>
        <SelectorNombre
          modo={modoNombre}
          nombre={nombre}
          onChangeModo={setModoNombre}
          onChangeNombre={setNombre}
        />
      </div>

      <div>
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          maxLength={MAX_CONTENIDO}
          rows={2}
          placeholder="Rompe el hielo..."
          onPaste={(e) => {
            const items = e.clipboardData?.files;
            if (!items || items.length === 0) return;
            const archivo = Array.from(items).find((f) => f.type.startsWith("image/"));
            if (!archivo) return;
            e.preventDefault();
            void procesarImagen(archivo);
          }}
          className="w-full resize-none rounded-lg border-4 border-black px-3 py-2 font-semibold focus:outline-none focus:ring-4 focus:ring-yellow-200"
        />
        <p className={contenido.length >= MAX_CONTENIDO ? "mt-1 text-right text-xs font-black text-red-500" : "mt-1 text-right text-xs font-bold text-black/40"}>
          {contenido.length}/{MAX_CONTENIDO}
        </p>
      </div>

      {subiendo && (
        <p className="flex items-center gap-2 rounded-lg border-2 border-black bg-white px-3 py-1.5 text-sm font-black text-black/70">
          <Loader2 className="h-4 w-4 animate-spin" />
          {subiendoImagen ? "Subiendo imagen a Cloudinary…" : "Subiendo audio a Cloudinary…"}
        </p>
      )}

      {(gifUrl || imagenUrl) && (
        <div className="flex items-center gap-2">
          <ImagenCensurable
            src={gifUrl || imagenUrl}
            alt={gifUrl ? "GIF adjunto" : "Imagen adjunta"}
            className="h-16 w-16 rounded-md border-2 border-black object-cover"
          />
          <button
            type="button"
            onClick={() => {
              setGifUrl("");
              setImagenUrl("");
            }}
            title="Quitar adjunto"
            className="rounded-full border-2 border-black bg-white p-1.5 shadow-[2px_2px_0_0_#000] transition hover:bg-red-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || cooldown > 0 || vacio || subiendo}
          className="inline-flex items-center gap-2 rounded-full border-4 border-black bg-yellow-400 px-6 py-2.5 font-display text-lg text-black shadow-[5px_5px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-yellow-300 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-40 disabled:hover:translate-y-0"
        >
          <Send className="h-4 w-4" />
          {cooldown > 0
            ? "Espera…"
            : subiendo
              ? "Subiendo archivo…"
              : pending
                ? "Publicando…"
                : "Publicar"}
        </button>

        <SelectorGifs gifUrl={gifUrl} onElegir={setGifUrl} onQuitar={() => setGifUrl("")} />

        <label
          title="Subir imagen"
          aria-disabled={subiendo}
          className={`inline-flex cursor-pointer items-center rounded-full border-2 border-black p-2 shadow-[2px_2px_0_0_#000] transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
            subiendo ? "pointer-events-none bg-yellow-200 shadow-none" : "bg-white hover:bg-yellow-100"
          }`}
        >
          {subiendoImagen ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          <input
            type="file"
            accept="image/*"
            aria-label="Subir imagen"
            tabIndex={-1}
            className="absolute left-[-9999px] opacity-0"
            disabled={subiendo}
            onChange={subirImagen}
          />
        </label>

        <GrabadoraAudio
          audioUrl={audioUrl}
          onListo={setAudioUrl}
          onQuitar={() => setAudioUrl("")}
          onCargando={setSubiendoAudio}
        />

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

      {cooldown > 0 && (
        <p className="text-xs font-black text-red-500">
          Siguiente comentario disponible en {formatoEspera.format(new Date(cooldown))}.
        </p>
      )}
    </form>
  );
}