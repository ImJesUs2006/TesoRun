"use client";

import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cambiarSonido, sonidoMuteado } from "@/lib/sound";

export function BotonSonido() {
  const [mudo, setMudo] = useState(sonidoMuteado());

  return (
    <button
      type="button"
      onClick={() => setMudo(cambiarSonido())}
      title={mudo ? "Activar sonido" : "Silenciar sonido"}
      className="rounded-full border-4 border-black bg-white p-3 shadow-[4px_4px_0_0_#000] transition hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none"
    >
      {mudo ? (
        <VolumeX className="h-5 w-5 text-black/60" aria-hidden="true" />
      ) : (
        <Volume2 className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}