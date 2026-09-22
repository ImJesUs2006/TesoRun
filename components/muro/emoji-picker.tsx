"use client";

import { useState } from "react";
import { Smile } from "lucide-react";

const EMOJIS_SUGERIDOS = [
  "😂", "🔥", "❤️", "😭", "🥳", "😍",
  "👍", "🙏", "👀", "😱", "🚀", "💀",
  "🤣", "😎", "💯", "😅", "😡", "🥺",
  "🙃", "🙌", "💪", "😈", "🤡", "👻",
  "🤖", "😴", "🤔", "🎉", "🥇", "📉",
];

type Props = {
  onElegir: (emoji: string) => void;
};

/**
 * Selector de reacciones: emojis frecuentes + campo para teclear
 * CUALQUIER emoji del teclado nativo (el servidor lo valida igual).
 */
export function EmojiPicker({ onElegir }: Props) {
  const [personalizado, setPersonalizado] = useState("");

  return (
    <div className="rounded-xl border-4 border-black bg-white p-3 shadow-[6px_6px_0_0_#000]">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-black text-black">
          <Smile className="h-4 w-4" /> Reacciona
        </p>
        <span className="text-[10px] font-bold text-black/40">elige cualquiera</span>
      </div>

      <div className="mt-2 grid grid-cols-6 gap-1">
        {EMOJIS_SUGERIDOS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => {
              onElegir(e);
              setPersonalizado("");
            }}
            className="rounded-md border border-black/20 p-1 text-lg leading-none transition hover:-translate-y-0.5 hover:bg-yellow-50"
          >
            {e}
          </button>
        ))}
      </div>

      <div className="mt-2 flex gap-1.5">
        <input
          value={personalizado}
          onChange={(e) => setPersonalizado(e.target.value)}
          maxLength={16}
          placeholder="Otro emoji del teclado…"
          className="w-full min-w-0 rounded-lg border-2 border-black px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-200"
        />
        <button
          type="button"
          disabled={personalizado.trim().length === 0}
          onClick={() => {
            onElegir(personalizado.trim());
            setPersonalizado("");
          }}
          className="shrink-0 rounded-lg border-2 border-black bg-yellow-300 px-3 py-1 text-xs font-black text-black transition hover:bg-yellow-200 disabled:opacity-40"
        >
          Añadir
        </button>
      </div>
    </div>
  );
}