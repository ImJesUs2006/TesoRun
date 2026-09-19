import { Dumbbell, Gem, Medal, TriangleAlert, Flame } from "lucide-react";
import type { Insignia } from "@/lib/badges";

const ICONOS = {
  "al-dia": Gem,
  racha: Flame,
  constante: Dumbbell,
  veterano: Medal,
  peligro: TriangleAlert,
} as const;

type Props = {
  insignias: Insignia[];
  max?: number;
};

export function Insignias({ insignias, max = 3 }: Props) {
  const visibles = insignias.slice(0, max);

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {visibles.map((ins) => {
        const Icono = ICONOS[ins.clave];
        return (
          <span
            key={ins.etiqueta}
            title={ins.titulo}
            className="inline-flex items-center gap-1 rounded-full border-2 border-black bg-white px-2 py-0.5 text-xs font-black text-black shadow-[2px_2px_0_0_#000]"
          >
            <Icono className="h-3 w-3" aria-hidden="true" />
            {ins.etiqueta}
          </span>
        );
      })}
    </div>
  );
}