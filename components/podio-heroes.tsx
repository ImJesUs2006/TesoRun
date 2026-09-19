"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Trophy } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Insignias } from "@/components/insignias";
import { ModalAlumno } from "@/components/modal-alumno";
import { CUOTA_SEMANAL } from "@/lib/config";
import { insigniasDe } from "@/lib/badges";
import type { AlumnoPublico, NotaTransaccion } from "@/lib/tipos";

type Props = {
  heroes: AlumnoPublico[];
  pagos: Record<string, Date[]>;
  notas: Record<string, NotaTransaccion[]>;
  fechaInicio?: Date | null;
};

// Orden visual del podio: 2º, 1º, 3º
const ORDEN = [1, 0, 2] as const;
// Cada entrada corresponde a la posicion visual: [2º plata, 1º oro, 3º bronce]
const ALTURAS = ["h-24", "h-36", "h-16"] as const;
const COLORES = ["bg-sky-400", "bg-yellow-400", "bg-emerald-400"] as const;
const MEDALLAS = ["#cbd5e1", "#facc15", "#d97706"] as const;

export function PodioHeroes({ heroes, pagos, notas, fechaInicio }: Props) {
  const [seleccionado, setSeleccionado] = useState<AlumnoPublico | null>(null);
  const top = heroes.slice(0, 3);
  if (top.length === 0) return null;

  return (
    <section>
      <h2 className="font-display mb-6 flex items-center justify-center gap-2 text-3xl uppercase text-black">
        <Trophy className="h-8 w-8 fill-yellow-400" /> Podio de héroes
      </h2>

      <div className="grid grid-cols-3 items-end gap-3 sm:gap-6">
        {ORDEN.map((pos, visualIndex) => {
          const alumno = top[pos];
          if (!alumno) return <div key={`vacio-${pos}`} />;
          const rank = pos;
          const coloresMedalla = MEDALLAS[visualIndex];
          const insignias = insigniasDe(alumno);

          return (
            <motion.div
              key={alumno.id}
              whileHover={{ scale: 1.05, y: -12 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="flex cursor-pointer flex-col items-center gap-2"
              onClick={() => setSeleccionado(alumno)}
            >
              <Trophy className="h-10 w-10 drop-shadow-[3px_3px_0_rgba(0,0,0,0.3)]" style={{ fill: coloresMedalla }} aria-hidden="true" />

              {alumno.avatarUrl ? (
                <Avatar nombre={alumno.nombre} avatarUrl={alumno.avatarUrl} size="lg" polaroid />
              ) : (
                <Avatar nombre={alumno.nombre} size="lg" polaroid />
              )}

              <div
                className={`grid ${ALTURAS[visualIndex]} w-full place-items-center rounded-t-lg border-4 border-b-0 border-black ${COLORES[visualIndex]} shadow-[6px_6px_0_0_#000]`}
              >
                <span className="font-display text-4xl text-white drop-shadow-[2px_2px_0_#000]">
                  {rank + 1}
                </span>
              </div>

              <p className="max-w-full truncate text-center text-sm font-black text-black">
                {alumno.nombre}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-0.5 rounded-full border-2 border-black bg-orange-300 px-2 py-0.5 text-xs font-black text-black">
                  <Flame className="h-3 w-3" /> {alumno.rachaActual}
                </span>
                <span className="rounded-full border-2 border-black bg-lime-300 px-2 py-0.5 text-xs font-black text-black">
                  {alumno.semanasPagadas} sem · ${alumno.semanasPagadas * CUOTA_SEMANAL}
                </span>
              </div>

              <Insignias insignias={insignias} />
            </motion.div>
          );
        })}
      </div>

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