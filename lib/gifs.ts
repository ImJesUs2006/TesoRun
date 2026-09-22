export type GifSticker = {
  id: string;
  etiquetas: string[];
  url: string;
  alt: string;
};

/**
 * "API externa" simulada de GIFs. El muro busca y adjunta estos stickers
 * locales (SVG) cuando no hay NEXT_PUBLIC_GIPHY_API_KEY o si Giphy falla.
 * La búsqueda real va directo a la API pública de Giphy desde el navegador.
 */
export const CATALOGO_GIFS: GifSticker[] = [
  { id: "fiesta", etiquetas: ["fiesta", "celebra", "party", "baile"], url: "/gifs/fiesta.svg", alt: "Fiesta" },
  { id: "fuego", etiquetas: ["fuego", "fire", "genial", "increible"], url: "/gifs/fuego.svg", alt: "Fuego" },
  { id: "llanto", etiquetas: ["llanto", "llorando", "triste", "crying"], url: "/gifs/llanto.svg", alt: "Llorando" },
  { id: "craneo", etiquetas: ["craneo", "skull", "muerte", "terminado"], url: "/gifs/craneo.svg", alt: "Calavera" },
  { id: "ojos", etiquetas: ["ojos", "mirando", "observando", "ojo"], url: "/gifs/ojos.svg", alt: "Ojos mirando" },
  { id: "pulgar", etiquetas: ["pulgar", "like", "me gusta", "aprobado"], url: "/gifs/pulgar.svg", alt: "Pulgar arriba" },
  { id: "aplauso", etiquetas: ["aplauso", "aplausos", "bravo", "clap"], url: "/gifs/aplauso.svg", alt: "Aplausos" },
  { id: "sorprendido", etiquetas: ["sorprendido", "shock", "que", "fuerte"], url: "/gifs/sorprendido.svg", alt: "Sorprendido" },
];

export function buscarGifs(termino: string): GifSticker[] {
  const q = termino.trim().toLowerCase();
  if (!q) return CATALOGO_GIFS;
  return CATALOGO_GIFS.filter(
    (g) => g.etiquetas.some((t) => t.includes(q)) || g.alt.toLowerCase().includes(q),
  );
}