"use client";

import { motion } from "framer-motion";
import { ArrowDownToLine, Banknote, Scale, Skull } from "lucide-react";

type Props = {
  recaudado: number;
  gastos: number;
  morosos: number;
  alumnos: number;
};

export function Resumen({ recaudado, gastos, morosos, alumnos }: Props) {
  const saldo = recaudado - gastos;

  const tarjetas = [
    {
      etiqueta: "Recaudado",
      valor: `$${recaudado}`,
      color: "bg-lime-300",
      Icono: Banknote,
    },
    { etiqueta: "Gastos", valor: `$${gastos}`, color: "bg-red-300", Icono: ArrowDownToLine },
    {
      etiqueta: "Saldo neto",
      valor: `${saldo >= 0 ? "+" : ""}$${saldo}`,
      color: saldo >= 0 ? "bg-sky-300" : "bg-red-400",
      Icono: Scale,
    },
    { etiqueta: "Morosos", valor: `${morosos}/${alumnos}`, color: "bg-orange-300", Icono: Skull },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tarjetas.map((t, i) => (
        <motion.div
          key={t.etiqueta}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 24, delay: i * 0.06 }}
          className={`rounded-2xl border-4 border-black p-4 shadow-[7px_7px_0_0_#000] ${t.color}`}
        >
          <t.Icono className="h-7 w-7" aria-hidden="true" />
          <p className="font-display mt-1 text-2xl leading-none text-black">{t.valor}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wide text-black/60">{t.etiqueta}</p>
        </motion.div>
      ))}
    </div>
  );
}