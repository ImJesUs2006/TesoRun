"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Megaphone, Search } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Insignias } from "@/components/insignias";
import { ModalAlumno } from "@/components/modal-alumno";
import { CUOTA_SEMANAL } from "@/lib/config";
import { insigniasDe } from "@/lib/badges";
import type { AlumnoPublico, NotaTransaccion } from "@/lib/tipos";

type Props = {
  buscados: AlumnoPublico[];
  pagos: Record<string, Date[]>;
  notas: Record<string, NotaTransaccion[]>;
  fechaInicio?: Date | null;
};

type EstadoArrastre = {
  activo: boolean;
  x0: number;
  scroll0: number;
  movio: boolean;
};

export function CarruselSeBusca({ buscados, pagos, notas, fechaInicio }: Props) {
  const [seleccionado, setSeleccionado] = useState<AlumnoPublico | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const arrastre = useRef<EstadoArrastre>({ activo: false, x0: 0, scroll0: 0, movio: false });
  const [puedeIzq, setPuedeIzq] = useState(false);
  const [puedeDer, setPuedeDer] = useState(true);

  function alDesplazar() {
    const el = trackRef.current;
    if (!el) return;
    setPuedeIzq(el.scrollLeft > 4);
    setPuedeDer(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  useEffect(() => {
    alDesplazar();
  }, [buscados.length]);

  function mover(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const paso = Math.max(el.clientWidth * 0.85, 240);
    el.scrollBy({ left: dir * paso, behavior: "auto" });
  }

  function abrir(alumno: AlumnoPublico) {
    if (!arrastre.current.movio) setSeleccionado(alumno);
    arrastre.current.movio = false;
  }

  function iniciarArrastre(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return; // touch usa el gesto nativo
    if (!trackRef.current) return;
    const cont: HTMLDivElement = trackRef.current;

    const estado: EstadoArrastre = { activo: true, x0: e.clientX, scroll0: cont.scrollLeft, movio: false };
    arrastre.current = estado;
    cont.classList.add("cursor-grabbing");

    function onMove(ev: PointerEvent) {
      if (!estado.activo) return;
      const dx = ev.clientX - estado.x0;
      if (Math.abs(dx) > 5) {
        estado.movio = true;
        cont.classList.add("select-none");
      }
      cont.scrollLeft = estado.scroll0 - dx;
    }

    function onEnd() {
      estado.activo = false;
      cont.classList.remove("cursor-grabbing", "select-none");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      alDesplazar();
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  }

  if (buscados.length === 0) return null;

  return (
    <section>
      <h2 className="font-display mb-6 flex items-center justify-center gap-2 text-3xl uppercase text-black">
        <Megaphone className="h-7 w-7" /> Carrusel se busca
      </h2>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => mover(-1)}
          disabled={!puedeIzq}
          aria-label="Anterior"
          className="hidden h-12 w-12 shrink-0 place-items-center rounded-full border-4 border-black bg-white shadow-[5px_5px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-yellow-200 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 sm:grid"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div
          ref={trackRef}
          onPointerDown={iniciarArrastre}
          onScroll={alDesplazar}
          className="scroll-sin-barra -mx-1 cursor-grab touch-pan-x overflow-x-auto px-1 pb-4"
        >
          <div className="flex w-max snap-x snap-proximity gap-5">
            {buscados.map((alumno, i) => (
              <div
                key={alumno.id}
                role="button"
                tabIndex={0}
                onClick={() => abrir(alumno)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    abrir(alumno);
                  }
                }}
                aria-label={`Ver detalle de ${alumno.nombre}`}
                className={`w-44 shrink-0 cursor-pointer snap-start rounded-lg border-4 border-black bg-yellow-100 p-3 pb-4 shadow-[7px_7px_0_0_#000] transition-transform duration-200 hover:-translate-y-2 hover:scale-[1.04] will-change-transform ${
                  i % 2 === 0 ? "-rotate-[1.5deg]" : "rotate-[1.5deg]"
                }`}
              >
                <span className="w-full -rotate-1 rounded border-2 border-black bg-black px-1 py-1 text-center font-black uppercase tracking-widest text-yellow-300">
                  Se busca
                </span>

                <Avatar nombre={alumno.nombre} avatarUrl={alumno.avatarUrl} size="lg" />

                <p className="mt-2 text-center text-sm font-black text-black">{alumno.nombre}</p>
                <p className="mt-1 rounded-md border-2 border-black bg-red-500 px-2 py-0.5 text-center text-sm font-black text-white">
                  Deuda: ${alumno.deuda * CUOTA_SEMANAL}
                </p>

                <div className="mt-2">
                  <Insignias insignias={insigniasDe(alumno)} max={2} />
                </div>

                <span className="mt-2 block text-center text-sm font-black text-black/50">
                  Ver detalle
                </span>
                <Search className="mx-auto h-4 w-4 text-black/50" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => mover(1)}
          disabled={!puedeDer}
          aria-label="Siguiente"
          className="hidden h-12 w-12 shrink-0 place-items-center rounded-full border-4 border-black bg-white shadow-[5px_5px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-yellow-200 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 sm:grid"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <p className="mt-2 text-center text-xs font-bold text-black/50 sm:hidden">
        Desliza para ver a los morosos.
      </p>

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