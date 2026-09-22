"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { dividirTexto } from "@/lib/links";

/**
 * Renderiza el contenido plano (nunca HTML) y convierte las URLs
 * en chips "🔗 Ver Link" que abren un modal de advertencia antes de salir.
 */
export function TextoSeguro({ texto }: { texto: string }) {
  const [pendiente, setPendiente] = useState<string | null>(null);

  if (!texto.trim()) return null;
  const segmentos = dividirTexto(texto);

  return (
    <>
      <p className="mt-1 break-words text-sm font-semibold text-black">
        {segmentos.map((s, i) =>
          s.tipo === "texto" ? (
            <span key={i}>{s.texto}</span>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => setPendiente(s.url)}
              title={s.url}
              className="mx-0.5 inline-flex items-center gap-1 rounded-full border-2 border-black bg-blue-100 px-2 py-0.5 text-xs font-black text-black transition hover:bg-blue-200 active:translate-y-px"
            >
              🔗 Ver Link
            </button>
          ),
        )}
      </p>

      <AnimatePresence>
        {pendiente && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-black/60 px-4"
            onClick={() => setPendiente(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Aviso de enlace externo"
          >
            <motion.div
              initial={{ scale: 0.85, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl border-4 border-black bg-white p-6 shadow-[10px_10px_0_0_#000]"
            >
              <p className="font-display text-2xl text-black">Estás saliendo de TesoRun</p>
              <p className="mt-2 text-sm font-semibold text-black/70">
                Este enlace te lleva fuera de la app. No compartimos tus datos, pero revisa a dónde vas.
              </p>
              <p className="mt-3 max-w-full truncate rounded-lg border-2 border-black bg-yellow-50 px-3 py-2 text-xs font-bold text-black/70">
                {pendiente}
              </p>
              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPendiente(null)}
                  className="rounded-full border-4 border-black bg-white px-5 py-2 font-black text-black transition hover:bg-yellow-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.open(pendiente, "_blank", "noopener,noreferrer");
                    setPendiente(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border-4 border-black bg-emerald-400 px-5 py-2 font-black text-black transition hover:bg-emerald-300"
                >
                  <ExternalLink className="h-4 w-4" /> Continuar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}