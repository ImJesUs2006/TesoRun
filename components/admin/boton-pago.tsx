"use client";

import { useState, useTransition } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Lock, Undo2, X } from "lucide-react";
import { deshacerPago, registrarPago } from "@/app/admin-teso/actions";
import { reproducirError, reproducirMoneda } from "@/lib/sound";
import { useToast } from "./toast-provider";

function lluviaConfeti() {
  confetti({
    particleCount: 140,
    spread: 85,
    startVelocity: 45,
    origin: { y: 0.7 },
    colors: ["#fde047", "#22c55e", "#3b82f6", "#ef4444", "#a855f7"],
  });
}

type Props = {
  alumnoId: string;
  nombre?: string;
  bloqueado?: boolean;
};

export function BotonPago({ alumnoId, nombre, bloqueado = false }: Props) {
  const { notificar } = useToast();
  const [abierto, setAbierto] = useState(false);
  const [nota, setNota] = useState("");
  const [pending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      const res = await registrarPago(alumnoId, nota);
      if (res.ok) {
        reproducirMoneda();
        lluviaConfeti();
        setAbierto(false);
        setNota("");
        notificar("Pago registrado", "ok", nombre ? `${nombre} · +$20` : "+$20 cuota semanal");
      } else {
        reproducirError();
        notificar("Error al cobrar", "error", res.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => !bloqueado && setAbierto(true)}
        disabled={pending || bloqueado}
        title={bloqueado ? "Ya está al día. No hay deuda que cobrar." : "Registrar +$20"}
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-4 border-black bg-yellow-400 px-5 py-2.5 font-display text-xl text-black shadow-[5px_5px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-yellow-300 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {bloqueado ? <Lock className="h-5 w-5" /> : null}+$20
      </button>

      {abierto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
        >
          <motion.div
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="relative z-[60] w-full max-w-sm rounded-2xl border-4 border-black bg-white p-5 opacity-100 shadow-[10px_10px_0_0_#000]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl uppercase text-black">Registrar +$20</p>
                {nombre && <p className="text-sm font-black text-black/60">{nombre}</p>}
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cancelar"
                className="rounded-full border-2 border-black bg-white p-2 shadow-[3px_3px_0_0_#000] hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-4 block">
              <span className="mb-1 block text-xs font-black uppercase text-black/60">
                Nota del tesorero (opcional)
              </span>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={3}
                maxLength={200}
                autoFocus
                placeholder="Ej. Me pagó con billete de 500"
                className="w-full resize-none rounded-lg border-4 border-black px-3 py-2 font-semibold focus:outline-none focus:ring-4 focus:ring-yellow-200"
              />
            </label>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={confirmar}
                disabled={pending || bloqueado}
                className="flex-1 rounded-full border-4 border-black bg-yellow-400 px-5 py-2.5 font-display text-lg text-black shadow-[5px_5px_0_0_#000] transition hover:bg-yellow-300 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "Guardando…" : "Confirmar cobro"}
              </button>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                disabled={pending}
                className="rounded-full border-4 border-black bg-white px-5 py-2.5 font-bold text-black shadow-[5px_5px_0_0_#000] transition hover:bg-gray-100"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

export function BotonDeshacer({ alumnoId }: { alumnoId: string }) {
  const { notificar } = useToast();
  const [pending, startTransition] = useTransition();

  function deshacer() {
    startTransition(async () => {
      const res = await deshacerPago(alumnoId);
      if (res.ok) notificar("Pago revertido", "info", "Se deshizo el último +$20.");
      else notificar("Nada que deshacer", "error", res.error);
    });
  }

  return (
    <button
      type="button"
      onClick={deshacer}
      disabled={pending}
      title="Deshacer último pago"
      className="rounded-full border-4 border-black bg-white p-2.5 shadow-[4px_4px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-violet-100 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
    >
      <Undo2 className="h-4 w-4" />
    </button>
  );
}