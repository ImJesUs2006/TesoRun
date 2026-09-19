// Autenticación del panel de tesorería.
// Compatible con el runtime Edge del middleware y con los route handlers (Web Crypto).

export const COOKIE_SESION = "tesorun_sesion";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function claveSecreta(secreto: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Token firmado: HMAC-SHA256 del PIN. Al cambiar ADMIN_PASSWORD, los tokens antiguos quedan inválidos. */
export async function firmarSesion(): Promise<string> {
  const secreto = process.env.ADMIN_PASSWORD ?? "";
  const key = await claveSecreta(secreto);
  const firma = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(secreto));
  return Buffer.from(firma).toString("base64url");
}

export async function validarSesion(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const secreto = process.env.ADMIN_PASSWORD ?? "";
  if (!secreto) return false;
  const esperado = await firmarSesion();
  return safeEqual(token, esperado);
}