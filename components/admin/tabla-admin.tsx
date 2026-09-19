"use client";

import { useState, useTransition } from "react";
import { Search, Trash2, Upload } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { CUOTA_SEMANAL } from "@/lib/config";
import { actualizarAlumno, eliminarAlumno } from "@/app/admin-teso/actions";
import { reproducirError } from "@/lib/sound";
import { BotonDeshacer, BotonPago } from "./boton-pago";
import { useToast } from "./toast-provider";

export type AlumnoAdmin = {
  id: string;
  nombre: string;
  avatarUrl: string | null;
  semanasPagadas: number;
  deuda: number;
  rachaActual: number;
  mejorRacha: number;
};

type Props = {
  alumnos: AlumnoAdmin[];
};

type Filtro = "todos" | "al-dia" | "morosos";

export function TablaAdmin({ alumnos }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const visibles = alumnos.filter((a) => {
    const coincideNombre = a.nombre.toLowerCase().includes(busqueda.toLowerCase().trim());
    if (!coincideNombre) return false;
    if (filtro === "al-dia") return a.deuda === 0;
    if (filtro === "morosos") return a.deuda > 0;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" aria-hidden="true" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre…"
          className="w-full rounded-lg border-4 border-black bg-white py-2 pl-10 pr-3 font-semibold text-black shadow-[5px_5px_0_0_#000] focus:outline-none focus:ring-4 focus:ring-violet-300"
        />
      </div>

      <div className="flex gap-2">
        {(
          [
            ["todos", "TODOS"],
            ["al-dia", "AL DÍA"],
            ["morosos", "MOROSOS"],
          ] as const
        ).map(([valor, etiqueta]) => (
          <button
            key={valor}
            type="button"
            onClick={() => setFiltro(valor)}
            className={`rounded-full border-4 border-black px-4 py-1.5 font-display text-sm shadow-[4px_4px_0_0_#000] transition active:translate-x-1 active:translate-y-1 active:shadow-none ${
              filtro === valor ? "bg-violet-500 text-white" : "bg-white text-black hover:bg-yellow-100"
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      <div className="overflow-hidden overflow-x-auto rounded-xl border-4 border-black bg-white shadow-[10px_10px_0_0_#000]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-violet-500 font-display text-sm uppercase text-white sm:text-base">
              <th className="border-b-4 border-black px-4 py-3 text-left">Alumno</th>
              <th className="border-b-4 border-black px-4 py-3 text-center">Racha</th>
              <th className="border-b-4 border-black px-4 py-3 text-center">Semanas</th>
              <th className="border-b-4 border-black px-4 py-3 text-center">Deuda</th>
              <th className="border-b-4 border-black px-4 py-3 text-left">Foto</th>
              <th className="border-b-4 border-black px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((alumno) => (
              <AlumnoFila key={alumno.id} alumno={alumno} />
            ))}
          </tbody>
        </table>
        {visibles.length === 0 && (
          <p className="border-t-2 border-black p-6 text-center font-bold text-black/60">
            No hay alumnos con esos filtros.
          </p>
        )}
      </div>
    </div>
  );
}

function AlumnoFila({ alumno }: { alumno: AlumnoAdmin }) {
  const { notificar } = useToast();
  const [nombre, setNombre] = useState(alumno.nombre);
  const [pending, startTransition] = useTransition();

  const montoDeuda = alumno.deuda * CUOTA_SEMANAL;

  function guardarNombre() {
    if (nombre.trim() === alumno.nombre) return;
    startTransition(async () => {
      const res = await actualizarAlumno(alumno.id, { nombre });
      if (!res.ok) {
        reproducirError();
        notificar("Nombre no guardado", "error", res.error);
        setNombre(alumno.nombre);
      }
    });
  }

  function cambiarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      reproducirError();
      notificar("Foto no válida", "error", "Elige un archivo de imagen.");
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      const base64 = String(lector.result ?? "");
      if (!base64.startsWith("data:image/")) {
        notificar("Foto no válida", "error", "No se pudo leer la imagen.");
        return;
      }
      startTransition(async () => {
        const res = await actualizarAlumno(alumno.id, { avatarUrl: base64 });
        if (res.ok) {
          notificar("Foto actualizada", "ok", alumno.nombre);
        } else {
          reproducirError();
          notificar("Foto no guardada", "error", res.error);
        }
      });
    };
    lector.readAsDataURL(archivo);
    e.target.value = "";
  }

  function borrar() {
    const confirma = window.confirm(`¿Dar de baja a ${alumno.nombre}?`);
    if (!confirma) return;
    startTransition(async () => {
      const res = await eliminarAlumno(alumno.id);
      if (res.ok) notificar("Alumno dado de baja", "info", alumno.nombre);
      else notificar("No se pudo eliminar", "error", res.error);
    });
  }

  return (
    <tr className="border-t-2 border-black transition-colors hover:bg-yellow-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar nombre={alumno.nombre} avatarUrl={alumno.avatarUrl} size="sm" />
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onBlur={guardarNombre}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            disabled={pending}
            className="min-w-24 rounded border-2 border-transparent px-1.5 py-0.5 text-base font-black text-black hover:border-black focus:border-violet-500 focus:outline-none"
          />
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span
          title={`Mejor racha: ${alumno.mejorRacha} semanas`}
          className="rounded-full border-2 border-black bg-orange-300 px-2 py-0.5 text-sm font-black text-black"
        >
          🔥 {alumno.rachaActual}
        </span>
      </td>
      <td className="px-4 py-3 text-center font-bold text-black">{alumno.semanasPagadas}</td>
      <td className="px-4 py-3 text-center">
        <span
          className={
            alumno.deuda > 0
              ? "rounded-full border-2 border-black bg-red-500 px-2 py-0.5 font-black text-white"
              : "rounded-full border-2 border-black bg-lime-300 px-2 py-0.5 font-black text-black"
          }
        >
          {alumno.deuda > 0 ? `${alumno.deuda} sem · $${montoDeuda}` : "$0"}
        </span>
      </td>
      <td className="px-4 py-3">
        <label
          title="Subir foto (se convierte a Base64)"
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-4 border-black bg-white px-3 py-1.5 text-sm font-semibold text-black shadow-[3px_3px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-violet-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <Upload className="h-4 w-4" /> {alumno.avatarUrl ? "Cambiar foto" : "Subir foto"}
          <input
            type="file"
            accept="image/*"
            onChange={cambiarFoto}
            disabled={pending}
            className="hidden"
          />
        </label>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <BotonPago alumnoId={alumno.id} nombre={alumno.nombre} bloqueado={alumno.deuda === 0} />
          <BotonDeshacer alumnoId={alumno.id} />
          <button
            type="button"
            onClick={borrar}
            disabled={pending}
            title={`Eliminar a ${alumno.nombre}`}
            className="rounded-full border-4 border-black bg-white p-2.5 shadow-[4px_4px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-red-100 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}