import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ArrowLeft, Megaphone } from "lucide-react";
import { validarSesion, COOKIE_SESION } from "@/lib/auth";
import { FormLogin } from "@/components/login-form";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ from?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { from } = await searchParams;
  const destino = from && from.startsWith("/admin-teso") ? from : "/admin-teso";

  const tienda = await cookies();
  const yaEntro = await validarSesion(tienda.get(COOKIE_SESION)?.value);
  if (yaEntro) redirect(destino);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <a
        href="/"
        className="inline-flex items-center gap-1.5 self-start rounded-full border-4 border-black bg-white px-4 py-2 text-sm font-black text-black shadow-[4px_4px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-yellow-100 active:translate-x-1 active:translate-y-1 active:shadow-none"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a la cancha
      </a>

      <div className="rotate-[-2deg] rounded-full border-4 border-black bg-orange-400 px-8 py-3 shadow-[8px_8px_0_0_#000]">
        <h1 className="font-display flex items-center gap-3 text-6xl tracking-tight text-black sm:text-7xl">
          TESORUN <Megaphone className="hidden h-10 w-10 sm:block" />
        </h1>
      </div>

      <p className="max-w-md text-center text-lg font-bold text-black/70">
        El código del tesorero. Solo tú y tu PIN pueden abrir la caja registradora.
      </p>

      <FormLogin from={destino} />
    </main>
  );
}