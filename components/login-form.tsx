"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, ShieldCheck, UserRound } from "lucide-react";
import { entrar } from "@/app/login/actions";

type Props = {
  from: string;
};

export function FormLogin({ from }: Props) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [pin, setPin] = useState("");
  const [ver, setVer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await entrar(pin);
      if (res.ok) {
        router.replace(from);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form
      onSubmit={enviar}
      className="w-full max-w-sm rotate-[-1deg] rounded-2xl border-4 border-black bg-white p-7 shadow-[10px_10px_0_0_#000]"
    >
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-4 border-black bg-violet-500 shadow-[4px_4px_0_0_#000]">
        <ShieldCheck className="h-8 w-8 text-white" />
      </div>

      <h1 className="font-display mt-4 text-center text-3xl uppercase text-black">Área restringida</h1>
      <p className="mt-1 text-center text-sm font-bold text-black/60">
        Sigue al pie de la letra, tesorero(a).
      </p>

      <label className="mt-6 block">
        <span className="mb-1 flex items-center gap-1 text-xs font-black uppercase text-black/60">
          <UserRound className="h-3.5 w-3.5" /> Nombre (opcional)
        </span>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoComplete="username"
          placeholder="Ej. La tesorera"
          className="w-full rounded-lg border-4 border-black px-3 py-2.5 font-semibold focus:outline-none focus:ring-4 focus:ring-violet-300"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-1 flex items-center gap-1 text-xs font-black uppercase text-black/60">
          <Lock className="h-3.5 w-3.5" /> PIN del tesorero
        </span>
        <div className="relative">
          <input
            type={ver ? "text" : "password"}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="w-full rounded-lg border-4 border-black pr-11 px-3 py-2.5 font-semibold focus:outline-none focus:ring-4 focus:ring-violet-300"
          />
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            aria-label={ver ? "Ocultar PIN" : "Mostrar PIN"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border-2 border-black bg-white p-1.5 shadow-[2px_2px_0_0_#000] transition hover:bg-yellow-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </label>

      {error && (
        <p className="mt-3 rounded-lg border-2 border-black bg-red-400 px-3 py-2 text-center text-sm font-black text-white">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !pin}
        className="mt-6 w-full rounded-full border-4 border-black bg-yellow-400 px-6 py-3 font-display text-xl text-black shadow-[6px_6px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-yellow-300 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {pending ? "Verificando…" : "Entrar"}
      </button>

      <p className="mt-4 text-center text-xs font-bold text-black/40">
        La contraseña es el PIN de <code className="rounded bg-gray-100 px-1">ADMIN_PASSWORD</code>.
      </p>
    </form>
  );
}