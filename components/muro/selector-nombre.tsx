"use client";

import { MAX_NOMBRE } from "@/lib/limites";

export const CLAVE_NOMBRE_GUARDADO = "tesorun_nombre_elegido";

export function leerNombreGuardado(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(CLAVE_NOMBRE_GUARDADO) ?? "";
  } catch {
    return "";
  }
}

export function guardarNombre(nombre: string) {
  try {
    localStorage.setItem(CLAVE_NOMBRE_GUARDADO, nombre);
  } catch {
    // sin almacenamiento: no pasa nada
  }
}

export function SelectorNombre({
  modo,
  nombre,
  onChangeModo,
  onChangeNombre,
}: {
  modo: boolean;
  nombre: string;
  onChangeModo: (modo: boolean) => void;
  onChangeNombre: (nombre: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex overflow-hidden rounded-full border-2 border-black bg-white">
        <button
          type="button"
          onClick={() => onChangeModo(false)}
          className={`px-3 py-1 text-xs font-black transition ${
            !modo ? "bg-black text-white" : "text-black/60 hover:bg-yellow-100"
          }`}
        >
           Anónimo
        </button>
        <button
          type="button"
          onClick={() => onChangeModo(true)}
          className={`px-3 py-1 text-xs font-black transition ${
            modo ? "bg-black text-white" : "text-black/60 hover:bg-yellow-100"
          }`}
        >
          Nombre
        </button>
      </div>
      {modo && (
        <input
          value={nombre}
          onChange={(e) => onChangeNombre(e.target.value)}
          maxLength={MAX_NOMBRE}
          autoComplete="nickname"
          placeholder="Tu nombre o apodo"
          aria-label="Nombre o apodo"
          className="w-full max-w-[200px] rounded-lg border-4 border-black bg-white px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-yellow-200"
        />
      )}
    </div>
  );
}