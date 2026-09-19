"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Skull } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { ModalAlumno } from "@/components/modal-alumno";
import { CUOTA_SEMANAL } from "@/lib/config";
import type { AlumnoPublico, NotaTransaccion } from "@/lib/tipos";

type Props = {
  morosos: AlumnoPublico[];
  pagos: Record<string, Date[]>;
  notas: Record<string, NotaTransaccion[]>;
  fechaInicio?: Date | null;
};

export function ListaNegra({ morosos, pagos, notas, fechaInicio }: Props) {
  const [seleccionado, setSeleccionado] = useState<AlumnoPublico | null>(null);

  return (
    <section className="rounded-xl border-4 border-black bg-white p-6 shadow-[10px_10px_0_0_#000]">
      <h2 className="font-display mb-4 flex items-center gap-2 text-2xl uppercase text-black">
        <Skull className="h-6 w-6" /> Lista negra
      </h2>

      <ul className="grid gap-3 sm:grid-cols-2">
        {morosos.map((d) => (
          <motion.li
            key={d.id}
            whileHover={{ scale: 1.03, y: -3 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            onClick={() => setSeleccionado(d)}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border-2 border-black bg-red-50 p-3 shadow-[3px_3px_0_0_#000]"
          >
            <div className="flex items-center gap-3">
              <Avatar nombre={d.nombre} avatarUrl={d.avatarUrl} size="sm" />
              <span className="font-bold text-black">{d.nombre}</span>
            </div>
            <span className="rounded-md border-2 border-black bg-red-500 px-2 py-1 font-black text-white">
              ${d.deuda * CUOTA_SEMANAL}
            </span>
          </motion.li>
        ))}
      </ul>

      <AnimatePresence>
        {seleccionado && (
          <ModalAlumno
            alumno={seleccionado}
            pagos={pagos[seleccionado.id] ?? []}
            notas={notas[seleccionado.id] ?? []}
            fechaInicio={fechaInicio}
            onClose={() => setSeleccionado(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}