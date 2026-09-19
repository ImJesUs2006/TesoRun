"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type TipoToast = "ok" | "error" | "info";

type Toast = {
  id: number;
  titulo: string;
  tipo: TipoToast;
  detalle?: string;
};

type Ctx = {
  notificar: (titulo: string, tipo?: TipoToast, detalle?: string) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export function useToast(): Ctx {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

const ESTILOS: Record<TipoToast, string> = {
  ok: "bg-lime-300",
  error: "bg-red-400",
  info: "bg-violet-300",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notificar = useCallback((titulo: string, tipo: TipoToast = "info", detalle?: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, titulo, tipo, detalle }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  return (
    <ToastCtx.Provider value={{ notificar }}>
      {children}

      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              className={`pointer-events-auto min-w-64 rounded-xl border-4 border-black p-3 shadow-[6px_6px_0_0_#000] ${ESTILOS[t.tipo]}`}
            >
              <p className="font-display text-sm uppercase tracking-wide text-black">{t.titulo}</p>
              {t.detalle && <p className="mt-0.5 text-sm font-bold text-black/70">{t.detalle}</p>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}