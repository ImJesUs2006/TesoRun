const ADJETIVOS = [
  "Tacaño",
  "Veloz",
  "Misterioso",
  "Ahorrador",
  "Travieso",
  "Poderoso",
  "Fiestero",
  "Reservado",
  "Curioso",
  "Reina",
  "Astuto",
  "Discreto",
];

const ANIMALES = [
  "Monito",
  "Cerdito",
  "Burrito",
  "Gatito",
  "Osito",
  "Lobito",
  "Pollito",
  "Conejín",
  "Zorrito",
  "Tortuguita",
  "Mapachín",
  "Ranita",
];

/** Apodo anónimo determinista por device: estable dentro de la sesión. */
export function aliasPara(deviceId: string): string {
  let h = 0;
  for (let i = 0; i < deviceId.length; i++) h = (h * 31 + deviceId.charCodeAt(i)) >>> 0;
  const animal = ANIMALES[h % ANIMALES.length];
  const adjetivo = ADJETIVOS[Math.floor(h / ANIMALES.length) % ADJETIVOS.length];
  return `${animal} ${adjetivo}`;
}