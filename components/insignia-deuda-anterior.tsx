export function InsigniaDeudaAnterior({ monto }: { monto: number }) {
  return (
    <span className="inline-block rounded-lg border-4 border-black bg-red-500 px-2 py-0.5 text-center text-xs font-black uppercase tracking-wide text-white shadow-[3px_3px_0_0_#000]">
      ⚠️ Deuda anterior: ${monto}
    </span>
  );
}