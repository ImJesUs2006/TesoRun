type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = {
  nombre: string;
  avatarUrl?: string | null;
  size?: AvatarSize;
  polaroid?: boolean;
  className?: string;
};

const SIZES: Record<AvatarSize, string> = {
  sm: "h-9 w-9",
  md: "h-14 w-14",
  lg: "h-20 w-20",
};

function diceBearUrl(nombre: string): string {
  return `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(nombre)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export function Avatar({ nombre, avatarUrl, size = "md", polaroid = false, className = "" }: AvatarProps) {
  const src =
    avatarUrl?.trim() ? avatarUrl.trim() : diceBearUrl(nombre);

  const frame = (
    <div
      className={`overflow-hidden border-4 border-black ${SIZES[size]} ${polaroid ? "" : "shadow-[4px_4px_0_0_#000]"} rounded-md bg-white`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`Foto de ${nombre}`} className="h-full w-full object-cover" />
    </div>
  );

  if (!polaroid) return <div className={className}>{frame}</div>;

  return (
    <figure className={`rotate-[-3deg] rounded-lg border-4 border-black bg-white p-1 pb-2 shadow-[6px_6px_0_0_#000] ${className}`}>
      {frame}
      <figcaption className="mt-1 text-center text-sm font-black text-black">{nombre}</figcaption>
    </figure>
  );
}