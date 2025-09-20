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
  Menu, // Icono de hamburguesa
  X,      // Icono de cierre
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // Para animaciones

const Navbar: React.FC = () => {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const user = session?.user;
  const isLoggedIn = status === "authenticated";
  const isAuthLoading = status === "loading";

  // --- LÓGICA DE ENLACE DINÁMICO ---
  const getDashboardUrl = () => {
    if (!user) return routes.public.home;
    switch (user.role) {
      case "ADMIN":
        return "/admin";
      case "MANAGER":
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
          {/* --- Logo --- */}
          <div className="flex-shrink-0">
            <Link href={routes.public.home} className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Logo de Che Cancha"
                height={40}
                width={40}
                onError={(e) => { e.currentTarget.src = "https://placehold.co/40x40/000000/FFFFFF?text=CC"; }}
              />
              <span className="text-foreground text-xl font-bold">CheCancha</span>
            </Link>
          </div>

          {/* --- Menú de Escritorio (oculto en móvil) --- */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-6">
              {isLoggedIn ? (
                <>
                  <Link href={routes.public.canchas} className="flex items-center gap-2 text-gray-600 hover:text-black font-medium py-2 px-4 rounded-md transition duration-300 border border-gray-200 bg-white hover:bg-gray-50">
                    <Search size={16} />
                    Buscar Cancha
                  </Link>
                  {/* ... (Tu menú de usuario de escritorio se mantiene igual) ... */}
                </>
              ) : (
                <>
                  <Link href={routes.public.clubs} className="text-foreground hover:text-brand-orange font-medium transition duration-300">
                    Software para canchas
                  </Link>
                  <Link href={routes.auth.ingreso} className="bg-black hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg transition duration-300">
                    Iniciar Sesión
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* --- Botón de Menú Hamburguesa (visible en móvil) --- */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Abrir menú principal</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* --- Panel del Menú Móvil --- */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden"
            id="mobile-menu"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              {isLoggedIn ? (
                <>
                  {/* --- Info del Usuario en Móvil --- */}
                  <div className="px-3 py-2 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                       <UserCircle size={24} className="text-gray-500" />
                    </div>
                    <span className="font-semibold text-gray-800">{user?.name || "Usuario"}</span>
                  </div>
                  <hr/>
                  {/* --- Enlaces de Usuario en Móvil --- */}
                  <Link href={routes.public.canchas} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-gray-700 hover:bg-gray-100  px-3 py-2 rounded-md text-base font-medium">
                    <Search size={18}/> Buscar Cancha
                  </Link>
                  <Link href={routes.app.perfil} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-gray-700 hover:bg-gray-100  px-3 py-2 rounded-md text-base font-medium">
                    <UserCircle size={18}/> Mi Perfil
                  </Link>
                  <Link href={getDashboardUrl()} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-gray-700 hover:bg-gray-100  px-3 py-2 rounded-md text-base font-medium">
                    <LayoutDashboard size={18}/> Mi Panel
                  </Link>
                   <button onClick={() => { signOut({ callbackUrl: routes.public.home }); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md">
                     <LogOut size={18} />
                     Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  {/* --- Enlaces de Invitado en Móvil --- */}
                  <Link href={routes.public.clubs} onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium">
                    Software para canchas
                  </Link>
                  <Link href={routes.auth.ingreso} onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium">
                    Iniciar Sesión
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
