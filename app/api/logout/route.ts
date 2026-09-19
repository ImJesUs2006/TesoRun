import { NextResponse } from "next/server";
import { COOKIE_SESION } from "@/lib/auth";

export function GET(req: Request) {
  const url = new URL("/login", req.url);
  const resp = NextResponse.redirect(url);
  resp.cookies.delete(COOKIE_SESION);
  return resp;
}