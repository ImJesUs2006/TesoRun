const MUTE_KEY = "tesorun-sonido-off";

export function sonidoMuteado(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function cambiarSonido(): boolean {
  const siguiente = !sonidoMuteado();
  window.localStorage.setItem(MUTE_KEY, siguiente ? "1" : "0");
  return siguiente;
}

function tono(frecuencias: number[], duracion: number) {
  if (sonidoMuteado()) return;
  try {
    const ctx = new AudioContext();
    frecuencias.forEach((frecuencia, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + i * duracion;
      osc.type = "square";
      osc.frequency.value = frecuencia;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duracion - 0.02);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duracion);
    });
    setTimeout(() => ctx.close(), frecuencias.length * duracion + 200);
  } catch {
    // audio bloqueado por el navegador: silencio total
  }
}

export function reproducirCampanita() {
  tono([880, 1174.66, 1567.98], 0.11);
}

export function reproducirMoneda() {
  tono([1318.51, 1975.53], 0.09);
}

export function reproducirError() {
  tono([196, 147], 0.18);
}

export function reproducirNuevaSemana() {
  tono([523.25, 659.25, 783.99, 1046.5], 0.12);
}