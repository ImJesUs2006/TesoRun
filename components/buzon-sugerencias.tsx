"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, Send, X } from "lucide-react";
import { crearSugerencia } from "@/app/acciones-publicas";
import { MAX_SUGERENCIA } from "@/lib/limites";
import { UNA_SUGERENCIA_POR_HORA_MS } from "@/lib/limites";

const formatoEspera = new Intl.DateTimeFormat("es-MX", { minute: "2-digit", second: "2-digit" });

export function BuzonSugerencias() {
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [pending, startTransition] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await crearSugerencia({ mensaje });
      if (res.ok) {
        setFeedback("¡Gracias! Llegó directo al buzón del tesorero.");
        setMensaje("");
      } else {
        setFeedback(res.error);
        if (res.cooldownMs) setCooldown(Math.min(res.cooldownMs, UNA_SUGERENCIA_POR_HORA_MS));
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border-4 border-black bg-red-400 px-5 py-3 font-display text-white shadow-[6px_6px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-red-300 active:translate-x-1 active:translate-y-1 active:shadow-none"
        aria-label="Abrir buzón de sugerencias"
      >
        📩 Sugerencias
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] grid place-items-center bg-black/60 px-4"
            onClick={() => setAbierto(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Buzón de sugerencias"
          >
            <motion.div
              initial={{ scale: 0.85, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 24 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl border-4 border-black bg-white p-6 shadow-[10px_10px_0_0_#000]"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="font-display flex items-center gap-2 text-2xl text-black">
                  <Mail className="h-6 w-6" /> Buzón de sugerencias
                </p>
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="rounded-full border-2 border-black bg-white p-1.5 shadow-[2px_2px_0_0_#000] transition hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={enviar} className="grid gap-3">
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  maxLength={MAX_SUGERENCIA}
                  rows={4}
                  placeholder="Cuéntale al tesorero tu idea (anónimo, 1 por hora)."
                  className="w-full resize-none rounded-lg border-4 border-black px-3 py-2 font-semibold focus:outline-none focus:ring-4 focus:ring-yellow-200"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={pending || cooldown > 0 || mensaje.trim().length === 0}
                    className="inline-flex items-center gap-2 rounded-full border-4 border-black bg-red-400 px-5 py-2 font-black text-white shadow-[4px_4px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-red-300 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-40 disabled:hover:translate-y-0"
                  >
                    <Send className="h-4 w-4" /> Enviar
                  </button>
                  {feedback && (
                    <p className="rounded-lg border-2 border-black bg-lime-300 px-3 py-1.5 text-sm font-black text-black">
                      {feedback}
                    </p>
                  )}
                </div>
                {cooldown > 0 && (
                  <p className="text-xs font-black text-red-500">
                    Próxima sugerencia en {formatoEspera.format(new Date(cooldown))}.
                  </p>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}