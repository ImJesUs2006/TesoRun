"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, MessageSquare } from "lucide-react";
import { FormComentario } from "@/components/muro/form-comentario";
import { AvisoCensura } from "@/components/muro/censura";
import { ComentarioCard, type ComentarioVista } from "@/components/muro/comentario-card";

type Props = {
  comentarios: ComentarioVista[];
  pagina: number;
  totalPaginas: number;
  deviceActual: string | null;
};

export function MuroComentarios({ comentarios, pagina, totalPaginas, deviceActual }: Props) {
  return (
    <section className="rounded-xl border-4 border-black bg-white p-6 shadow-[10px_10px_0_0_#000]">
      <h2 className="font-display mb-4 flex items-center gap-2 text-3xl uppercase text-black">
        <MessageSquare className="h-7 w-7" /> Muro de comentarios
      </h2>

      <AvisoCensura />
      <FormComentario />

      <ul className="relative mt-6 space-y-3">
        {comentarios.length === 0 && (
          <li className="rounded-lg border-2 border-dashed border-black px-4 py-6 text-center font-bold text-black/50">
            Sin comentarios todavía. Rompe el hielo.
          </li>
        )}

        {comentarios.map((c) => (
          <ComentarioCard key={c.id} comentario={c} deviceActual={deviceActual} />
        ))}
      </ul>

      {totalPaginas > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-4" aria-label="Paginación del muro">
          <Link
            href={pagina > 2 ? `/?page=${pagina - 1}` : "/"}
            prefetch={false}
            aria-disabled={pagina <= 1}
            className={`inline-flex items-center gap-1 rounded-full border-4 border-black bg-white px-4 py-2 text-sm font-black text-black shadow-[4px_4px_0_0_#000] transition hover:bg-yellow-100 active:translate-x-1 active:translate-y-1 active:shadow-none ${
              pagina <= 1 ? "pointer-events-none opacity-35" : ""
            }`}
          >
            <ArrowUp className="h-4 w-4" /> Anterior
          </Link>
          <span className="rounded-full border-2 border-black bg-black px-3 py-1 text-sm font-black text-white">
            Página {pagina} de {totalPaginas}
          </span>
          <Link
            href={`/?page=${pagina + 1}`}
            prefetch={false}
            aria-disabled={pagina >= totalPaginas}
            className={`inline-flex items-center gap-1 rounded-full border-4 border-black bg-white px-4 py-2 text-sm font-black text-black shadow-[4px_4px_0_0_#000] transition hover:bg-yellow-100 active:translate-x-1 active:translate-y-1 active:shadow-none ${
              pagina >= totalPaginas ? "pointer-events-none opacity-35" : ""
            }`}
          >
            Siguiente <ArrowDown className="h-4 w-4" />
          </Link>
        </nav>
      )}
    </section>
  );
}