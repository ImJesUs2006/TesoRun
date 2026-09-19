"use client";

import { motion } from "framer-motion";
import { Car, Flag } from "lucide-react";

type Props = {
  recaudado: number;
  meta: number;
};

export function PistaCarreras({ recaudado, meta }: Props) {
  const pct = Math.min(100, Math.round((recaudado / meta) * 100));
  const restante = Math.max(0, meta - recaudado);

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display flex items-center gap-2 text-2xl uppercase text-black">
          <Flag className="h-6 w-6" /> Pista recaudadora
        </h2>
        <div className="flex gap-2 text-sm font-black text-black">
          <span className="rounded-full border-2 border-black bg-lime-300 px-3 py-1">
            Recaudado: ${recaudado}
          </span>
          <span className="rounded-full border-2 border-black bg-white px-3 py-1">
            Meta: ${meta}
          </span>
        </div>
      </div>

      <div className="relative h-16 overflow-hidden rounded-xl border-4 border-black bg-white shadow-[8px_8px_0_0_#000]">
        {/* carriles de pista */}
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_18px,rgba(0,0,0,0.07)_18px,rgba(0,0,0,0.07)_20px)]" />

        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 70, damping: 18, delay: 0.15 }}
          className="relative flex h-full items-center justify-end overflow-hidden bg-gradient-to-r from-yellow-300 via-orange-400 to-green-500 pr-1.5"
        >
          <span className="relative z-10 -rotate-12">
            <Car className="h-7 w-7 fill-orange-500 text-black drop-shadow-[2px_2px_0_rgba(0,0,0,0.4)]" aria-hidden="true" />
          </span>
        </motion.div>

        <span
          className="absolute right-0 top-0 h-full w-3.5"
          style={{
            backgroundImage: "repeating-conic-gradient(#000 0% 25%, #fff 0% 50%)",
            backgroundSize: "7px 7px",
          }}
        />

        <span className="absolute bottom-1 right-1/2 z-20 translate-x-1/2 rounded border-2 border-black bg-black px-2 py-0.5 text-xs font-black text-white">
          {pct}%
        </span>
      </div>

      <p className="mt-2 text-right text-sm font-bold text-black/60">
        {restante > 0 ? `Faltan $${restante} para la meta del mes.` : "Meta cumplida. ¡Imparable!"}
      </p>
    </section>
  );
}