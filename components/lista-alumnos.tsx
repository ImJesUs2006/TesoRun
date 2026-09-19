"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Users } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Insignias } from "@/components/insignias";
import { ModalAlumno } from "@/components/modal-alumno";
import { CUOTA_SEMANAL } from "@/lib/config";
import { insigniasDe } from "@/lib/badges";
import type { AlumnoPublico, NotaTransaccion } from "@/lib/tipos";

type Props = {
  alumnos: AlumnoPublico[];
  pagos: Record<string, Date[]>;
  notas: Record<string, NotaTransaccion[]>;
  fechaInicio?: Date | null;
};

export function ListaAlumnos({ alumnos, pagos, notas, fechaInicio }: Props) {
  const [seleccionado, setSeleccionado] = useState<AlumnoPublico | null>(null);

  return (
    <section>
      <h2 className="font-display mb-6 flex items-center gap-2 text-3xl uppercase text-black">
        <Users className="h-7 w-7" /> La clase completa
      </h2>

      {alumnos.length === 0 ? (
        <p className="rounded-xl border-4 border-dashed border-black bg-white p-8 text-center font-bold text-black/50 shadow-[8px_8px_0_0_#000]">
          Aún no hay compañeros registrados.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {alumnos.map((a) => {
            const atrasado = a.deuda > 0;
            const insignias = insigniasDe(a);

            return (
              <motion.div
                key={a.id}
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 16 }}
                className="flex cursor-pointer items-center gap-3 rounded-xl border-4 border-black bg-white p-4 shadow-[6px_6px_0_0_#000]"
                onClick={() => setSeleccionado(a)}
              >
                <Avatar nombre={a.nombre} avatarUrl={a.avatarUrl} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-black text-black">{a.nombre}</p>
                  <p className="text-xs font-bold text-black/60">
                    {a.semanasPagadas} sem · ${a.semanasPagadas * CUOTA_SEMANAL}
                  </p>
                </div>
                <div className="ml-auto flex flex-col items-end gap-1">
                  <span
                    className={
                      atrasado
                        ? "rounded-full border-2 border-black bg-red-500 px-2 py-0.5 text-xs font-black text-white"
                        : "rounded-full border-2 border-black bg-lime-300 px-2 py-0.5 text-xs font-black text-black"
                    }
                  >
                    {atrasado
                      ? `Debe ${a.deuda} sem · $${a.deuda * CUOTA_SEMANAL}`
                      : "Al día"}
                  </span>
                  <Insignias insignias={insignias} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

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