"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

type TipoToast = "error" | "ok";

type Toast = { id: number; mensaje: string; tipo: TipoToast };

type Listener = (t: Toast) => void;

let siguienteId = 0;
const listeners = new Set<Listener>();

/** Dispara un toast desde cualquier componente cliente. */
export function mostrarToast(mensaje: string, tipo: TipoToast = "error") {
  const t = { id: ++siguienteId, mensaje, tipo };
  listeners.forEach((l) => l(t));
}

/** Rendermizalo UNA vez (ideal en el layout raíz). */
export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const escuchar = (t: Toast) => {
      setToasts((prev) => [...prev.slice(-3), t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 4500);
    };
    listeners.add(escuchar);
    return () => {
      listeners.delete(escuchar);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-xs flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`flex items-center gap-2 rounded-lg border-4 border-black px-3 py-2 text-sm font-black shadow-[4px_4px_0_0_#000] ${
            t.tipo === "error" ? "bg-red-100 text-red-700" : "bg-lime-200 text-black"
          }`}
        >
          {t.tipo === "error" ? (
            <XCircle className="h-5 w-5 shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          )}
          <span>{t.mensaje}</span>
        </div>
      ))}
    </div>
  );
}