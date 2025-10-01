"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";

const Navbar: React.FC = () => {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const isLoggedIn = status === "authenticated";
  const isAuthLoading = status === "loading";

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsDesktopMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

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
                src="/logochecancha.png"
                alt="Logo de Che Cancha"
                height={50}
                width={50}
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

          {/* --- Menú de Escritorio (oculto en móvil) --- */}
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

                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                      className="flex items-center gap-1.5 cursor-pointer rounded-md p-2 transition-colors hover:bg-gray-100"
                    >
                      <span className="text-sm font-medium text-gray-800">
                        {user?.name || "Usuario"}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-gray-500 transition-transform duration-200 ${
                          isDesktopMenuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isDesktopMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-30 border"
                        >
                          <Link
                            href={routes.app.perfil}
                            onClick={() => setIsDesktopMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <UserCircle size={16} />
                            Mi Perfil
                          </Link>
                          <Link
                            href={getDashboardUrl()}
                            onClick={() => setIsDesktopMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <LayoutDashboard size={16} />
                            Mi Panel
                          </Link>
                          <button
                            onClick={() => {
                              signOut({ callbackUrl: routes.public.home });
                              setIsDesktopMenuOpen(false);
                            }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <LogOut size={16} />
                            Cerrar Sesión
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                  <Link href={routes.auth.ingreso}>
                    <Button>Iniciar Sesión</Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* --- Botón de Menú Hamburguesa --- */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <span className="sr-only">Abrir menú</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* --- Panel del Menú Móvil --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
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
                  <div className="px-3 py-2 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserCircle size={24} className="text-gray-500" />
                    </div>
                    <span className="font-semibold text-gray-800">
                      {user?.name || "Usuario"}
                    </span>
                  </div>
                  <hr />
                  <Link
                    href={routes.public.canchas}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-gray-700 hover:bg-gray-100  px-3 py-2 rounded-md text-base font-medium"
                  >
                    <Search size={18} /> Buscar Cancha
                  </Link>
                  <Link
                    href={routes.app.perfil}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-gray-700 hover:bg-gray-100  px-3 py-2 rounded-md text-base font-medium"
                  >
                    <UserCircle size={18} /> Mi Perfil
                  </Link>
                  <Link
                    href={getDashboardUrl()}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-gray-700 hover:bg-gray-100  px-3 py-2 rounded-md text-base font-medium"
                  >
                    <LayoutDashboard size={18} /> Mi Panel
                  </Link>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: routes.public.home });
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <LogOut size={18} />
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={routes.public.clubs}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-700 hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium"
                  >
                    Software para canchas
                  </Link>
                  <Link
                    href={routes.auth.ingreso}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-700 hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium"
                  >
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
