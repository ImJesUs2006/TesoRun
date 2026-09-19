"use client";

import { useState, useTransition } from "react";
import { Check, Eye, EyeOff, Megaphone, Pencil, Trash2, X } from "lucide-react";
import { actualizarAnuncio, alternarAnuncio, crearAnuncio, eliminarAnuncio } from "@/app/admin-teso/actions";
import { reproducirCampanita, reproducirError } from "@/lib/sound";
import { useToast } from "./toast-provider";

type AnuncioAdmin = {
  id: string;
  mensaje: string;
  activo: boolean;
  fecha: Date;
};

const formatoFecha = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" });

type Props = {
  anuncios: AnuncioAdmin[];
};

export function GestionAnuncios({ anuncios }: Props) {
  const { notificar } = useToast();
  const [mensaje, setMensaje] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [borrador, setBorrador] = useState("");
  const [pending, startTransition] = useTransition();

  function publicar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await crearAnuncio(mensaje);
      if (res.ok) {
        reproducirCampanita();
        notificar("Aviso publicado", "ok", "Ya aparece en la cinta pública.");
        setMensaje("");
      } else {
        reproducirError();
        notificar("Aviso no publicado", "error", res.error);
      }
    });
  }

  function alternar(anuncio: AnuncioAdmin) {
    startTransition(async () => {
      const res = await alternarAnuncio(anuncio.id);
      if (res.ok) {
        notificar(anuncio.activo ? "Aviso oculto" : "Aviso visible", "info", anuncio.mensaje);
      } else {
        reproducirError();
        notificar("No se pudo actualizar", "error", res.error);
      }
    });
  }

  function empezarEdicion(a: AnuncioAdmin) {
    setEditandoId(a.id);
    setBorrador(a.mensaje);
  }

  function guardarEdicion(id: string) {
    startTransition(async () => {
      const res = await actualizarAnuncio(id, borrador);
      if (res.ok) {
        reproducirCampanita();
        notificar("Aviso editado", "ok");
        setEditandoId(null);
      } else {
        reproducirError();
        notificar("No se pudo editar", "error", res.error);
      }
    });
  }

  function borrar(a: AnuncioAdmin) {
    if (!window.confirm(`¿Eliminar el aviso "${a.mensaje}"?`)) return;
    startTransition(async () => {
      const res = await eliminarAnuncio(a.id);
      if (res.ok) notificar("Aviso eliminado", "info", a.mensaje);
      else {
        reproducirError();
        notificar("No se pudo eliminar", "error", res.error);
      }
    });
  }

  return (
    <section className="rounded-xl border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
      <h2 className="font-display mb-3 flex items-center gap-2 text-xl uppercase text-black">
        <Megaphone className="h-5 w-5" /> Gestión de avisos
      </h2>

      <form onSubmit={publicar} className="flex flex-wrap gap-3">
        <input
          type="text"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          maxLength={160}
          placeholder="Ej. Mañana hay clase normal."
          className="min-w-52 flex-1 rounded-lg border-4 border-black px-3 py-2 font-semibold focus:outline-none focus:ring-4 focus:ring-yellow-200"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border-4 border-black bg-yellow-400 px-5 py-2 font-display text-sm text-black shadow-[4px_4px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-yellow-300 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
        >
          Publicar aviso
        </button>
      </form>

      <ul className="mt-4 space-y-2">
        {anuncios.length === 0 && (
          <li className="rounded-lg border-2 border-dashed border-black px-3 py-3 text-center text-sm font-bold text-black/50">
            Sin avisos todavía.
          </li>
        )}
        {anuncios.map((a) => (
          <li
            key={a.id}
            className={`rounded-lg border-2 border-black px-3 py-2 ${
              a.activo ? "bg-yellow-50" : "bg-gray-100 opacity-60"
            }`}
          >
            {editandoId === a.id ? (
              <div className="flex items-start gap-2">
                <input
                  type="text"
                  value={borrador}
                  onChange={(e) => setBorrador(e.target.value)}
                  maxLength={160}
                  className="flex-1 rounded-lg border-4 border-black px-3 py-1.5 font-semibold focus:outline-none focus:ring-4 focus:ring-yellow-200"
                />
                <button
                  type="button"
                  onClick={() => guardarEdicion(a.id)}
                  disabled={pending}
                  title="Guardar"
                  className="rounded-full border-2 border-black bg-lime-300 p-2 shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditandoId(null)}
                  title="Cancelar"
                  className="rounded-full border-2 border-black bg-white p-2 shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-black">{a.mensaje}</p>
                  <p className="text-xs font-bold text-black/50">
                    {formatoFecha.format(new Date(a.fecha))} · {a.activo ? "Visible" : "Oculto"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => empezarEdicion(a)}
                    disabled={pending}
                    title="Editar"
                    className="rounded-full border-2 border-black bg-white p-2 shadow-[3px_3px_0_0_#000] transition hover:bg-yellow-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => alternar(a)}
                    disabled={pending}
                    title={a.activo ? "Ocultar" : "Mostrar"}
                    className="rounded-full border-2 border-black bg-white p-2 shadow-[3px_3px_0_0_#000] transition hover:bg-yellow-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    {a.activo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => borrar(a)}
                    disabled={pending}
                    title="Eliminar"
                    className="rounded-full border-2 border-black bg-white p-2 shadow-[3px_3px_0_0_#000] transition hover:bg-red-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}