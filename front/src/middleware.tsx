
import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { routes } from "./routes";
import { db } from "./lib/db";

export default withAuth(
  async function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    console.log("Middleware ejecutado para:", pathname, "con rol:", token?.role);

    // --- Regla 0: Proteger Rutas de Autenticación ---
    if (token) {
      if (
        pathname.startsWith(routes.auth.ingreso) ||
        pathname.startsWith(routes.auth.registro)
      ) {
        let redirectUrl = routes.public.home;
        if (token.role === "ADMIN") redirectUrl = "/admin"; // Nueva ruta para Admin
        if (token.role === "MANAGER") redirectUrl = routes.app.dashboardBase;
        if (token.role === "USER") redirectUrl = routes.app.perfil;
        
        return NextResponse.redirect(new URL(redirectUrl, req.url));
      }
    }

    // --- Regla 1: Proteger Rutas de Admin ---
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
        // Si no es ADMIN, no puede acceder a /admin
        return NextResponse.redirect(new URL(routes.public.home, req.url));
    }

    // --- Regla 2: Redirección dinámica para Managers ---
    if (token?.role === "MANAGER" && pathname === routes.app.dashboardBase) {
      try {
        const complex = await db.complex.findUnique({
          where: { managerId: token.id },
          select: { id: true },
        });

        if (complex) {
          return NextResponse.redirect(
            new URL(routes.app.dashboard(complex.id), req.url)
          );
        } else {
          console.error(`¡ERROR! No se encontró un complejo para el manager con ID: ${token.id}`);
          return NextResponse.redirect(new URL(routes.public.home, req.url));
        }
      } catch (error) {
          console.error("Error de base de datos en el middleware:", error);
          return NextResponse.redirect(new URL(routes.public.home, req.url));
      }
    }

    // --- Regla 3: Proteger el Dashboard (solo para Managers) ---
    if (pathname.startsWith(routes.app.dashboardBase)) {
        if (token?.role === "USER") {
            return NextResponse.redirect(new URL(routes.app.perfil, req.url));
        }
        if (token?.role === "ADMIN") {
            return NextResponse.redirect(new URL("/admin", req.url));
        }
    }

    // --- Regla 4: Proteger el Perfil (solo para Users) ---
    if (pathname.startsWith(routes.app.perfil) && token?.role !== "USER") {
        const redirectUrl = token?.role === "ADMIN" ? "/admin" : routes.app.dashboardBase;
        return NextResponse.redirect(new URL(redirectUrl, req.url));
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

// --- Matcher: Especifica en qué rutas se aplicará este middleware ---
export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/profile",
    "/login",
    "/register",
  ],
};