export type SegmentoTexto =
  | { tipo: "texto"; texto: string }
  | { tipo: "link"; url: string };

const RE_LINK = /https?:\/\/[^\s<>"'()]+/g;

/** Divide el texto en segmentos planos y enlaces. Nunca se renderiza como HTML. */
export function dividirTexto(texto: string): SegmentoTexto[] {
  const segmentos: SegmentoTexto[] = [];
  let idx = 0;
  for (const m of texto.matchAll(RE_LINK)) {
    if ((m.index ?? 0) > idx) segmentos.push({ tipo: "texto", texto: texto.slice(idx, m.index) });
    segmentos.push({ tipo: "link", url: m[0] });
    idx = (m.index ?? 0) + m[0].length;
  }
  if (idx < texto.length) segmentos.push({ tipo: "texto", texto: texto.slice(idx) });
  return segmentos;
}