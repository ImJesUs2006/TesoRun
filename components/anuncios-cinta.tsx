import { Megaphone } from "lucide-react";

type Props = {
  anuncios: Array<{ id: string; mensaje: string }>;
};

export function AnunciosCinta({ anuncios }: Props) {
  if (anuncios.length === 0) return null;

  return (
    <div className="-rotate-1 border-y-4 border-black bg-[repeating-linear-gradient(45deg,#fde047_0px,#fde047_12px,#111_12px,#111_16px)] py-2.5">
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 text-center font-display text-sm uppercase tracking-wide text-yellow-300 drop-shadow-[2px_2px_0_#000] sm:text-base">
        <Megaphone className="hidden h-5 w-5 shrink-0 sm:block" aria-hidden="true" />
        <span className="bg-black px-2 py-0.5">Aviso oficial:</span>
        <span className="font-bold text-white">
          {anuncios.map((a) => a.mensaje).join(" · ")}
        </span>
      </p>
    </div>
  );
}