"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { routes } from "@/routes";
import { useSession, signOut } from "next-auth/react";
// import { useNotificationStore } from "@/app/store/notificationStore"; // <-- Importamos el store de Zustand
import {
  UserCircle,
  Search,
  LogOut,
  LayoutDashboard,
  Loader2,
} from "lucide-react";

const Navbar: React.FC = () => {
  // 1. Hook de NextAuth para la sesión (AUTENTICACIÓN)
  const { data: session, status } = useSession();

  // 2. Hook de Zustand para el estado de la UI (NOTIFICACIONES)
  // const { count: notificationCount } = useNotificationStore();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const user = session?.user;
  const isLoggedIn = status === "authenticated";
  const isAuthLoading = status === "loading";

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
                  {/* Ejemplo de uso de Zustand: Icono de Notificaciones */}
                  {/* <button className="relative text-gray-600 hover:text-black">
                    <Bell size={22} />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        {notificationCount}
                      </span>
                    )}
                  </button> */}

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
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-30 border">
                        <Link
                          href={routes.app.dashboardBase}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <LayoutDashboard size={16} />
                          Mi Dashboard
                        </Link>
                        <button
                          onClick={() => {
                            signOut({ callbackUrl: routes.public.home });
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
