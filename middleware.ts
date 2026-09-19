import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { safeEqual, validarSesion, firmarSesion, COOKIE_SESION } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const pin = process.env.ADMIN_PASSWORD ?? "";

  // Fail-closed: sin PIN configurado nadie entra.
  if (pin.length === 0) {
    return new NextResponse("ADMIN_PASSWORD no esta configurado.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // 1) Sesión por cookie firmada (página de login estilizada).
  if (await validarSesion(req.cookies.get(COOKIE_SESION)?.value)) {
    return NextResponse.next();
  }

  // 2) Compatibilidad con Basic Auth (curl, scripts, tokens previos).
  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = Buffer.from(header.slice(6), "base64").toString("utf-8");
      const [, password] = decoded.split(":");
      if (password && safeEqual(password, pin)) {
        const resp = NextResponse.next();
        resp.cookies.set(COOKIE_SESION, await firmarSesion(), {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
        return resp;
      }
    } catch {
      // decodigo corrupto -> se trata como no autenticado
    }
  }

  // 3) Redirige a la página de login estilizada.
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", req.nextUrl.pathname);
  const resp = NextResponse.redirect(url);
  resp.cookies.delete(COOKIE_SESION);
  return resp;
}

export const config = {
  matcher: ["/admin-teso/:path*"],
};