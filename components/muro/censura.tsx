"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Eye, EyeOff, Minimize2, Plus, Minus, X } from "lucide-react";

const CLAVE = "tesorun_censura_imagenes";

// Estado en memoria compartido para que cualquier ImagenCensurable se entere
// del toggle global (botón del aviso). Seed único por pestaña.
let censurado = true;
const oyentes = new Set<() => void>();
let iniciado = false;

function iniciar() {
  if (iniciado || typeof window === "undefined") return;
  iniciado = true;
  const guardado = window.localStorage.getItem(CLAVE);
  if (guardado === null) {
    window.localStorage.setItem(CLAVE, "1");
  } else {
    censurado = guardado === "1";
  }
}

function suscribir(cb: () => void) {
  oyentes.add(cb);
  return () => {
    oyentes.delete(cb);
  };
}
function obtener() {
  return censurado;
}

export function alternarCensura() {
  censurado = !censurado;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CLAVE, censurado ? "1" : "0");
  }
  oyentes.forEach((cb) => cb());
}

/** true = las imágenes se muestran con blur + gris hasta que las revelas. */
export function useCensura(): boolean {
  useSyncExternalStore(suscribir, obtener, obtener);
  useEffect(() => {
    iniciar();
    oyentes.forEach((cb) => cb());
  }, []);
  return obtener();
}

/** Lightbox a pantalla completa con zoom (+ / −), respetando la censura. */
function VisorZoom({ src, alt }: { src: string; alt: string }) {
  const [abierto, setAbierto] = useState(false);
  const [escala, setEscala] = useState(1);
  const [revelada, setRevelada] = useState(false);
  const censuradas = useCensura();
  const oculta = censuradas && !revelada;

  useEffect(() => {
    if (!abierto) return;
    setEscala(1);
    const enTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
      if (e.key === "+" || e.key === "=") setEscala((s) => Math.min(4, s + 0.5));
      if (e.key === "-") setEscala((s) => Math.max(0.5, s - 0.5));
    };
    window.addEventListener("keydown", enTecla);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", enTecla);
      document.body.style.overflow = "";
    };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4"
      onClick={() => setAbierto(false)}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div className="relative flex max-h-full max-w-full flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 overflow-hidden rounded-lg border-2 border-white bg-black p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            style={{ transform: `scale(${escala})` }}
            className={`max-h-[72vh] max-w-[82vw] object-contain transition-transform duration-200 ${oculta ? "blur-xl grayscale" : ""}`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {oculta && (
            <button
              type="button"
              onClick={() => setRevelada(true)}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-white bg-white/10 px-3 py-1.5 text-sm font-black text-white transition hover:bg-white/20"
            >
              <Eye className="h-4 w-4" /> Mostrar imagen
            </button>
          )}
          <button
            type="button"
            onClick={() => setEscala((s) => Math.max(0.5, s - 0.5))}
            disabled={escala <= 0.5}
            title="Alejar"
            className="inline-flex items-center gap-1 rounded-full border-2 border-white bg-white/10 px-3 py-1.5 text-sm font-black text-white transition hover:bg-white/20 disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setEscala(1)}
            title="Restablecer zoom"
            className="inline-flex items-center gap-1 rounded-full border-2 border-white bg-white/10 px-3 py-1.5 text-sm font-black text-white transition hover:bg-white/20"
          >
            <Minimize2 className="h-4 w-4" /> {Math.round(escala * 100)}%
          </button>
          <button
            type="button"
            onClick={() => setEscala((s) => Math.min(4, s + 0.5))}
            disabled={escala >= 4}
            title="Acercar"
            className="inline-flex items-center gap-1 rounded-full border-2 border-white bg-white/10 px-3 py-1.5 text-sm font-black text-white transition hover:bg-white/20 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="inline-flex items-center gap-1 rounded-full border-2 border-white bg-white px-3 py-1.5 text-sm font-black text-black transition hover:bg-yellow-200"
          >
            <X className="h-4 w-4" /> Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Imagen con censura por defecto: blur + grayscale hasta que la
 * revelas con el botón (o desactivas la censura global). Clic para
 * ampliarla en un lightbox con zoom.
 */
export function ImagenCensurable({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const censuradas = useCensura();
  const [revelada, setRevelada] = useState(false);
  const [visores, setVisores] = useState(0);
  const oculta = censuradas && !revelada;

  return (
    <>
      <div className="relative inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onClick={() => setVisores((v) => v + 1)}
          title="Clic para ampliar"
          className={`${className} cursor-zoom-in transition-all duration-300 ${oculta ? "blur-xl grayscale" : ""}`}
        />
        {oculta && (
          <button
            type="button"
            onClick={() => setRevelada(true)}
            className="absolute inset-0 z-10 flex items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-black bg-black/45 text-xs font-black text-white"
          >
            <Eye className="h-3.5 w-3.5" /> Mostrar
          </button>
        )}
      </div>
      {visores > 0 && <VisorZoom key={visores} src={src} alt={alt} />}
    </>
  );
}

/** Aviso de una sola vez: "Imágenes censuradas por defecto. [Desactivar]". */
export function AvisoCensura() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    iniciar();
    if (window.localStorage.getItem(CLAVE) === null) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed left-1/2 top-4 z-[80] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border-4 border-black bg-white px-4 py-3 shadow-[6px_6px_0_0_#000]">
      <EyeOff className="h-5 w-5 shrink-0 text-black" />
      <p className="flex-1 text-sm font-bold text-black">
        Imágenes censuradas por defecto. <span className="text-black/50">Clic para ampliar o desactiva.</span>
      </p>
      <button
        type="button"
        onClick={() => {
          alternarCensura();
          setVisible(false);
        }}
        className="rounded-full border-2 border-black bg-yellow-400 px-3 py-1.5 text-xs font-black text-black transition hover:bg-yellow-300"
      >
        Desactivar
      </button>
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") window.localStorage.setItem(CLAVE, "1");
          setVisible(false);
        }}
        aria-label="Cerrar aviso"
        className="rounded-full border-2 border-black bg-white px-2 py-1 text-xs font-black text-black transition hover:bg-zinc-100"
      >
        X
      </button>
    </div>
  );
}