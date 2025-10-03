import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { routes } from "./routes";

const roleRedirects: Record<string, string> = {
  ADMIN: "/admin",
  MANAGER: routes.app.dashboardBase,
  USER: routes.app.perfil,
};

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const isAuthPage =
    pathname.startsWith(routes.auth.ingreso) ||
    pathname.startsWith(routes.auth.registro);

  // --- 1. Manejo de usuarios AUTENTICADOS ---
  if (token) {
    if (isAuthPage) {
      const redirectUrl = roleRedirects[token.role as string] || routes.public.home;
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
      const redirectUrl = roleRedirects[token.role as string] || routes.public.home;
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    if (
      pathname.startsWith(routes.app.dashboardBase) &&
      !["ADMIN", "MANAGER"].includes(token.role as string)
    ) {
      return NextResponse.redirect(new URL(routes.app.perfil, req.url));
    }

    return NextResponse.next();
  }

  // --- 2. Manejo de usuarios NO AUTENTICADOS ---
  if (!token && !isAuthPage) {

    const loginUrl = new URL(routes.auth.ingreso, req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};