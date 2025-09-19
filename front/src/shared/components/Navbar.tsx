"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { routes } from "@/routes";
import { useSession, signOut } from "next-auth/react";
import {
  UserCircle,
  Search,
  LogOut,
  LayoutDashboard,
  Loader2,
} from "lucide-react";

const Navbar: React.FC = () => {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const user = session?.user;
  const isLoggedIn = status === "authenticated";
  const isAuthLoading = status === "loading";

  // --- LÓGICA DE ENLACE DINÁMICO ---
  const getDashboardUrl = () => {
    if (!user) return routes.public.home; // Fallback

    switch (user.role) {
      case "ADMIN":
        return "/admin"; // Ruta directa para el admin
      case "MANAGER":
        // Si es manager y tiene un complexId, va a su dashboard. Si no, a la página de creación.
        return user.complexId
          ? routes.app.dashboard(user.complexId)
          : "/dashboard/create-complex";
      case "USER":
        return routes.app.perfil;
      default:
        return routes.public.home;
    }
  };

  if (isAuthLoading) {
    return (
      <nav className="bg-background border-b sticky top-0 z-20 h-16 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </nav>
    );
  }

  return (
    <nav className="bg-background border-b sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href={routes.public.home} className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Logo de Che Cancha"
                height={40}
                width={40}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://placehold.co/40x40/000000/FFFFFF?text=CC";
                }}
              />
              <span className="text-foreground text-xl font-bold">
                CheCancha
              </span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-6">
              {isLoggedIn ? (
                <>
                  <Link
                    href={routes.public.canchas}
                    className="flex items-center gap-2 text-gray-600 hover:text-black font-medium py-2 px-4 rounded-md transition duration-300 border border-gray-200 bg-white hover:bg-gray-50"
                  >
                    <Search size={16} />
                    Buscar Cancha
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="flex items-center gap-2"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {user?.name || "Usuario"}
                      </span>
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserCircle size={20} className="text-gray-500" />
                      </div>
                    </button>
                    {isMenuOpen && (
                      <div className="absolute right-0 mt-5 w-48 bg-white rounded-md shadow-sm py-1 z-30 border">
                        {/* Link al perfil */}
                        <Link
                          href={routes.app.perfil}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <UserCircle size={16} />
                          Mi Perfil
                        </Link>

                        {/* Mi Panel según rol */}
                        <Link
                          href={getDashboardUrl()}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <LayoutDashboard size={16} />
                          Mi Panel
                        </Link>

                        {/* Cerrar sesión */}
                        <button
                          onClick={() => {
                            signOut({ callbackUrl: routes.public.home });
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <LogOut size={16} />
                          Cerrar Sesión
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href={routes.public.clubs}
                    className="text-foreground hover:text-brand-orange font-medium transition duration-300"
                  >
                    Software para canchas
                  </Link>
                  <Link
                    href={routes.auth.ingreso}
                    className="bg-black hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg transition duration-300"
                  >
                    Iniciar Sesión
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden"></div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
