import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { routes } from "./routes";

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    console.log("Middleware ejecutado para:", pathname, "con rol:", token?.role);

    // --- Regla 0: Redirección si ya está logueado ---
    if (token) {
      if (
        pathname.startsWith(routes.auth.ingreso) ||
        pathname.startsWith(routes.auth.registro)
      ) {
        let redirectUrl = routes.public.home;
        if (token.role === "ADMIN") redirectUrl = "/admin";
        if (token.role === "MANAGER") redirectUrl = routes.app.dashboardBase;
        if (token.role === "USER") redirectUrl = routes.app.perfil;
        
        return NextResponse.redirect(new URL(redirectUrl, req.url));
      }
    }

    // --- Regla 1: Proteger Rutas de Admin ---
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL(routes.public.home, req.url));
    }

    // --- Regla 3: Proteger el Dashboard (solo para Managers y Admins) ---
    if (pathname.startsWith(routes.app.dashboardBase)) {
        if (token?.role === "USER") {
            return NextResponse.redirect(new URL(routes.app.perfil, req.url));
        }
    }

    // --- Regla 4: Proteger el Perfil (solo para Users) ---
if (pathname.startsWith(routes.app.perfil) && !token) {
    return NextResponse.redirect(new URL(routes.auth.ingreso, req.url));
}

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: routes.auth.ingreso,
      error: routes.auth.ingreso,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard", 
    "/profile/:path*",
    "/login",
    "/register",
  ],
};

