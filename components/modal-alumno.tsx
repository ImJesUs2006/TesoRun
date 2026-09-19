"use client";

import { motion } from "framer-motion";
import { CalendarDays, FileText, X, Flame } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { CalendarioPagos } from "@/components/calendario-pagos";
import { CUOTA_SEMANAL } from "@/lib/config";
import type { AlumnoPublico, NotaTransaccion } from "@/lib/tipos";

const formatoFecha = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type Props = {
  alumno: AlumnoPublico;
  pagos: Date[];
  notas: NotaTransaccion[];
  onClose: () => void;
};

export function ModalAlumno({ alumno, pagos, notas, onClose }: Props) {
  const montoDeuda = alumno.deuda * CUOTA_SEMANAL;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
    >
      <motion.div
        initial={{ scale: 0.82, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.82, opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="relative z-[60] max-h-[85vh] w-11/12 max-w-md overflow-y-auto rounded-2xl border-4 border-black bg-white p-6 opacity-100 shadow-[10px_10px_0_0_#000]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="sticky right-0 mb-2 ml-auto block rounded-full border-2 border-black bg-white p-2 shadow-[3px_3px_0_0_#000] transition hover:bg-gray-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex flex-col items-center">
          <Avatar nombre={alumno.nombre} avatarUrl={alumno.avatarUrl} size="lg" polaroid />

          <h3 className="font-display mt-4 text-3xl text-black">{alumno.nombre}</h3>

          <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs font-black">
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-black bg-orange-300 px-2 py-0.5 text-black">
              <Flame className="h-3.5 w-3.5" /> {alumno.rachaActual} en racha
            </span>
            <span className="rounded-full border-2 border-black bg-lime-300 px-2 py-0.5 text-black">
              {alumno.semanasPagadas} semanas pagadas
            </span>
            <span
              className={`rounded-full border-2 border-black px-2 py-0.5 ${
                alumno.deuda > 0 ? "bg-red-400 text-white" : "bg-white text-black"
              }`}
            >
              Deuda: ${montoDeuda}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-display mb-3 flex items-center gap-2 text-lg uppercase text-black">
            <CalendarDays className="h-5 w-5" /> Calendario de pagos
          </h4>
          <CalendarioPagos pagos={pagos} />
        </div>

        <div className="mt-6">
          <h4 className="font-display mb-3 flex items-center gap-2 text-lg uppercase text-black">
            <FileText className="h-5 w-5" /> Notas del tesorero
          </h4>

          <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {notas.length === 0 && (
              <li className="rounded-lg border-2 border-dashed border-black px-3 py-3 text-center text-sm font-bold text-black/50">
                No hay notas registradas todavía.
              </li>
            )}
            {notas.map((n) => (
              <li
                key={n.id}
                className="rounded-lg border-2 border-black bg-lime-50 px-3 py-2 shadow-[3px_3px_0_0_#000]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase text-black/50">
                    {formatoFecha.format(new Date(n.fecha))}
                  </span>
                  <span className="rounded-full border-2 border-black bg-white px-2 py-0.5 text-xs font-black text-black">
                    +${n.monto}
                  </span>
                </div>
                <p className="mt-1 text-sm font-bold text-black">{n.notaAdmin}</p>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}