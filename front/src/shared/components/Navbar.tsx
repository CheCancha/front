"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { routes } from "@/routes";
import { useSession, signOut } from "next-auth/react";
import {
  UserCircle,
  Search,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Button } from "./ui/button";
import { cn } from "@/shared/lib/utils";


const NavbarSkeleton: React.FC = () => (
  <nav className="bg-background border-b sticky top-0 z-50 animate-pulse">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-full" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        <div className="hidden md:flex items-center space-x-6">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-9 w-28 bg-gray-200 rounded-md" />
        </div>
        <div className="flex md:hidden">
            <div className="h-8 w-8 bg-gray-200 rounded-md" />
        </div>
      </div>
    </div>
  </nav>
);

const Navbar: React.FC = () => {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 2. Usar el hook para saber la ruta actual
  const pathname = usePathname();
  const isHomePage = pathname === routes.public.home;

  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
      setIsDesktopMenuOpen(false);
      setIsMobileMenuOpen(false);
    } else { 
      setHidden(false);
    }
    setScrolled(latest > 50);
  });

  const user = session?.user;
  const isLoggedIn = status === "authenticated";
  const isAuthLoading = status === "loading";

  // Determinar si la barra debe ser transparente
  const isTransparent = isHomePage && !scrolled;

  const getDashboardUrl = () => {
    if (!user) return routes.public.home;
    switch (user.role) {
      case "ADMIN": return "/admin";
      case "MANAGER": return user.complexId ? routes.app.dashboard(user.complexId) : "/dashboard/create-complex";
      case "USER": return routes.app.perfil;
      default: return routes.public.home;
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
    return <NavbarSkeleton />;
  }

  return (
    <motion.nav
      variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      // 3. Aplicar estilos basados en si es transparente o no
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        isTransparent
          ? "bg-transparent border-transparent"
          : "bg-background border-b"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href={routes.public.home} className="flex items-center gap-2">
              <Image src="/logochecancha.png" alt="Logo de Che Cancha" height={40} width={40} className="rounded-md" />
              <span className={cn(
                "text-xl font-bold transition-colors",
                isTransparent ? "text-white" : "text-foreground"
              )}>
                Che Cancha
              </span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-6">
              {isLoggedIn ? (
                <>
                  <Link
                    href={routes.public.canchas}
                    className={cn(
                        "flex items-center gap-2 font-medium py-2 px-4 rounded-md transition duration-300",
                        isTransparent ? "text-white hover:bg-white/10" : "text-gray-800 hover:bg-gray-100"
                    )}
                  >
                    <Search size={16} />
                    Buscar Cancha
                  </Link>

                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                      className={cn(
                        "flex items-center gap-1.5 cursor-pointer rounded-md p-2 transition-colors",
                        isTransparent ? "hover:bg-white/10" : "hover:bg-gray-100"
                      )}
                    >
                      <span className={cn("font-medium transition-colors", isTransparent ? "text-white" : "text-gray-800")}>
                        {user?.name || "Usuario"}
                      </span>
                      <ChevronDown
                        size={16}
                        className={cn("transition-transform duration-200", isDesktopMenuOpen && "rotate-180", isTransparent ? "text-gray-300" : "text-gray-500")}
                      />
                    </button>

                    <AnimatePresence>
                      {isDesktopMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-30 border"
                        >
                          <Link href={routes.app.perfil} onClick={() => setIsDesktopMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><UserCircle size={16} />Mi Perfil</Link>
                          <Link href={getDashboardUrl()} onClick={() => setIsDesktopMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><LayoutDashboard size={16} />Mi Panel</Link>
                          <button onClick={() => { signOut({ callbackUrl: routes.public.home }); setIsDesktopMenuOpen(false);}} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"><LogOut size={16} />Cerrar Sesión</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href={routes.public.clubs}
                    className={cn("font-medium transition duration-300", isTransparent ? "text-white hover:text-gray-200" : "text-foreground hover:text-brand-orange")}
                  >
                    Software para canchas
                  </Link>
                  <Link href={routes.auth.ingreso}>
                    <Button variant={isTransparent ? 'secondary' : 'default'}>Iniciar Sesión</Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className={cn("inline-flex items-center justify-center p-2 rounded-md focus:outline-none transition-colors", isTransparent ? "bg-white/10 text-white hover:bg-white/20" : "bg-white text-gray-400 hover:bg-gray-100")}
            >
              <span className="sr-only">Abrir menú</span>
              {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-background border-t md:hidden" id="mobile-menu"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {isLoggedIn ? (
                <>
                  <div className="px-3 py-2 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center"><UserCircle size={24} className="text-gray-500" /></div>
                    <span className="font-semibold text-gray-800">{user?.name || "Usuario"}</span>
                  </div>
                  <hr />
                  <Link href={routes.public.canchas} onClick={() => setIsMobileMenuOpen(false)} className="w-full text-left flex items-center gap-3 px-3 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-100"><Search size={18} /> Buscar Cancha</Link>
                  <Link href={routes.app.perfil} onClick={() => setIsMobileMenuOpen(false)} className="w-full text-left flex items-center gap-3 px-3 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-100"><UserCircle size={18} /> Mi Perfil</Link>
                  <Link href={getDashboardUrl()} onClick={() => setIsMobileMenuOpen(false)} className="w-full text-left flex items-center gap-3 px-3 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-100"><LayoutDashboard size={18} /> Mi Panel</Link>
                  <button onClick={() => { signOut({ callbackUrl: routes.public.home }); setIsMobileMenuOpen(false);}} className="w-full text-left flex items-center gap-3 px-3 py-2 text-base font-medium rounded-md text-red-600 hover:bg-red-50 "><LogOut size={18} />Cerrar Sesión</button>
                </>
              ) : (
                <>
                  <Link href={routes.public.clubs} onClick={() => setIsMobileMenuOpen(false)} className="text-gray-700 hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium">Software para canchas</Link>
                  <Link href={routes.auth.ingreso} onClick={() => setIsMobileMenuOpen(false)} className="text-gray-700 hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium">Iniciar Sesión</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;