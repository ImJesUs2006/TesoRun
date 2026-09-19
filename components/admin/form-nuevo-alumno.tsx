"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { crearAlumno } from "@/app/admin-teso/actions";
import { reproducirCampanita, reproducirError } from "@/lib/sound";
import { useToast } from "./toast-provider";

export function FormNuevoAlumno() {
  const { notificar } = useToast();
  const [nombre, setNombre] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [pending, startTransition] = useTransition();

  function registrar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      reproducirError();
      notificar("Falta el nombre", "error", "Escribe el nombre del compañero.");
      return;
    }
    startTransition(async () => {
      const res = await crearAlumno({ nombre, avatarUrl });
      if (res.ok) {
        reproducirCampanita();
        notificar("Compañero agregado", "ok", nombre.trim());
        setNombre("");
        setAvatarUrl("");
        setAbierto(false);
      } else {
        reproducirError();
        notificar("No se pudo agregar", "error", res.error);
      }
    });
  }

  return (
    <section className="rounded-xl border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
      {abierto ? (
        <form onSubmit={registrar} className="flex flex-wrap items-end gap-3">
          <label className="min-w-40 flex-1">
            <span className="mb-1 block text-xs font-black uppercase text-black/60">Nombre *</span>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoFocus
              placeholder="Ej. Pamela"
              className="w-full rounded-lg border-4 border-black px-3 py-2 font-semibold focus:outline-none focus:ring-4 focus:ring-lime-300"
            />
          </label>
          <label className="min-w-52 flex-1">
            <span className="mb-1 block text-xs font-black uppercase text-black/60">
              Foto (opcional)
            </span>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https:// …"
              className="w-full rounded-lg border-4 border-black px-3 py-2 font-semibold focus:outline-none focus:ring-4 focus:ring-lime-300"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full border-4 border-black bg-lime-400 px-6 py-2.5 font-display text-lg text-black shadow-[5px_5px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-lime-300 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
          >
            {pending ? "…" : "Agregar"}
          </button>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="rounded-full border-4 border-black bg-white px-5 py-2.5 font-bold text-black shadow-[5px_5px_0_0_#000] transition hover:bg-gray-100"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-4 border-dashed border-black bg-lime-100 px-4 py-3 font-display text-lg text-black transition hover:-translate-y-0.5 hover:bg-lime-200"
        >
          <UserPlus className="h-5 w-5" /> Agregar compañero
        </button>
      )}
    </section>
  );
}