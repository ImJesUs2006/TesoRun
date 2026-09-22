"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff, Loader2, Search, X } from "lucide-react";
import { CATALOGO_GIFS } from "@/lib/gifs";

const LIMITE = 8;
const API_GIPHY = "https://api.giphy.com/v1/gifs/search";

type GifItem = { url: string; preview?: string; alt: string };

type Props = {
  gifUrl: string;
  onElegir: (url: string) => void;
  onQuitar: () => void;
};

const locales: GifItem[] = CATALOGO_GIFS.map((g) => ({ url: g.url, alt: g.alt }));

/**
 * Buscador real de GIFs: fetch directo a la API pública de Giphy
 * (NEXT_PUBLIC_GIPHY_API_KEY) con rating=pg-13 y limit=8.
 * Sin clave o sin conexión: cae al catálogo local de stickers.
 */
export function SelectorGifs({ gifUrl, onElegir, onQuitar }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [items, setItems] = useState<GifItem[]>(locales);
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [externos, setExternos] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    const termino = busqueda.trim();
    if (timerRef.current) clearTimeout(timerRef.current);

    if (termino.length === 0) {
      setItems(locales);
      setExternos(false);
      setAviso(null);
      setCargando(false);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
    if (!apiKey) {
      setAviso("Sin NEXT_PUBLIC_GIPHY_API_KEY; GIFs locales.");
      const filtradas = locales.filter(
        (g) => g.alt.toLowerCase().includes(termino.toLowerCase()),
      );
      setItems(filtradas.length > 0 ? filtradas : locales);
      setExternos(false);
      setCargando(false);
      return;
    }

    setCargando(true);
    timerRef.current = setTimeout(async () => {
      try {
        const url = new URL(API_GIPHY);
        url.searchParams.set("api_key", apiKey);
        url.searchParams.set("q", termino);
        url.searchParams.set("limit", String(LIMITE));
        url.searchParams.set("rating", "pg-13");

        const res = await fetch(url.toString(), { signal: AbortSignal.timeout(9000) });
        const datos = (await res.json()) as {
          data?: Array<{ images?: { fixed_height?: { url?: string } }; alt_text?: string }>;
        };

        const resultados: GifItem[] = (datos.data ?? [])
          .filter((g) => g.images?.fixed_height?.url)
          .slice(0, LIMITE)
          .map((g) => ({
            url: g.images!.fixed_height!.url as string,
            preview: g.images!.fixed_height!.url,
            alt: (g.alt_text ?? "GIF").slice(0, 120),
          }));

        if (resultados.length > 0) {
          setItems(resultados);
          setExternos(true);
          setAviso(null);
        } else {
          setItems(locales);
          setExternos(false);
          setAviso("Sin resultados en Giphy; GIFs locales.");
        }
      } catch {
        setItems(locales);
        setExternos(false);
        setAviso("Sin conexión con Giphy; GIFs locales.");
      } finally {
        setCargando(false);
      }
    }, 350);
  }, [busqueda]);

  if (gifUrl) {
    return (
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gifUrl} alt="GIF adjunto" className="h-14 w-14 rounded-md border-2 border-black bg-white object-cover" />
        <button
          type="button"
          onClick={onQuitar}
          title="Quitar GIF"
          className="rounded-full border-2 border-black bg-white p-1.5 shadow-[2px_2px_0_0_#000] transition hover:bg-red-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        title="Adjuntar un GIF"
        className="rounded-full border-2 border-black bg-white p-2 shadow-[2px_2px_0_0_#000] transition hover:bg-yellow-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        <Search className="h-4 w-4" />
      </button>

      {abierto && (
        <div className="absolute bottom-12 left-0 z-30 w-80 rounded-xl border-4 border-black bg-white p-3 shadow-[8px_8px_0_0_#000]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-black text-black">
              Busca un GIF <span className="text-[10px] font-bold text-black/40">{externos ? "· Giphy" : ""}</span>
            </p>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="rounded-full border-2 border-black bg-white p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="ej. fuego, llanto, drake…"
            autoFocus
            className="w-full rounded-lg border-2 border-black px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-200"
          />
          {aviso && (
            <p className="mt-1.5 rounded-md border-2 border-black bg-yellow-100 px-2 py-1 text-[11px] font-bold text-black">
              {aviso}
            </p>
          )}
          <div className="mt-2 grid max-h-56 grid-cols-2 gap-1.5 overflow-y-auto">
            {cargando ? (
              <div className="col-span-2 flex items-center justify-center gap-2 py-8 text-sm font-bold text-black/50">
                <Loader2 className="h-4 w-4 animate-spin" /> Buscando…
              </div>
            ) : items.length === 0 ? (
              <div className="col-span-2 flex items-center gap-2 py-6 text-sm font-bold text-black/50">
                <ImageOff className="h-4 w-4" /> Sin resultados
              </div>
            ) : (
              items.map((g, i) => (
                <button
                  key={`${g.url}-${i}`}
                  type="button"
                  title={g.alt}
                  onClick={() => {
                    onElegir(g.url);
                    setAbierto(false);
                    setBusqueda("");
                  }}
                  className="overflow-hidden rounded-md border-2 border-black bg-yellow-50 transition hover:-translate-y-0.5 hover:bg-yellow-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.preview ?? g.url}
                    alt={g.alt}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}